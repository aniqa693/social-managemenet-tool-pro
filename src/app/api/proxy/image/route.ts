import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    console.log('🖼️ Proxying image:', imageUrl.substring(0, 100));

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);

    // Fetch the image with proper headers
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Origin': 'https://www.instagram.com',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status);
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Get content type from original response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}