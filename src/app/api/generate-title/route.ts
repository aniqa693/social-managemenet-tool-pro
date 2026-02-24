// app/api/generate-platform-titles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { titles } from '../../../../db/schema';
import { CreditManager } from '../../../../lib/credit-manager';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define types for better TypeScript support
type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter';
type TitleStyle = 'catchy' | 'question' | 'howto' | 'list' | 'emotional' | 'controversial';

interface GeneratedTitle {
  title: string;
  platform: Platform;
  characterCount: number;
  style: TitleStyle;
}

interface PlatformInstructions {
  [key: string]: string;
}

// Helper function to save title to database
async function saveTitleToDatabase(
  userInput: string,
  content: any,
  contentType: string,
  tone: string,
  userEmail: string,
  userId?: string
) {
  try {
    console.log('💾 Saving title to database for user:', userEmail);
    
    const result = await db.insert(titles).values({
      userInput,
      content,
      contentType,
      tone,
      userEmail,
      userId,
      createdOn: new Date().toISOString(),
    }).returning();

    console.log('✅ Title saved successfully:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Database save error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      topic,
      platforms,
      style,
      creativityLevel,
      userEmail,
      userId,
      count = 12
    } = await request.json();

    const actualUserId = userId;
    const isGuestUser = !actualUserId || actualUserId === 'guest' || actualUserId === '';

    console.log('👤 Title generation for platforms:', {
      platforms,
      style,
      topic,
      userEmail,
      count
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Credit check for authenticated users
    if (!isGuestUser && actualUserId) {
      console.log('💰 Checking credits for user:', actualUserId);
      
      try {
        const requiredCredits = await CreditManager.getToolCost('title_generator');
        const creditCheck = await CreditManager.hasSufficientCredits(actualUserId, 'title_generator');

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
      }
    }

    console.log('🚀 Generating platform titles for:', {
      topic,
      platforms,
      style,
      creativityLevel,
      count
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Platform-specific instructions with proper typing
    const platformInstructions: PlatformInstructions = {
      instagram: "Instagram: Visual, trendy, short (max 60 chars). Use emojis sparingly. Focus on aesthetics and lifestyle.",
      facebook: "Facebook: Engaging, conversational (max 80 chars). Can be slightly longer, community-focused.",
      youtube: "YouTube: Click-worthy, curiosity-gap (max 70 chars). Include power words like 'Ultimate', 'Best', 'Guide'.",
      tiktok: "TikTok: Ultra-short, viral, trend-focused (max 50 chars). Use current slang and hooks.",
      linkedin: "LinkedIn: Professional, insightful (max 70 chars). Focus on career, business, and learning.",
      twitter: "Twitter/X: Concise, punchy (max 50 chars). Make it shareable and engaging."
    };

    const selectedPlatformInstructions = (platforms as Platform[])
      .map((p: Platform) => platformInstructions[p] || p)
      .join('\n');

    const prompt = `
      Generate creative, catchy titles for the topic: "${topic}"
      
      Target Platforms (generate titles for each):
      ${selectedPlatformInstructions}
      
      Title Style: ${style || 'catchy'} (catchy, question, howto, list, emotional, controversial)
      Creativity level: ${creativityLevel || 7}/10
      Total titles to generate: ${count} (distribute evenly across platforms)
      
      IMPORTANT RULES:
      1. Generate ONLY the titles - NO hashtags, NO descriptions, NO emojis (unless specified)
      2. Each title should be platform-appropriate and within character limits
      3. Make titles attention-grabbing and click-worthy
      4. NO punctuation at the end unless it's a question
      5. Keep it clean and professional
      
      Return ONLY a JSON array with this exact structure:
      [
        {
          "title": "Your Platform Title Here",
          "platform": "instagram",
          "characterCount": 45,
          "style": "catchy"
        }
      ]
      
      Distribute the ${count} titles evenly across these platforms: ${(platforms as Platform[]).join(', ')}.
      Make each title unique and optimized for its specific platform.
    `;

    console.log('🤖 Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    let generatedTitles: GeneratedTitle[];
    
    try {
      generatedTitles = JSON.parse(cleanText);
      console.log('✅ Successfully parsed', generatedTitles.length, 'titles');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      
      // Fallback titles with proper typing
      generatedTitles = [];
      const perPlatform = Math.ceil(count / platforms.length);
      
      (platforms as Platform[]).forEach((platform: Platform, index: number) => {
        for (let i = 0; i < perPlatform; i++) {
          generatedTitles.push({
            title: `${i === 0 ? 'Ultimate' : 'Amazing'} ${topic} ${i === 1 ? 'Tips' : 'Guide'} for ${platform}`,
            platform: platform,
            characterCount: 45,
            style: style as TitleStyle || 'catchy'
          });
        }
      });
    }

    // Prepare data for database
    const contentForDB = {
      titles: generatedTitles,
      settings: {
        topic,
        platforms,
        style,
        creativityLevel,
        count: generatedTitles.length,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        totalTitles: generatedTitles.length,
        platforms: platforms
      }
    };

    // Save to database if user is logged in (not guest)
    let savedRecord = null;
    const isGuestUserForDb = !userEmail || 
                           userEmail === 'guest@example.com' || 
                           userEmail.includes('guest');
    
    if (!isGuestUserForDb && userEmail) {
      try {
        savedRecord = await saveTitleToDatabase(
          topic,
          contentForDB,
          'platform-titles', // contentType
          style || 'catchy', // tone
          userEmail,
          actualUserId
        );
        console.log('💾 Titles saved to database with ID:', savedRecord?.id);
      } catch (dbError) {
        console.error('⚠️ Failed to save to database, but continuing with response:', dbError);
      }
    } else {
      console.log('ℹ️ Guest user, skipping database save');
    }

    // Deduct credits for authenticated users
    let creditDeductionResult = null;
    if (!isGuestUser && actualUserId) {
      try {
        creditDeductionResult = await CreditManager.useTool(
          actualUserId,
          'title_generator',
          `Generated ${generatedTitles.length} platform titles for: ${topic}`,
          { topic, platforms, style, count: generatedTitles.length }
        );
        console.log('💰 Credit deduction result:', creditDeductionResult);
      } catch (deductionError) {
        console.error('❌ Credit deduction error:', deductionError);
      }
    }

    return NextResponse.json({
      success: true,
      titles: generatedTitles.slice(0, count), // Ensure we don't exceed requested count
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
        userEmail: userEmail,
        message: savedRecord ? 'Titles saved to database' : 'Titles not saved (guest user or error)'
      },
      metadata: {
        count: generatedTitles.length,
        platforms,
        style,
        generatedAt: new Date().toISOString(),
        user: isGuestUser ? 'guest' : userEmail
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating titles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate titles. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}