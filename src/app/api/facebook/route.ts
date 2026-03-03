import { NextResponse } from 'next/server';
import { apifyClient } from '../../../../lib/apify/client ';

const FACEBOOK_REELS_ACTOR_ID = 'igview-owner/facebook-page-reels-extractor';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching Facebook Reels for:', query);
    
    const input = {
      username: query,
      maxPages: 1,
    };

    console.log('📦 Running Facebook Reels extractor with input:', input);
    
    const run = await apifyClient.actor(FACEBOOK_REELS_ACTOR_ID).call(input);
    console.log('✅ Facebook Reels extractor run completed');
    
    const { items } = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems();

    const itemsArray = Array.isArray(items) ? items : [];
    console.log(`📊 Found ${itemsArray.length} Facebook Reels`);

    if (itemsArray.length === 0) {
      return NextResponse.json([]);
    }

    // Transform videos using the correct structure from the test results
    const formattedVideos = itemsArray.map((item: any, index: number) => {
      // Parse play count (might be like "4.4M" or "77K")
      let viewCount = 0;
      if (item.playCount) {
        const playCountStr = String(item.playCount);
        if (playCountStr.includes('M')) {
          viewCount = parseFloat(playCountStr) * 1000000;
        } else if (playCountStr.includes('K')) {
          viewCount = parseFloat(playCountStr) * 1000;
        } else {
          viewCount = parseInt(playCountStr) || 0;
        }
      }

      return {
        videoId: item.videoId || `fb_${index}`,
        platform: 'facebook',
        title: item.trackTitle && item.trackTitle !== 'N/A' ? item.trackTitle : `Reel by ${item.authorName}`,
        description: `Posted by ${item.authorName}`,
        thumbnailUrl: item.thumbnailImage || null,
        videoUrl: item.videoHdUrl || item.videoSdUrl || item.shareableUrl || '#',
        viewCount: viewCount,
        likeCount: 0, // Facebook doesn't provide likes in this response
        commentCount: 0, // Facebook doesn't provide comments in this response
        author: item.authorName?.replace(' Verified account', '') || 'Facebook User',
        authorVerified: item.authorName?.includes('Verified') || false,
        duration: item.lengthInSeconds || null,
        publishedAt: item.timestampISO ? new Date(item.timestampISO) : null,
        shareableUrl: item.shareableUrl,
        videoHdUrl: item.videoHdUrl,
        videoSdUrl: item.videoSdUrl,
        metadata: item
      };
    });

    console.log(`✅ Formatted ${formattedVideos.length} Facebook Reels`);
    
    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error('❌ Facebook Reels API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook Reels' },
      { status: 500 }
    );
  }
}