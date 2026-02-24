import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, sql, gte, lte, count } from 'drizzle-orm';
import { db } from '../../../../../db';
import { user, captions, titles, videoScripts, thumbnailsTable, socialPostsTable, enhancedPostsTable } from '../../../../../db/schema';
import { getServerSession } from '../../../../../lib/auth-server';

// Helper function to check if user is admin
async function isAdmin() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return false;
    
    const adminUser = await db.query.user.findFirst({
      where: eq(user.email, session.user.email),
    });
    
    return adminUser?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Tool credit costs (you can adjust these)
const TOOL_CREDITS = {
  captions: 1,
  titles: 1,
  videoScripts: 5,
  thumbnails: 3,
  socialPosts: 2,
  enhancedPosts: 4
};

// ==================== GET - Fetch credit statistics ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year

    // Get date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Format dates for comparison with string dates in tables
    const startDateStr = startDate.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    // 1. Get all users with their current credits
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        role: user.role
      })
      .from(user)
      .where(
        or(
          eq(user.role, 'creator'),
          eq(user.role, 'analyst')
        )
      );

    // 2. Calculate usage statistics per user from content tables
    const userStats = await Promise.all(
      users.map(async (u) => {
        // Get counts from each content table for this user
        const captionsCount = await db
          .select({ count: count() })
          .from(captions)
          .where(
            and(
              eq(captions.userId, u.id),
              gte(captions.createdOn, startDateStr)
            )
          );
        
        const titlesCount = await db
          .select({ count: count() })
          .from(titles)
          .where(
            and(
              eq(titles.userId, u.id),
              gte(titles.createdOn, startDateStr)
            )
          );
        
        const scriptsCount = await db
          .select({ count: count() })
          .from(videoScripts)
          .where(
            and(
              eq(videoScripts.userId, u.id),
              gte(videoScripts.createdOn, startDateStr)
            )
          );
        
        const thumbnailsCount = await db
          .select({ count: count() })
          .from(thumbnailsTable)
          .where(
            and(
              eq(thumbnailsTable.userId, u.id),
              gte(thumbnailsTable.createdOn, startDateStr)
            )
          );
        
        const socialPostsCount = await db
          .select({ count: count() })
          .from(socialPostsTable)
          .where(
            and(
              eq(socialPostsTable.userId, u.id),
              gte(socialPostsTable.createdOn, startDateStr)
            )
          );
        
        const enhancedPostsCount = await db
          .select({ count: count() })
          .from(enhancedPostsTable)
          .where(
            and(
              eq(enhancedPostsTable.userId, u.id),
              gte(enhancedPostsTable.createdOn, startDateStr)
            )
          );

        // Calculate total credits used
        const totalCreditsUsed = 
          (captionsCount[0]?.count || 0) * TOOL_CREDITS.captions +
          (titlesCount[0]?.count || 0) * TOOL_CREDITS.titles +
          (scriptsCount[0]?.count || 0) * TOOL_CREDITS.videoScripts +
          (thumbnailsCount[0]?.count || 0) * TOOL_CREDITS.thumbnails +
          (socialPostsCount[0]?.count || 0) * TOOL_CREDITS.socialPosts +
          (enhancedPostsCount[0]?.count || 0) * TOOL_CREDITS.enhancedPosts;

        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          currentCredits: u.credits || 0,
          totalCreditsUsed,
          lastActivity: new Date().toISOString(), // You might want to track this properly
          toolUsage: {
            captions: captionsCount[0]?.count || 0,
            titles: titlesCount[0]?.count || 0,
            videoScripts: scriptsCount[0]?.count || 0,
            thumbnails: thumbnailsCount[0]?.count || 0,
            socialPosts: socialPostsCount[0]?.count || 0,
            enhancedPosts: enhancedPostsCount[0]?.count || 0
          }
        };
      })
    );

    // 3. Calculate tool usage totals
    const totalCaptions = await db
      .select({ count: count() })
      .from(captions)
      .where(gte(captions.createdOn, startDateStr));
    
    const totalTitles = await db
      .select({ count: count() })
      .from(titles)
      .where(gte(titles.createdOn, startDateStr));
    
    const totalScripts = await db
      .select({ count: count() })
      .from(videoScripts)
      .where(gte(videoScripts.createdOn, startDateStr));
    
    const totalThumbnails = await db
      .select({ count: count() })
      .from(thumbnailsTable)
      .where(gte(thumbnailsTable.createdOn, startDateStr));
    
    const totalSocialPosts = await db
      .select({ count: count() })
      .from(socialPostsTable)
      .where(gte(socialPostsTable.createdOn, startDateStr));
    
    const totalEnhancedPosts = await db
      .select({ count: count() })
      .from(enhancedPostsTable)
      .where(gte(enhancedPostsTable.createdOn, startDateStr));

    // 4. Calculate tool usage for chart
    const toolUsage = [
      {
        toolName: 'captions',
        usageCount: totalCaptions[0]?.count || 0,
        totalCreditsUsed: (totalCaptions[0]?.count || 0) * TOOL_CREDITS.captions,
        uniqueUsers: await getUniqueUsersCount(captions, startDateStr)
      },
      {
        toolName: 'titles',
        usageCount: totalTitles[0]?.count || 0,
        totalCreditsUsed: (totalTitles[0]?.count || 0) * TOOL_CREDITS.titles,
        uniqueUsers: await getUniqueUsersCount(titles, startDateStr)
      },
      {
        toolName: 'videoScripts',
        usageCount: totalScripts[0]?.count || 0,
        totalCreditsUsed: (totalScripts[0]?.count || 0) * TOOL_CREDITS.videoScripts,
        uniqueUsers: await getUniqueUsersCount(videoScripts, startDateStr)
      },
      {
        toolName: 'thumbnails',
        usageCount: totalThumbnails[0]?.count || 0,
        totalCreditsUsed: (totalThumbnails[0]?.count || 0) * TOOL_CREDITS.thumbnails,
        uniqueUsers: await getUniqueUsersCount(thumbnailsTable, startDateStr)
      },
      {
        toolName: 'socialPosts',
        usageCount: totalSocialPosts[0]?.count || 0,
        totalCreditsUsed: (totalSocialPosts[0]?.count || 0) * TOOL_CREDITS.socialPosts,
        uniqueUsers: await getUniqueUsersCount(socialPostsTable, startDateStr)
      },
      {
        toolName: 'enhancedPosts',
        usageCount: totalEnhancedPosts[0]?.count || 0,
        totalCreditsUsed: (totalEnhancedPosts[0]?.count || 0) * TOOL_CREDITS.enhancedPosts,
        uniqueUsers: await getUniqueUsersCount(enhancedPostsTable, startDateStr)
      }
    ].filter(tool => tool.usageCount > 0); // Only show tools with usage

    // 5. Calculate overall statistics
    const totalCreditsUsed = toolUsage.reduce((sum, tool) => sum + tool.totalCreditsUsed, 0);
    const totalCreditsIssued = users.reduce((sum, u) => sum + (u.credits || 0), 0);
    const activeUsers = userStats.filter(u => u.totalCreditsUsed > 0).length;

    // 6. Generate daily trend data (simplified - you can enhance this)
    const dailyTrend = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyTrend.push({
        date: dateStr,
        purchases: Math.floor(Math.random() * 100) + 50, // Placeholder - replace with actual purchase data
        usage: Math.floor(Math.random() * 200) + 100,    // Placeholder - replace with actual usage data
        transactions: Math.floor(Math.random() * 30) + 10 // Placeholder
      });
    }
    dailyTrend.reverse();

    // 7. Tool pricing
    const toolPricing = Object.entries(TOOL_CREDITS).map(([tool_name, credits_required], index) => ({
      id: index + 1,
      tool_name,
      credits_required
    }));

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: now
      },
      overall: {
        totalCreditsIssued,
        totalCreditsUsed,
        totalPurchases: users.length, // Placeholder - replace with actual purchase count
        totalTransactions: toolUsage.reduce((sum, tool) => sum + tool.usageCount, 0),
        averageUsagePerUser: activeUsers > 0 ? totalCreditsUsed / activeUsers : 0,
        activeUsers
      },
      userCredits: userStats.sort((a, b) => b.totalCreditsUsed - a.totalCreditsUsed),
      toolUsage,
      dailyTrend,
      contentStats: {
        captions: totalCaptions[0]?.count || 0,
        titles: totalTitles[0]?.count || 0,
        videoScripts: totalScripts[0]?.count || 0,
        thumbnails: totalThumbnails[0]?.count || 0,
        socialPosts: totalSocialPosts[0]?.count || 0,
        enhancedPosts: totalEnhancedPosts[0]?.count || 0,
      },
      toolPricing
    });

  } catch (error) {
    console.error('Error fetching credit statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit statistics: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Helper function to get unique users count for a tool
async function getUniqueUsersCount(table: any, startDate: string) {
  try {
    const result = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT ${table.userId})` 
      })
      .from(table)
      .where(
        and(
          gte(table.createdOn, startDate),
          sql`${table.userId} IS NOT NULL`
        )
      );
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

// Helper function for OR condition
function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}