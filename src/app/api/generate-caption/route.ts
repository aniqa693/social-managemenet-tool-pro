import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { captions } from '../../../../db/schema';
import { headers } from 'next/headers';

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
      content,
      plateform: platform,
      tone,
      userEmail,
      userId, // Add userId to your schema if you want
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

    // Better Auth typically sets session cookies
    // We can try to get session from headers or cookies
    const headersList = headers();
    
    // For Better Auth, you might need to decode the session
    // This is a simplified approach - you may need to use your Better Auth server client
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;
    
    // For now, we'll trust the client-side session info
    // In production, you should validate the session with Better Auth
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

    console.log('🚀 Generating captions for:', {
      niche,
      tone,
      platform,
      includeTrending,
      creativityLevel,
      actualUserEmail
    });

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

    // Save to database if user is logged in (not guest)
    let savedRecord = null;
    const isGuestUser = !actualUserEmail || 
                       actualUserEmail === 'guest@example.com' || 
                       actualUserEmail.includes('guest');
    
    if (!isGuestUser && actualUserEmail) {
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

    // Return response
    return NextResponse.json({
      success: true,
      captions: generatedCaptions,
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