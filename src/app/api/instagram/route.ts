import { NextResponse } from 'next/server';
import { apifyClient } from '../../../../lib/apify/client ';

const INSTAGRAM_REEL_SCRAPER_ID = 'apify/instagram-reel-scraper';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching Instagram for username:', query);
    
    const username = query.replace('@', '').trim();
    
    const input = {
      username: [username],
      resultsLimit: 1,
    };

    console.log('📦 Running Instagram reel scraper with input:', input);
    
    const run = await apifyClient.actor(INSTAGRAM_REEL_SCRAPER_ID).call(input);
    console.log('✅ Instagram reel scraper run completed');
    
    const { items } = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems();

    const itemsArray = Array.isArray(items) ? items : [];
    console.log(`📊 Found ${itemsArray.length} Instagram items from ${username}`);

    if (itemsArray.length === 0) {
      return NextResponse.json([]);
    }

    // Transform videos with comprehensive thumbnail extraction
    const formattedVideos = itemsArray.map((item: any, index: number) => {
      // Get original thumbnail URL
      let originalThumbnailUrl = null;
      
      if (item.displayUrl) {
        originalThumbnailUrl = item.displayUrl;
      } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        originalThumbnailUrl = item.images[0];
      } else if (item.display_url) {
        originalThumbnailUrl = item.display_url;
      } else if (item.thumbnailUrl) {
        originalThumbnailUrl = item.thumbnailUrl;
      } else if (item.thumbnail_url) {
        originalThumbnailUrl = item.thumbnail_url;
      }

      // Create proxy URL for the thumbnail
      const thumbnailUrl = originalThumbnailUrl 
        ? `/api/proxy/image?url=${encodeURIComponent(originalThumbnailUrl)}`
        : null;

      // Get video URL
      const videoUrl = item.videoUrl || item.video_url || '';

      // Get all images for fallback
      const allImages = Array.isArray(item.images) 
        ? item.images.map((img: string) => `/api/proxy/image?url=${encodeURIComponent(img)}`)
        : [];

      // Safely extract latestComments
      let latestComments = [];
      if (Array.isArray(item.latestComments)) {
        latestComments = item.latestComments.slice(0, 5);
      } else if (item.latestComments && typeof item.latestComments === 'object') {
        latestComments = Object.values(item.latestComments).slice(0, 5);
      }

      return {
        id: item.id,
        videoId: item.shortCode || item.id,
        platform: 'instagram',
        type: item.type || 'Video',
        shortCode: item.shortCode,
        caption: item.caption || '',
        title: item.caption?.substring(0, 100) || 'Instagram Post',
        url: item.url || `https://instagram.com/p/${item.shortCode}`,
        commentsCount: item.commentsCount || 0,
        thumbnailUrl, // Now using proxy URL
        allImages, // All images as proxy URLs
        originalThumbnailUrl, // Keep original for reference
        videoUrl,
        likesCount: item.likesCount || 0,
        sharesCount: item.sharesCount || 0,
        videoViewCount: item.videoViewCount || item.videoPlayCount || 0,
        timestamp: item.timestamp,
        ownerFullName: item.ownerFullName || '',
        ownerUsername: item.ownerUsername || username,
        ownerId: item.ownerId,
        productType: item.productType || 'clips',
        videoDuration: item.videoDuration || null,
        hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
        mentions: Array.isArray(item.mentions) ? item.mentions : [],
        musicInfo: item.musicInfo || null,
        isVideo: !!(videoUrl || item.type === 'Video'),
        firstComment: item.firstComment || '',
        latestComments,
        dimensions: {
          height: item.dimensionsHeight || 0,
          width: item.dimensionsWidth || 0
        },
        isPinned: item.isPinned || false,
        isCommentsDisabled: item.isCommentsDisabled || false,
        metadata: item
      };
    });

    // Log summary
    const withThumbnails = formattedVideos.filter(v => v.thumbnailUrl).length;
    const withVideo = formattedVideos.filter(v => v.videoUrl).length;
    const withComments = formattedVideos.filter(v => v.latestComments.length > 0).length;
    
    console.log(`✅ Formatted ${formattedVideos.length} items`);
    console.log(`📸 With thumbnails: ${withThumbnails}/${formattedVideos.length}`);
    console.log(`🎥 With video URLs: ${withVideo}/${formattedVideos.length}`);
    console.log(`💬 With comments: ${withComments}/${formattedVideos.length}`);
    
    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error('❌ Instagram API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram content' },
      { status: 500 }
    );
  }
}