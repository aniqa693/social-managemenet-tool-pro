import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { thumbnailsTable } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from '../../../../lib/auth-server';
import ImageKit from 'imagekit';
import OpenAI from 'openai';
import Replicate from 'replicate';
import moment from 'moment';

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
  const res = await imagekit.upload({
    file: fileData.buffer,
    fileName: fileName,
    isPublished: true,
    useUniqueFileName: false,
  });
  return res.url;
};

// Helper function to generate prompt using OpenRouter
const generatePrompt = async (
  userinput: string,
  referenceImageURL?: string,
  includeFaceURL?: string
) => {
  const messages: any[] = [];

  let promptText = "";

  if (referenceImageURL && includeFaceURL) {
    promptText =
      `write a high quality text prompt to generate youtube thumbnail by using following input: ${userinput}. ` +
      `Use the first image as a design/style reference, and use the second image to include the person's face. ` +
      `Ensure the thumbnail is bold, modern, and eye-catching. Only give a text prompt, no other comment text`;
  } else if (referenceImageURL) {
    promptText =
      `write a high quality text prompt to generate youtube thumbnail by using following input: ${userinput}. ` +
      `Use the attached image as a design and layout reference. Make it visually similar in style. ` +
      `Only give a text prompt, no other comment text`;
  } else if (includeFaceURL) {
    promptText =
      `write a high quality text prompt to generate youtube thumbnail by using following input: ${userinput}. ` +
      `Include the face from the attached image prominently. Use an engaging, modern design. ` +
      `Only give a text prompt, no other comment text`;
  } else {
    promptText =
      `Write a text prompt to generate high quality professional youtube thumbnail based on user input: ${userinput}. ` +
      `Add relevant icons, illustrate image as per title. Include bold text, relevant icons, and illustrated visuals matching the topic. ` +
      `Use vibrant colors, strong contrast, and a clean, eye-catching design. Only give a text prompt, no other comment text`;
  }

  messages.push({ type: "text", text: promptText });

  if (referenceImageURL) {
    messages.push({
      type: "image_url",
      image_url: { url: referenceImageURL },
    });
  }

  if (includeFaceURL) {
    messages.push({
      type: "image_url",
      image_url: { url: includeFaceURL },
    });
  }

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
};

// POST - Generate new thumbnail
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
    const userinput = formData.get('description') as string;
    const referenceImage = formData.get('referenceImage') as File | null;
    const includeFace = formData.get('includeFace') as File | null;

    if (!userinput && !referenceImage && !includeFace) {
      return NextResponse.json({ 
        error: "Please provide a description or upload images" 
      }, { status: 400 });
    }

    // Step 1: Upload reference images if provided
    const uploads: { referenceImageURL?: string; includeFaceURL?: string } = {};

    if (referenceImage) {
      const referenceImageData = await getFileBufferData(referenceImage);
      uploads.referenceImageURL = await uploadToImageKit(
        referenceImageData, 
        `ref-${Date.now()}-${referenceImageData.name}`
      );
    }

    if (includeFace) {
      const includeFaceData = await getFileBufferData(includeFace);
      uploads.includeFaceURL = await uploadToImageKit(
        includeFaceData, 
        `face-${Date.now()}-${includeFaceData.name}`
      );
    }

    // Step 2: Generate prompt using OpenRouter
    const generatedPrompt = await generatePrompt(
      userinput || "youtube thumbnail",
      uploads.referenceImageURL,
      uploads.includeFaceURL
    );

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }

    // Step 3: Generate image using Replicate
    const input = {
      prompt: generatedPrompt,
      aspect_ratio: "16:9",
      output_format: "png",
      safety_filter_level: "block_only_high",
    };
    
    const output = await replicate.run("google/imagen-4-fast", { input });
    
    // @ts-ignore - Replicate returns a URL
    const generatedImageUrl = output.url();

    // Step 4: Upload generated image to ImageKit
    const imageResponse = await fetch(generatedImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    const uploadedThumbnail = await imagekit.upload({
      file: imageBase64,
      fileName: `thumbnail-${Date.now()}.png`,
      isPublished: true,
      useUniqueFileName: false,
    });

    // Step 5: Save to database
    const savedThumbnail = await db.insert(thumbnailsTable).values({
      userInput: userinput || 'AI generated thumbnail',
      thumbnailURL: uploadedThumbnail.url,
      refImage: uploads.referenceImageURL || "",
      includeImage: uploads.includeFaceURL || "",
      userEmail: email,
      userId: userId,
      createdOn: moment().format("YYYY-MM-DD"),
    }).returning();

    console.log("✅ Thumbnail generated and saved:", savedThumbnail[0].id);

    return NextResponse.json({ 
      success: true,
      thumbnailUrl: uploadedThumbnail.url,
      thumbnailId: savedThumbnail[0].id
    });

  } catch (error) {
    console.error('Thumbnail Generation Error:', error);
    return NextResponse.json({ 
      error: "Failed to generate thumbnail. Please try again." 
    }, { status: 500 });
  }
}

// GET - Fetch user's thumbnails
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const email = session.user.email;
    
    const result = await db.select().from(thumbnailsTable)
      .where(eq(thumbnailsTable.userEmail, email))
      .orderBy(desc(thumbnailsTable.id));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching thumbnails:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}