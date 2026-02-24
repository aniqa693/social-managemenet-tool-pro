// app/api/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { captions, videoScripts, titles } from '../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getServerSession } from '../../../../lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Get user session from Better Auth
    const session = await getServerSession();
    
    if (!session?.user || !session.user.email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'Please log in to view your history'
        },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const userId = session.user.id;

    console.log('📋 Fetching history for user:', userEmail, 'ID:', userId);

    // Set a timeout for the entire operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Fetch data from all three tables with smaller limits
      const [captionsData, titlesData, scriptsData] = await Promise.all([
        // Captions - limited to 20
        db.select({
          id: captions.id,
          type: sql`'caption'`.as('type'),
          userInput: captions.userInput,
          content: captions.content,
          platform: captions.plateform,
          tone: captions.tone,
          userEmail: captions.userEmail,
          userId: captions.userId,
          createdOn: captions.createdOn,
        })
        .from(captions)
        .where(eq(captions.userEmail, userEmail))
        .orderBy(desc(captions.createdOn))
        .limit(20),

        // Titles - limited to 20
        db.select({
          id: titles.id,
          type: sql`'title'`.as('type'),
          userInput: titles.userInput,
          content: titles.content,
          contentType: titles.contentType,
          tone: titles.tone,
          userEmail: titles.userEmail,
          userId: titles.userId,
          createdOn: titles.createdOn,
        })
        .from(titles)
        .where(eq(titles.userEmail, userEmail))
        .orderBy(desc(titles.createdOn))
        .limit(20),

        // Video Scripts - limited to 20
        db.select({
          id: videoScripts.id,
          type: sql`'script'`.as('type'),
          userInput: videoScripts.userInput,
          content: videoScripts.content,
          videoType: videoScripts.videoType,
          tone: videoScripts.tone,
          duration: videoScripts.duration,
          userEmail: videoScripts.userEmail,
          userId: videoScripts.userId,
          createdOn: videoScripts.createdOn,
        })
        .from(videoScripts)
        .where(eq(videoScripts.userEmail, userEmail))
        .orderBy(desc(videoScripts.createdOn))
        .limit(20),
      ]);

      clearTimeout(timeoutId);

      // Combine all results
      const allHistory = [
        ...captionsData,
        ...titlesData,
        ...scriptsData
      ];

      // Sort by date (handle null dates)
      allHistory.sort((a, b) => {
        const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
        const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
        return dateB - dateA; // Newest first
      });

      console.log(`✅ Found ${allHistory.length} history items for user ${userEmail}`);

      return NextResponse.json({
        success: true,
        data: allHistory,
        counts: {
          captions: captionsData.length,
          titles: titlesData.length,
          scripts: scriptsData.length,
          total: allHistory.length
        },
        user: {
          email: userEmail,
          id: userId
        },
        message: allHistory.length === 0 ? 'No history found' : undefined
      });

    } catch (dbError) {
      clearTimeout(timeoutId);
      console.error('💥 Database query error:', dbError);
      
      // Return empty data with error message
      return NextResponse.json({
        success: true,
        data: [],
        counts: { captions: 0, titles: 0, scripts: 0, total: 0 },
        error: 'Database connection issue',
        message: 'Could not load history due to connection issues'
      });
    }

  } catch (error) {
    console.error('💥 Error in history API:', error);
    
    // Return a more user-friendly error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch history',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      counts: { captions: 0, titles: 0, scripts: 0, total: 0 }
    }, { status: 500 });
  }
}