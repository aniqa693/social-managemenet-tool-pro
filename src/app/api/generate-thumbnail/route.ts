import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { thumbnailsTable } from '../../../../db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getServerSession } from '../../../../lib/auth-server';
import ImageKit from 'imagekit';
import OpenAI from 'openai';
import Replicate from 'replicate';
import moment from 'moment';
import axios from 'axios';
import { CreditManager } from '../../../../lib/credit-manager';
import { userToolPermissions, toolPricingTable } from '../../../../db/schema';

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

// NEW: Helper function to check if tool is enabled for user
async function isToolEnabledForUser(userId: string, toolName: string): Promise<boolean> {
  try {
    // First check if there's a custom permission for this user
    const userPermission = await db.query.userToolPermissions.findFirst({
      where: and(
        eq(userToolPermissions.userId, userId),
        eq(userToolPermissions.toolName, toolName)
      )
    });

    // If custom permission exists, use that
    if (userPermission) {
      return userPermission.isEnabled;
    }

    // Otherwise check global tool setting
    const toolSetting = await db.query.toolPricingTable.findFirst({
      where: eq(toolPricingTable.tool_name, toolName)
    });

    // Default to true if no setting found (for backward compatibility)
    return toolSetting?.enable_disenable ?? true;
    
  } catch (error) {
    console.error('Error checking tool enabled status:', error);
    return true; // Default to enabled on error
  }
}

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

    // NEW: Check if tool is enabled for this user
    const toolEnabled = await isToolEnabledForUser(userId, 'thumbnail_generator');
    
    if (!toolEnabled) {
      console.log('🚫 Tool is disabled for user:', userId);
      return NextResponse.json(
        { 
          error: 'tool_disabled',
          message: 'This tool has been disabled by the administrator. Please contact support for assistance.'
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const userinput = formData.get('description') as string;
    const referenceImage = formData.get('referenceImage') as File | null;
    const includeFace = formData.get('includeFace') as File | null;

    console.log('📝 Generating thumbnail for:', { email, userinput, hasRef: !!referenceImage, hasFace: !!includeFace });

    if (!userinput && !referenceImage && !includeFace) {
      return NextResponse.json({ 
        error: "Please provide a description or upload images" 
      }, { status: 400 });
    }

    // CREDIT CHECK - Thumbnail generator costs 3 credits
    const toolName = 'thumbnail_generator';
    let requiredCredits = 3; // Default cost
    
    try {
      // Get tool cost from database (or use default)
      requiredCredits = await CreditManager.getToolCost(toolName);
      
      // Check if user has sufficient credits
      const creditCheck = await CreditManager.hasSufficientCredits(userId, toolName);
      
      console.log('💰 Credit check result:', creditCheck);

      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            requiredCredits: creditCheck.requiredCredits,
            currentCredits: creditCheck.currentCredits,
            message: `You need ${creditCheck.requiredCredits} credits to generate a thumbnail. You have ${creditCheck.currentCredits} credits.`
          },
          { status: 403 }
        );
      }
    } catch (creditError) {
      console.error('❌ Credit check error:', creditError);
      return NextResponse.json(
        { 
          error: 'Credit check failed',
          message: 'Unable to verify credits. Please try again.'
        },
        { status: 500 }
      );
    }

    // Step 1: Upload reference images if provided
    const uploads: { referenceImageURL?: string; includeFaceURL?: string } = {};

    if (referenceImage) {
      const referenceImageData = await getFileBufferData(referenceImage);
      uploads.referenceImageURL = await uploadToImageKit(
        referenceImageData, 
        `ref-${Date.now()}-${referenceImageData.name}`
      );
      console.log('✅ Reference image uploaded:', uploads.referenceImageURL);
    }

    if (includeFace) {
      const includeFaceData = await getFileBufferData(includeFace);
      uploads.includeFaceURL = await uploadToImageKit(
        includeFaceData, 
        `face-${Date.now()}-${includeFaceData.name}`
      );
      console.log('✅ Face image uploaded:', uploads.includeFaceURL);
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
    console.log('✅ Prompt generated:', generatedPrompt.substring(0, 100) + '...');

    // Step 3: Generate image using Replicate
    const input = {
      prompt: generatedPrompt,
      aspect_ratio: "16:9",
      output_format: "png",
      safety_filter_level: "block_only_high",
    };
    
    console.log('🎨 Generating image with Replicate...');
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
    const uploadedThumbnail = await imagekit.upload({
      file: imageBuffer.toString('base64'),
      fileName: `thumbnail-${Date.now()}.png`,
      isPublished: true,
      useUniqueFileName: false,
    });

    console.log('✅ Thumbnail uploaded to ImageKit:', uploadedThumbnail.url);

    // DEDUCT CREDITS - After successful generation
    let creditDeductionResult = null;
    try {
      creditDeductionResult = await CreditManager.useTool(
        userId,
        toolName,
        `Generated thumbnail for: ${userinput || 'video content'}`,
        { hasReference: !!referenceImage, hasFace: !!includeFace }
      );

      console.log('💰 Credit deduction result:', creditDeductionResult);
    } catch (deductionError) {
      console.error('❌ Credit deduction error:', deductionError);
      // Continue even if deduction fails - we already generated the thumbnail
    }

    // Step 6: Save to database
    const savedThumbnail = await db.insert(thumbnailsTable).values({
      userInput: userinput || 'AI generated thumbnail',
      thumbnailURL: uploadedThumbnail.url,
      refImage: uploads.referenceImageURL || "",
      includeImage: uploads.includeFaceURL || "",
      userEmail: email,
      userId: userId,
      createdOn: moment().format("YYYY-MM-DD"),
    }).returning();

    console.log("✅ Thumbnail saved to database, ID:", savedThumbnail[0].id);

    // Return response
    return NextResponse.json({ 
      success: true,
      thumbnailUrl: uploadedThumbnail.url,
      thumbnailId: savedThumbnail[0].id,
      creditInfo: creditDeductionResult ? {
        deducted: true,
        amount: Math.abs(creditDeductionResult.amount || requiredCredits),
        remainingCredits: creditDeductionResult.remainingCredits || 0,
        transactionId: creditDeductionResult.transactionId
      } : {
        deducted: true,
        amount: requiredCredits,
        remainingCredits: 0, // We don't know the balance, default to 0
        message: 'Credits deducted'
      }
    });

  } catch (error) {
    console.error('❌ Thumbnail Generation Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate thumbnail. Please try again." 
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
    
    console.log(`📋 Found ${result.length} thumbnails for user:`, email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching thumbnails:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}