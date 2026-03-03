import { NextResponse } from 'next/server';
import { apifyClient,YOUTUBE_ACTOR_ID } from '../../../../lib/apify/client ';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('Searching YouTube for:', query);
    
    // Run Apify YouTube actor
    const input = {
      searchQueries: [query],
      maxResults: 2,
      maxResultsShorts: 10,
    };

    console.log('Running YouTube actor with input:', input);
    
    const run = await apifyClient.actor(YOUTUBE_ACTOR_ID).call(input);
    console.log('YouTube actor run completed:', run);
    
    // Get dataset items
    const datasetClient = apifyClient.dataset(run.defaultDatasetId);
    const { items } = await datasetClient.listItems();
    
    console.log('Raw items from YouTube:', items);

    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [];
    
    if (itemsArray.length === 0) {
      console.log('No items found from YouTube');
      return NextResponse.json([]);
    }

    // Transform videos
    const formattedVideos = itemsArray.map((item: any, index: number) => {
      return {
        videoId: item.id || item.videoId || `yt_${Date.now()}_${index}`,
        platform: 'youtube',
        title: item.title || item.name || 'YouTube Video',
        description: item.description || '',
        thumbnailUrl: item.thumbnailUrl || item.thumbnails?.[0]?.url || null,
        videoUrl: item.url || `https://youtube.com/watch?v=${item.id}`,
        viewCount: item.viewCount || 0,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        author: item.channelName || item.uploaderName || 'Unknown',
        duration: item.duration || null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        metadata: item
      };
    });

    console.log(`Formatted ${formattedVideos.length} YouTube videos`);
    
    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' },
      { status: 500 }
    );
  }
}