import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, sql, gte, lte, count } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { user,captions,videoScripts,titles,thumbnailsTable,socialPostsTable,enhancedPostsTable } from '../../../../../../db/schema';
import { getServerSession } from '../../../../../../lib/auth-server';

// Define a type for paginated content result
type PaginatedContentResult = [any[], number];

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

// ==================== GET - Fetch content activity data ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const type = searchParams.get('type') || 'all';
    const userId = searchParams.get('userId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Get date range based on period or custom dates
    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }
    }

    // Format dates for database queries
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    switch (type) {
      case 'overview':
        return await getContentOverview(startDateStr, endDateStr);
      
      case 'users':
        return await getUserContentActivity(userId, startDateStr, endDateStr);
      
      case 'trends':
        return await getContentTrends(startDateStr, endDateStr, period);
      
      case 'details':
        return await getDetailedContent(startDateStr, endDateStr, searchParams);
      
      case 'export':
        return await exportContentData(startDateStr, endDateStr, searchParams);
      
      case 'all':
      default:
        return await getAllContentActivity(startDateStr, endDateStr);
    }

  } catch (error) {
    console.error('Error fetching content activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content activity: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// ==================== POST - Content actions (delete, archive, etc.) ====================
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, contentType, contentId } = body;

    switch (action) {
      case 'delete':
        return await deleteContent(contentType, contentId);
      
      case 'delete-user-content':
        return await deleteUserContent(body.userId, body.contentType);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in content action:', error);
    return NextResponse.json(
      { error: 'Failed to process action: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Helper function to get content overview
async function getContentOverview(startDate: string, endDate: string) {
  // Get counts from each content table
  const [captionsCount, titlesCount, scriptsCount, thumbnailsCount, socialPostsCount, enhancedPostsCount] = 
    await Promise.all([
      db.select({ count: count() }).from(captions).where(
        and(gte(captions.createdOn, startDate), lte(captions.createdOn, endDate))
      ),
      db.select({ count: count() }).from(titles).where(
        and(gte(titles.createdOn, startDate), lte(titles.createdOn, endDate))
      ),
      db.select({ count: count() }).from(videoScripts).where(
        and(gte(videoScripts.createdOn, startDate), lte(videoScripts.createdOn, endDate))
      ),
      db.select({ count: count() }).from(thumbnailsTable).where(
        and(gte(thumbnailsTable.createdOn, startDate), lte(thumbnailsTable.createdOn, endDate))
      ),
      db.select({ count: count() }).from(socialPostsTable).where(
        and(gte(socialPostsTable.createdOn, startDate), lte(socialPostsTable.createdOn, endDate))
      ),
      db.select({ count: count() }).from(enhancedPostsTable).where(
        and(gte(enhancedPostsTable.createdOn, startDate), lte(enhancedPostsTable.createdOn, endDate))
      )
    ]);

  // Get unique users per content type
  const [captionsUsers, titlesUsers, scriptsUsers, thumbnailsUsers, socialUsers, enhancedUsers] = 
    await Promise.all([
      getUniqueUsersCount(captions, 'userId', startDate, endDate),
      getUniqueUsersCount(titles, 'userId', startDate, endDate),
      getUniqueUsersCount(videoScripts, 'userId', startDate, endDate),
      getUniqueUsersCount(thumbnailsTable, 'userId', startDate, endDate),
      getUniqueUsersCount(socialPostsTable, 'userId', startDate, endDate),
      getUniqueUsersCount(enhancedPostsTable, 'userId', startDate, endDate)
    ]);

  const totalContent = 
    (captionsCount[0]?.count || 0) +
    (titlesCount[0]?.count || 0) +
    (scriptsCount[0]?.count || 0) +
    (thumbnailsCount[0]?.count || 0) +
    (socialPostsCount[0]?.count || 0) +
    (enhancedPostsCount[0]?.count || 0);

  const totalActiveUsers = new Set([
    ...captionsUsers,
    ...titlesUsers,
    ...scriptsUsers,
    ...thumbnailsUsers,
    ...socialUsers,
    ...enhancedUsers
  ]).size;

  return NextResponse.json({
    period: { start: startDate, end: endDate },
    summary: {
      totalContent,
      totalActiveUsers,
      averagePerUser: totalActiveUsers > 0 ? Math.round(totalContent / totalActiveUsers) : 0
    },
    byType: [
      { type: 'captions', count: captionsCount[0]?.count || 0, uniqueUsers: captionsUsers.length },
      { type: 'titles', count: titlesCount[0]?.count || 0, uniqueUsers: titlesUsers.length },
      { type: 'videoScripts', count: scriptsCount[0]?.count || 0, uniqueUsers: scriptsUsers.length },
      { type: 'thumbnails', count: thumbnailsCount[0]?.count || 0, uniqueUsers: thumbnailsUsers.length },
      { type: 'socialPosts', count: socialPostsCount[0]?.count || 0, uniqueUsers: socialUsers.length },
      { type: 'enhancedPosts', count: enhancedPostsCount[0]?.count || 0, uniqueUsers: enhancedUsers.length }
    ]
  });
}

// Helper function to get user content activity
async function getUserContentActivity(userId: string | null, startDate: string, endDate: string) {
  if (userId) {
    // Get activity for specific user
    const [userInfo, captionsData, titlesData, scriptsData, thumbnailsData, socialData, enhancedData] = 
      await Promise.all([
        db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: { id: true, name: true, email: true, role: true, credits: true, createdAt: true }
        }),
        db.select().from(captions).where(
          and(eq(captions.userId, userId), gte(captions.createdOn, startDate), lte(captions.createdOn, endDate))
        ).orderBy(desc(captions.createdOn)),
        db.select().from(titles).where(
          and(eq(titles.userId, userId), gte(titles.createdOn, startDate), lte(titles.createdOn, endDate))
        ).orderBy(desc(titles.createdOn)),
        db.select().from(videoScripts).where(
          and(eq(videoScripts.userId, userId), gte(videoScripts.createdOn, startDate), lte(videoScripts.createdOn, endDate))
        ).orderBy(desc(videoScripts.createdOn)),
        db.select().from(thumbnailsTable).where(
          and(eq(thumbnailsTable.userId, userId), gte(thumbnailsTable.createdOn, startDate), lte(thumbnailsTable.createdOn, endDate))
        ).orderBy(desc(thumbnailsTable.createdOn)),
        db.select().from(socialPostsTable).where(
          and(eq(socialPostsTable.userId, userId), gte(socialPostsTable.createdOn, startDate), lte(socialPostsTable.createdOn, endDate))
        ).orderBy(desc(socialPostsTable.createdOn)),
        db.select().from(enhancedPostsTable).where(
          and(eq(enhancedPostsTable.userId, userId), gte(enhancedPostsTable.createdOn, startDate), lte(enhancedPostsTable.createdOn, endDate))
        ).orderBy(desc(enhancedPostsTable.createdOn))
      ]);

    return NextResponse.json({
      user: userInfo,
      activity: {
        captions: captionsData,
        titles: titlesData,
        videoScripts: scriptsData,
        thumbnails: thumbnailsData,
        socialPosts: socialData,
        enhancedPosts: enhancedData
      },
      summary: {
        total: captionsData.length + titlesData.length + scriptsData.length + 
                thumbnailsData.length + socialData.length + enhancedData.length,
        byType: {
          captions: captionsData.length,
          titles: titlesData.length,
          videoScripts: scriptsData.length,
          thumbnails: thumbnailsData.length,
          socialPosts: socialData.length,
          enhancedPosts: enhancedData.length
        }
      }
    });
  } else {
    // Get all users with their content counts
    const users = await db.query.user.findMany({
      where: sql`${user.role} IN ('creator', 'analyst')`,
      columns: { id: true, name: true, email: true, role: true, credits: true, createdAt: true }
    });

    const userActivity = await Promise.all(
      users.map(async (u) => {
        const [captionsCount, titlesCount, scriptsCount, thumbnailsCount, socialCount, enhancedCount] = 
          await Promise.all([
            db.select({ count: count() }).from(captions).where(
              and(eq(captions.userId, u.id), gte(captions.createdOn, startDate), lte(captions.createdOn, endDate))
            ),
            db.select({ count: count() }).from(titles).where(
              and(eq(titles.userId, u.id), gte(titles.createdOn, startDate), lte(titles.createdOn, endDate))
            ),
            db.select({ count: count() }).from(videoScripts).where(
              and(eq(videoScripts.userId, u.id), gte(videoScripts.createdOn, startDate), lte(videoScripts.createdOn, endDate))
            ),
            db.select({ count: count() }).from(thumbnailsTable).where(
              and(eq(thumbnailsTable.userId, u.id), gte(thumbnailsTable.createdOn, startDate), lte(thumbnailsTable.createdOn, endDate))
            ),
            db.select({ count: count() }).from(socialPostsTable).where(
              and(eq(socialPostsTable.userId, u.id), gte(socialPostsTable.createdOn, startDate), lte(socialPostsTable.createdOn, endDate))
            ),
            db.select({ count: count() }).from(enhancedPostsTable).where(
              and(eq(enhancedPostsTable.userId, u.id), gte(enhancedPostsTable.createdOn, startDate), lte(enhancedPostsTable.createdOn, endDate))
            )
          ]);

        const total = 
          (captionsCount[0]?.count || 0) +
          (titlesCount[0]?.count || 0) +
          (scriptsCount[0]?.count || 0) +
          (thumbnailsCount[0]?.count || 0) +
          (socialCount[0]?.count || 0) +
          (enhancedCount[0]?.count || 0);

        return {
          ...u,
          activity: {
            captions: captionsCount[0]?.count || 0,
            titles: titlesCount[0]?.count || 0,
            videoScripts: scriptsCount[0]?.count || 0,
            thumbnails: thumbnailsCount[0]?.count || 0,
            socialPosts: socialCount[0]?.count || 0,
            enhancedPosts: enhancedCount[0]?.count || 0,
            total
          }
        };
      })
    );

    return NextResponse.json({
      users: userActivity.filter(u => u.activity.total > 0).sort((a, b) => b.activity.total - a.activity.total)
    });
  }
}

// Helper function to get content trends
async function getContentTrends(startDate: string, endDate: string, period: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get daily trends for each content type
  const dailyData = [];
  for (let i = 0; i <= daysDiff; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const [captionsCount, titlesCount, scriptsCount, thumbnailsCount, socialCount, enhancedCount] = 
      await Promise.all([
        db.select({ count: count() }).from(captions).where(eq(captions.createdOn, dateStr)),
        db.select({ count: count() }).from(titles).where(eq(titles.createdOn, dateStr)),
        db.select({ count: count() }).from(videoScripts).where(eq(videoScripts.createdOn, dateStr)),
        db.select({ count: count() }).from(thumbnailsTable).where(eq(thumbnailsTable.createdOn, dateStr)),
        db.select({ count: count() }).from(socialPostsTable).where(eq(socialPostsTable.createdOn, dateStr)),
        db.select({ count: count() }).from(enhancedPostsTable).where(eq(enhancedPostsTable.createdOn, dateStr))
      ]);

    dailyData.push({
      date: dateStr,
      captions: captionsCount[0]?.count || 0,
      titles: titlesCount[0]?.count || 0,
      videoScripts: scriptsCount[0]?.count || 0,
      thumbnails: thumbnailsCount[0]?.count || 0,
      socialPosts: socialCount[0]?.count || 0,
      enhancedPosts: enhancedCount[0]?.count || 0,
      total: (captionsCount[0]?.count || 0) + (titlesCount[0]?.count || 0) + 
             (scriptsCount[0]?.count || 0) + (thumbnailsCount[0]?.count || 0) + 
             (socialCount[0]?.count || 0) + (enhancedCount[0]?.count || 0)
    });
  }

  // Get platform distribution for social posts
  const platformDistribution = await db
    .select({
      platform: socialPostsTable.platform,
      count: count()
    })
    .from(socialPostsTable)
    .where(and(gte(socialPostsTable.createdOn, startDate), lte(socialPostsTable.createdOn, endDate)))
    .groupBy(socialPostsTable.platform);

  // Get enhancement type distribution
  const enhancementDistribution = await db
    .select({
      type: enhancedPostsTable.enhancementType,
      count: count()
    })
    .from(enhancedPostsTable)
    .where(and(gte(enhancedPostsTable.createdOn, startDate), lte(enhancedPostsTable.createdOn, endDate)))
    .groupBy(enhancedPostsTable.enhancementType);

  return NextResponse.json({
    daily: dailyData,
    platforms: platformDistribution,
    enhancements: enhancementDistribution,
    summary: {
      total: dailyData.reduce((sum, d) => sum + d.total, 0),
      averagePerDay: daysDiff > 0 ? Math.round(dailyData.reduce((sum, d) => sum + d.total, 0) / daysDiff) : 0,
      peakDay: dailyData.reduce((max, d) => d.total > max.total ? d : max, dailyData[0] || { total: 0 })
    }
  });
}

// Helper function to get detailed content
async function getDetailedContent(startDate: string, endDate: string, searchParams: URLSearchParams) {
  const contentType = searchParams.get('contentType') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search') || '';

  let results: any[] = [];
  let totalCount: number = 0;

  if (contentType === 'all' || contentType === 'captions') {
    const result: PaginatedContentResult = await getPaginatedContent(
      captions, 
      ['userInput', 'plateform', 'tone'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'captions'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  if (contentType === 'all' || contentType === 'titles') {
    const result: PaginatedContentResult = await getPaginatedContent(
      titles, 
      ['userInput', 'contentType', 'tone'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'titles'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  if (contentType === 'all' || contentType === 'videoScripts') {
    const result: PaginatedContentResult = await getPaginatedContent(
      videoScripts, 
      ['userInput', 'videoType', 'tone'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'videoScripts'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  if (contentType === 'all' || contentType === 'thumbnails') {
    const result: PaginatedContentResult = await getPaginatedContent(
      thumbnailsTable, 
      ['userInput'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'thumbnails'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  if (contentType === 'all' || contentType === 'socialPosts') {
    const result: PaginatedContentResult = await getPaginatedContent(
      socialPostsTable, 
      ['userInput', 'platform'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'socialPosts'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  if (contentType === 'all' || contentType === 'enhancedPosts') {
    const result: PaginatedContentResult = await getPaginatedContent(
      enhancedPostsTable, 
      ['enhancementType', 'userInput'], 
      startDate, 
      endDate, 
      limit, 
      offset, 
      search,
      'enhancedPosts'
    );
    const data = result[0];
    const count = result[1];
    results = results.concat(data);
    totalCount = totalCount + count;
  }

  // Sort by date
  results.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());

  return NextResponse.json({
    content: results.slice(0, limit),
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: results.length > limit
    }
  });
}

// Helper function to export content data
async function exportContentData(startDate: string, endDate: string, searchParams: URLSearchParams) {
  const format = searchParams.get('format') || 'json';
  const contentType = searchParams.get('contentType') || 'all';

  const response = await getDetailedContent(startDate, endDate, searchParams);
  const data = (await response.json()).content;

  if (format === 'csv') {
    // Convert to CSV format
    const headers = ['id', 'type', 'userEmail', 'userId', 'createdOn', 'details'];
    const csvRows = [headers.join(',')];
    
    data.forEach((item: any) => {
      const details = JSON.stringify(item.content || {}).replace(/,/g, ';');
      const row = [
        item.id,
        item.contentType,
        item.userEmail || '',
        item.userId || '',
        item.createdOn,
        `"${details}"`
      ];
      csvRows.push(row.join(','));
    });

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=content-export-${startDate}-to-${endDate}.csv`
      }
    });
  }

  return NextResponse.json(data);
}

// Helper function to delete content
async function deleteContent(contentType: string, contentId: number) {
  let table;
  switch (contentType) {
    case 'captions':
      table = captions;
      break;
    case 'titles':
      table = titles;
      break;
    case 'videoScripts':
      table = videoScripts;
      break;
    case 'thumbnails':
      table = thumbnailsTable;
      break;
    case 'socialPosts':
      table = socialPostsTable;
      break;
    case 'enhancedPosts':
      table = enhancedPostsTable;
      break;
    default:
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  await db.delete(table).where(eq(table.id, contentId));

  return NextResponse.json({ success: true, message: 'Content deleted successfully' });
}

// Helper function to delete all user content
async function deleteUserContent(userId: string, contentType?: string) {
  if (contentType) {
    // Delete specific content type for user
    switch (contentType) {
      case 'captions':
        await db.delete(captions).where(eq(captions.userId, userId));
        break;
      case 'titles':
        await db.delete(titles).where(eq(titles.userId, userId));
        break;
      case 'videoScripts':
        await db.delete(videoScripts).where(eq(videoScripts.userId, userId));
        break;
      case 'thumbnails':
        await db.delete(thumbnailsTable).where(eq(thumbnailsTable.userId, userId));
        break;
      case 'socialPosts':
        await db.delete(socialPostsTable).where(eq(socialPostsTable.userId, userId));
        break;
      case 'enhancedPosts':
        await db.delete(enhancedPostsTable).where(eq(enhancedPostsTable.userId, userId));
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
  } else {
    // Delete all content for user
    await Promise.all([
      db.delete(captions).where(eq(captions.userId, userId)),
      db.delete(titles).where(eq(titles.userId, userId)),
      db.delete(videoScripts).where(eq(videoScripts.userId, userId)),
      db.delete(thumbnailsTable).where(eq(thumbnailsTable.userId, userId)),
      db.delete(socialPostsTable).where(eq(socialPostsTable.userId, userId)),
      db.delete(enhancedPostsTable).where(eq(enhancedPostsTable.userId, userId))
    ]);
  }

  return NextResponse.json({ success: true, message: 'User content deleted successfully' });
}

// Helper function to get unique users count
async function getUniqueUsersCount(table: any, userIdField: string, startDate: string, endDate: string) {
  const result = await db
    .select({ 
      userId: sql<string>`DISTINCT ${table[userIdField]}` 
    })
    .from(table)
    .where(
      and(
        gte(table.createdOn, startDate),
        lte(table.createdOn, endDate),
        sql`${table[userIdField]} IS NOT NULL`
      )
    );
  return result.map(r => r.userId);
}

// Helper function for paginated content - COMPLETELY REWRITTEN
async function getPaginatedContent(
  table: any, 
  searchFields: string[], 
  startDate: string, 
  endDate: string, 
  limit: number, 
  offset: number, 
  search: string, 
  contentType: string
): Promise<PaginatedContentResult> {
  // Build base conditions
  const baseConditions = [
    gte(table.createdOn, startDate),
    lte(table.createdOn, endDate)
  ];

  // Build search conditions if search term exists
  let whereCondition;
  if (search && search.trim() !== '') {
    const searchConditions = searchFields.map(field => 
      sql`${table[field]} ILIKE ${'%' + search + '%'}`
    );
    // Combine base conditions with search conditions
    whereCondition = and(
      ...baseConditions,
      sql`(${sql.join(searchConditions, sql` OR `)})`
    );
  } else {
    whereCondition = and(...baseConditions);
  }

  // Execute main query with all conditions
  const data = await db
    .select()
    .from(table)
    .where(whereCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(table.createdOn));

  // Get total count (without search for accurate pagination)
  const countResult = await db
    .select({ count: count() })
    .from(table)
    .where(and(...baseConditions));

  const enrichedData = data.map(item => ({
    ...item,
    contentType
  }));

  return [enrichedData, countResult[0]?.count || 0];
}

// Helper function to get all content activity
async function getAllContentActivity(startDate: string, endDate: string) {
  const [overviewResponse, userActivityResponse, trendsResponse] = await Promise.all([
    getContentOverview(startDate, endDate),
    getUserContentActivity(null, startDate, endDate),
    getContentTrends(startDate, endDate, 'month')
  ]);

  const overview = await overviewResponse.json();
  const userActivity = await userActivityResponse.json();
  const trends = await trendsResponse.json();

  const recentResponse = await getDetailedContent(startDate, endDate, new URLSearchParams({ limit: '20' }));
  const recent = await recentResponse.json();

  return NextResponse.json({
    overview: overview,
    topUsers: userActivity.users?.slice(0, 10),
    trends: trends,
    recent: recent
  });
}