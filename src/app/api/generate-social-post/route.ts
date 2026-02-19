// app/api/generate-social-post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { socialPostsTable } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from '../../../../lib/auth-server';
import ImageKit from 'imagekit';
import OpenAI from 'openai';
import Replicate from 'replicate';
import moment from 'moment';
import axios from 'axios';

// Initialize services
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Helper function to get file buffer
const getFileBufferData = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    buffer: buffer.toString('base64'),
    name: file.name,
    type: file.type,
    size: file.size,
  };
};

// Helper function to upload file to ImageKit
const uploadToImageKit = async (fileData: any, fileName: string) => {
  try {
    const res = await imagekit.upload({
      file: fileData.buffer,
      fileName: fileName,
      isPublished: true,
      useUniqueFileName: false,
    });
    return res.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

// Helper function to generate prompt using OpenRouter
const generateSocialPrompt = async (
  userInput: string,
  platform: string,
  aspectRatio: string,
  includeFaceURL?: string
) => {
  const messages: any[] = [];

  // Platform-specific style guidelines
  const platformStyles = {
    instagram: "Create a vibrant, aesthetically pleasing Instagram post. Use trendy colors, modern design, and engaging visuals that work well in the Instagram feed.",
    facebook: "Create an engaging Facebook post with clear messaging, bold visuals, and design that performs well in the news feed. Optimize for both mobile and desktop viewing."
  };

  // Aspect ratio specific guidance
  const ratioGuidance = {
    '1:1': "Square format - perfect for Instagram feed. Keep the subject centered and well-balanced.",
    '4:5': "Portrait format - ideal for Instagram feed and stories. Use vertical composition with focus on the upper portion.",
    '16:9': "Landscape format - great for Facebook feed and video thumbnails. Use horizontal composition.",
    '9:16': "Story format - perfect for Instagram Stories and Reels. Design for vertical scrolling with text safe zones."
  };

  let promptText = `Create a text prompt for generating a high-quality ${platform} post with ${aspectRatio} aspect ratio. 
Based on this description: "${userInput}".
${platformStyles[platform as keyof typeof platformStyles]}
${ratioGuidance[aspectRatio as keyof typeof ratioGuidance]}

Important guidelines:
- Use bold, readable typography if text is needed
- Include relevant icons and visual elements
- Use vibrant, eye-catching colors
- Ensure the design is clean and professional
- Optimize for the specified aspect ratio
- Make it scroll-stopping and engaging

${includeFaceURL ? "Include the person's face from the provided image prominently in the design." : ""}
Only give a text prompt, no other comment text.`;

  messages.push({ type: "text", text: promptText });

  if (includeFaceURL) {
    messages.push({
      type: "image_url",
      image_url: { url: includeFaceURL },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-4b-it:free",
      messages: [
        {
          role: "user",
          content: messages,
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI prompt generation error:', error);
    throw error;
  }
};

// Helper function to download image from URL
const downloadImageAsBuffer = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

// Map aspect ratio to Replicate format
const getReplicateAspectRatio = (ratio: string) => {
  const ratioMap: { [key: string]: string } = {
    '1:1': '1:1',
    '4:5': '4:5',
    '16:9': '16:9',
    '9:16': '9:16'
  };
  return ratioMap[ratio] || '1:1';
};

// POST - Generate new social post
export async function POST(req: NextRequest) {
  try {
    // Get user session from Better Auth
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const email = session.user.email;
    const userId = session.user.id;

    const formData = await req.formData();
    const userInput = formData.get('description') as string;
    const platform = formData.get('platform') as string;
    const aspectRatio = formData.get('aspectRatio') as string;
    const includeImage = formData.get('includeImage') as File | null;

    console.log('📝 Generating social post for:', { 
      email, 
      platform, 
      aspectRatio, 
      userInput, 
      hasImage: !!includeImage 
    });

    if (!userInput) {
      return NextResponse.json({ 
        error: "Please provide a description for your post" 
      }, { status: 400 });
    }

    if (!platform || !aspectRatio) {
      return NextResponse.json({ 
        error: "Please select platform and aspect ratio" 
      }, { status: 400 });
    }

    // Step 1: Upload image if provided
    let includeImageURL: string | undefined;
    if (includeImage) {
      const imageData = await getFileBufferData(includeImage);
      includeImageURL = await uploadToImageKit(
        imageData, 
        `social-include-${Date.now()}-${imageData.name}`
      );
      console.log('✅ Include image uploaded:', includeImageURL);
    }

    // Step 2: Generate prompt using OpenRouter
    const generatedPrompt = await generateSocialPrompt(
      userInput,
      platform,
      aspectRatio,
      includeImageURL
    );

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }
    console.log('✅ Prompt generated:', generatedPrompt.substring(0, 100) + '...');

    // Step 3: Generate image using Replicate with specific aspect ratio
    const replicateRatio = getReplicateAspectRatio(aspectRatio);
    
    const input = {
      prompt: generatedPrompt,
      aspect_ratio: replicateRatio,
      output_format: "png",
      safety_filter_level: "block_only_high",
    };
    
    console.log('🎨 Generating image with Replicate using aspect ratio:', replicateRatio);
    const output = await replicate.run("google/imagen-4-fast", { input });
    
    // Handle different response formats from Replicate
    let generatedImageUrl: string;
    
    if (typeof output === 'string') {
      generatedImageUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      generatedImageUrl = output[0];
    } else if (output && typeof output === 'object' && 'url' in output) {
      // @ts-ignore
      generatedImageUrl = output.url();
    } else if (output && typeof output === 'object' && 'output' in output) {
      // @ts-ignore
      generatedImageUrl = output.output;
    } else {
      // @ts-ignore - Try to get URL from the response
      generatedImageUrl = output.url ? output.url() : String(output);
    }

    console.log('✅ Image generated, URL:', generatedImageUrl);

    // Step 4: Download the generated image
    const imageBuffer = await downloadImageAsBuffer(generatedImageUrl);

    // Step 5: Upload generated image to ImageKit
    const uploadedPost = await imagekit.upload({
      file: imageBuffer.toString('base64'),
      fileName: `${platform}-${aspectRatio.replace(':', '-')}-${Date.now()}.png`,
      isPublished: true,
      useUniqueFileName: false,
    });

    console.log('✅ Post uploaded to ImageKit:', uploadedPost.url);

    // Step 6: Save to database
    const savedPost = await db.insert(socialPostsTable).values({
      userInput: userInput,
      postUrl: uploadedPost.url,
      includeImage: includeImageURL || "",
      platform: platform,
      aspectRatio: aspectRatio,
      userEmail: email,
      userId: userId,
      createdOn: moment().format("YYYY-MM-DD"),
    }).returning();

    console.log("✅ Social post saved to database, ID:", savedPost[0].id);

    return NextResponse.json({ 
      success: true,
      postUrl: uploadedPost.url,
      postId: savedPost[0].id,
      platform: platform,
      aspectRatio: aspectRatio
    });

  } catch (error) {
    console.error('❌ Social Post Generation Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate social post. Please try again." 
    }, { status: 500 });
  }
}

// GET - Fetch user's social posts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const email = session.user.email;
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform'); // Optional filter by platform
    
    let query = db.select().from(socialPostsTable)
      .where(eq(socialPostsTable.userEmail, email))
      .orderBy(desc(socialPostsTable.id));
    
    const result = await query;
    
    console.log(`📋 Found ${result.length} social posts for user:`, email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}