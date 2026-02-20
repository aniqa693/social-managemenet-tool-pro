// app/api/generate-caption/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { captions } from '../../../../db/schema';
import { headers } from 'next/headers';
import { CreditManager } from '../../../../lib/credit-manager';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
      content, // Keep as is - your original code works
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
      userEmail: clientEmail,
      userId: clientUserId
    } = await request.json();

    // Better Auth session check
    const headersList = headers();
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;
    
    // Use the client-provided user info
    const actualUserEmail = clientEmail;
    const actualUserId = clientUserId;
    
    console.log('👤 User identification:', {
      clientEmail,
      clientUserId,
      hasSessionToken: !!sessionToken,
      actualUserEmail
    });

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated (not guest)
    const isGuestUser = !actualUserId || actualUserId === 'guest' || actualUserId === '';

    // CREDIT CHECK - Only for authenticated users (but don't block if credit check fails)
    let creditCheckPassed = true;
    let requiredCredits = 2; // Default
    
    if (!isGuestUser && actualUserId) {
      console.log('💰 Checking credits for user:', actualUserId);
      
      try {
        // Get tool cost
        requiredCredits = await CreditManager.getToolCost('caption_generator');
        
        // Check if user has sufficient credits
        const creditCheck = await CreditManager.hasSufficientCredits(actualUserId, 'caption_generator');
        
        console.log('💰 Credit check result:', creditCheck);

        if (!creditCheck.hasCredits) {
          // Return insufficient credits error - block the request
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
        
        creditCheckPassed = true;
      } catch (creditError) {
        console.error('❌ Credit check error:', creditError);
        // If credit check fails for authenticated user, we should still allow generation
        // but log the error and continue
        console.log('⚠️ Credit check failed but allowing generation to proceed');
      }
    }

    console.log('🚀 Generating captions for:', {
      niche,
      tone,
      platform,
      includeTrending,
      creativityLevel,
      actualUserEmail
    });

    // Use the model name that works for you
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Keep your working model

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

    // Clean and parse JSON response - exactly as your original code
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

    // Prepare data for database - same as your original
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

    // DEDUCT CREDITS - Only for authenticated users after successful generation
    // Do this BEFORE saving to database
    let creditDeductionResult = null;
    if (!isGuestUser && actualUserId && creditCheckPassed) {
      console.log('💰 Deducting credits for user:', actualUserId);
      
      try {
        creditDeductionResult = await CreditManager.useTool(
          actualUserId,
          'caption_generator',
          `Generated ${generatedCaptions.length} captions for niche: ${niche}`,
          { niche, platform, tone }
        );

        console.log('💰 Credit deduction result:', creditDeductionResult);
      } catch (deductionError) {
        console.error('❌ Credit deduction error:', deductionError);
        // Continue even if deduction fails - we already generated captions
      }
    }

    // Save to database if user is logged in (not guest) - exactly as your original
    let savedRecord = null;
    const isGuestUserForDb = !actualUserEmail || 
                           actualUserEmail === 'guest@example.com' || 
                           actualUserEmail.includes('guest');
    
    if (!isGuestUserForDb && actualUserEmail) {
      try {
        savedRecord = await saveToDatabase(
          niche,
          contentForDB,
          platform || 'instagram',
          tone || 'friendly',
          actualUserEmail,
          actualUserId
        );
        console.log('💾 Captions saved to database with ID:', savedRecord?.id);
      } catch (dbError) {
        console.error('⚠️ Failed to save to database, but continuing with response:', dbError);
      }
    } else {
      console.log('ℹ️ Guest user, skipping database save');
    }

    // Return response - maintaining your original structure but adding credit info
    return NextResponse.json({
      success: true,
      captions: generatedCaptions, // Your working captions
      creditInfo: creditDeductionResult ? {
        deducted: true,
        amount: Math.abs(creditDeductionResult.amount || 0),
        remainingCredits: creditDeductionResult.remainingCredits,
        transactionId: creditDeductionResult.transactionId
      } : {
        deducted: false,
        message: isGuestUser ? 'Guest user - no credits deducted' : 'Credit deduction skipped'
      },
      saveInfo: {
        saved: !!savedRecord,
        recordId: savedRecord?.id,
        userEmail: actualUserEmail,
        message: savedRecord ? 'Captions saved to database' : 'Captions not saved (guest user)'
      },
      metadata: {
        count: generatedCaptions.length,
        platform: platform || 'instagram',
        tone: tone || 'friendly',
        generatedAt: new Date().toISOString(),
        user: isGuestUser ? 'guest' : actualUserEmail,
        userId: actualUserId
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