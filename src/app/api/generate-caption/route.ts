import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { captions } from '../../../../db/schema';
import { CreditManager } from '../../../../lib/credit-manager';
import { eq, and } from 'drizzle-orm';
import { userToolPermissions, toolPricingTable } from '../../../../db/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// Helper function to save to database
async function saveToDatabase(
  userInput: string,
  content: any,
  platform: string,
  tone: string,
  userEmail: string,
  userId?: string
) {
  try {
    console.log('💾 Attempting to save to database for user:', userEmail);
    
    const result = await db.insert(captions).values({
      userInput,
      content,
      plateform: platform,
      tone,
      userEmail,
      userId,
      createdOn: new Date().toISOString(),
    }).returning();

    console.log('✅ Database save successful:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Database save error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      niche, 
      tone, 
      platform, 
      includeTrending, 
      creativityLevel, 
      userEmail,
      userId,
      action // NEW: Check if this is a save action
    } = await request.json();

    console.log('👤 User identification:', {
      userEmail,
      userId,
      hasUser: !!userEmail && !!userId,
      action: action || 'generate'
    });

    // NEW: Check if tool is enabled for this user (for both generate and save actions)
    if (userId) {
      const toolEnabled = await isToolEnabledForUser(userId, 'caption_generator');
      
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
    }

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Ensure user is authenticated
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CREDIT CHECK - Required for authenticated users
    let requiredCredits = 2; // Default
    
    console.log('💰 Checking credits for user:', userId);
    
    try {
      // Get tool cost
      requiredCredits = await CreditManager.getToolCost('caption_generator');
      
      // Check if user has sufficient credits
      const creditCheck = await CreditManager.hasSufficientCredits(userId, 'caption_generator');
      
      console.log('💰 Credit check result:', creditCheck);

      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            requiredCredits: creditCheck.requiredCredits,
            currentCredits: creditCheck.currentCredits,
            message: `You need ${creditCheck.requiredCredits} credits to use this tool. You have ${creditCheck.currentCredits} credits.`
          },
          { status: 403 }
        );
      }
      
    } catch (creditError) {
      console.error('❌ Credit check error:', creditError);
      return NextResponse.json(
        { error: 'Failed to verify credits. Please try again.' },
        { status: 500 }
      );
    }

    // If this is just a save action (not generation), skip the AI generation
    if (action === 'save-single') {
      const { captionContent } = await request.json();
      
      // Prepare data for database
      const contentForDB = {
        captions: [captionContent],
        settings: {
          niche,
          tone,
          platform,
          includeTrending,
          creativityLevel,
          generatedAt: new Date().toISOString()
        },
        metadata: {
          totalCaptions: 1,
          hasTrending: includeTrending,
          isSaved: true
        }
      };

      // Save to database
      let savedRecord = null;
      
      try {
        savedRecord = await saveToDatabase(
          niche,
          contentForDB,
          platform || 'instagram',
          tone || 'friendly',
          userEmail,
          userId
        );
        console.log('💾 Caption saved to database with ID:', savedRecord?.id);
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError);
        return NextResponse.json(
          { error: 'Failed to save caption to database' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Caption saved successfully',
        saveInfo: {
          saved: true,
          recordId: savedRecord?.id,
          userEmail: userEmail
        }
      });
    }

    console.log('🚀 Generating captions for:', {
      niche,
      tone,
      platform,
      includeTrending,
      creativityLevel,
      userEmail
    });

    // Use the model name that works for you
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Generate social media content for the niche: "${niche}"
      Tone: ${tone || 'friendly'}
      Platform: ${platform || 'instagram'}
      ${includeTrending ? 'Include trending and relevant hashtags' : ''}
      Creativity level: ${creativityLevel || 7}/10
      
      Generate 4 different caption options. For each option provide:
      1. A creative and engaging main caption (1-2 sentences max)
      2. 5-7 highly relevant hashtags (${includeTrending ? 'include 1-2 trending hashtags' : ''})
      3. 3-5 appropriate emojis
      
      Make the captions ${tone} and optimized for ${platform}.
      
      Return ONLY a JSON array with this exact structure:
      [
        {
          "caption": "creative caption here",
          "hashtags": ["#hashtag1", "#hashtag2"],
          "emojis": ["😊", "✨"]
        }
      ]
      
      Be creative, engaging, and platform-appropriate!
    `;

    console.log('🤖 Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    let generatedCaptions;
    
    try {
      generatedCaptions = JSON.parse(cleanText);
      console.log('✅ Successfully parsed', generatedCaptions.length, 'captions');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      const jsonMatch = cleanText.match(/\[.*\]/);
      if (jsonMatch) {
        try {
          generatedCaptions = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted JSON from text:', generatedCaptions.length, 'captions');
        } catch (e) {
          console.error('❌ Failed to extract JSON');
          generatedCaptions = [
            {
              caption: `Discover the amazing world of ${niche}! 🎉`,
              hashtags: [`#${niche.toLowerCase().replace(/\s+/g, '')}`, '#trending', '#viral'],
              emojis: ['✨', '🔥', '🌟']
            }
          ];
        }
      } else {
        console.log('⚠️ No JSON found, using fallback');
        generatedCaptions = [
          {
            caption: `Explore ${niche} like never before! 🚀`,
            hashtags: [`#${niche}`, '#inspiration', '#motivation'],
            emojis: ['🚀', '💫', '✨']
          }
        ];
      }
    }

    // Prepare data for database
    const contentForDB = {
      captions: generatedCaptions,
      settings: {
        niche,
        tone,
        platform,
        includeTrending,
        creativityLevel,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        totalCaptions: generatedCaptions.length,
        hasTrending: includeTrending
      }
    };

    // DEDUCT CREDITS for authenticated user
    let creditDeductionResult = null;
    
    console.log('💰 Deducting credits for user:', userId);
    
    try {
      creditDeductionResult = await CreditManager.useTool(
        userId,
        'caption_generator',
        `Generated ${generatedCaptions.length} captions for niche: ${niche}`,
        { niche, platform, tone }
      );

      console.log('💰 Credit deduction result:', creditDeductionResult);
    } catch (deductionError) {
      console.error('❌ Credit deduction error:', deductionError);
      return NextResponse.json(
        { error: 'Failed to process credits. Please try again.' },
        { status: 500 }
      );
    }

    // Save to database
    let savedRecord = null;
    
    try {
      savedRecord = await saveToDatabase(
        niche,
        contentForDB,
        platform || 'instagram',
        tone || 'friendly',
        userEmail,
        userId
      );
      console.log('💾 Captions saved to database with ID:', savedRecord?.id);
    } catch (dbError) {
      console.error('⚠️ Failed to save to database, but continuing with response:', dbError);
    }

    // Return response
    return NextResponse.json({
      success: true,
      captions: generatedCaptions,
      creditInfo: {
        deducted: true,
        amount: Math.abs(creditDeductionResult?.amount || requiredCredits),
        remainingCredits: creditDeductionResult?.remainingCredits || 0,
        transactionId: creditDeductionResult?.transactionId
      },
      saveInfo: {
        saved: !!savedRecord,
        recordId: savedRecord?.id,
        userEmail: userEmail,
        message: savedRecord ? 'Captions saved to database' : 'Failed to save captions'
      },
      metadata: {
        count: generatedCaptions.length,
        platform: platform || 'instagram',
        tone: tone || 'friendly',
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating caption:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate caption. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}