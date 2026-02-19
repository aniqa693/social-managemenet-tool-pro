import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { videoScripts } from '../../../../db/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to save script to database
async function saveScriptToDatabase(
  userInput: string,
  content: any,
  videoType: string,
  tone: string,
  duration: number,
  userEmail: string,
  userId?: string
) {
  try {
    console.log('💾 Saving video script to database for user:', userEmail);
    
    const result = await db.insert(videoScripts).values({
      userInput,
      content,
      videoType,
      tone,
      duration,
      userEmail,
      userId,
      createdOn: new Date().toISOString(),
    }).returning();

    console.log('✅ Script saved successfully:', result[0]);
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
      tone, 
      videoType, 
      duration, 
      includeHook,
      includeCTA,
      creativityLevel, 
      userEmail: clientEmail,
      userId: clientUserId
    } = await request.json();

    // For Better Auth, we'll trust the client-side session info
    // In production, you should validate the session with Better Auth
    const actualUserEmail = clientEmail;
    const actualUserId = clientUserId;
    
    console.log('🎬 Script generation for:', {
      clientEmail,
      clientUserId,
      actualUserEmail
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Generating video script for:', {
      topic,
      tone,
      videoType,
      duration,
      includeHook,
      includeCTA,
      creativityLevel,
      actualUserEmail
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Generate a professional video script for the topic: "${topic}"
      
      Video Type: ${videoType || 'YouTube video'}
      Tone: ${tone || 'engaging'}
      Duration: ${duration || 5} minutes
      ${includeHook ? 'Include a strong hook/opener' : ''}
      ${includeCTA ? 'Include a call-to-action at the end' : ''}
      Creativity level: ${creativityLevel || 7}/10
      
      Generate a complete script with:
      1. VIDEO TITLE (1 catchy title)
      2. HOOK/INTRO (15-30 seconds to grab attention)
      3. MAIN CONTENT (structured into 3-5 key points)
      4. VISUAL CUES (what to show on screen for each section)
      5. AUDIO NOTES (music, sound effects suggestions)
      6. ${includeCTA ? 'CALL-TO-ACTION (clear next steps for viewers)' : 'CONCLUSION (wrap up the video)'}
      
      Make the script ${tone} and optimized for ${videoType}.
      Format it as a professional script that's easy to follow.
      
      Return ONLY a JSON object with this exact structure:
      {
        "title": "Catchy Video Title Here",
        "hook": "Attention-grabbing opening lines...",
        "sections": [
          {
            "title": "Section 1 Title",
            "content": "Script content for this section...",
            "visualCues": ["Show this on screen", "Visual element to display"],
            "duration": "Estimated time for this section",
            "audioNotes": "Music or sound suggestions"
          }
        ],
        "conclusion": "Wrapping up the video...",
        "cta": "${includeCTA ? 'Clear call-to-action here...' : ''}",
        "totalDuration": "${duration || 5} minutes",
        "targetAudience": "Primary audience for this video",
        "hashtags": ["#relevant", "#hashtags"],
        "thumbnailIdeas": ["Visual idea 1", "Visual idea 2"]
      }
      
      Be creative, engaging, and production-ready!
    `;

    console.log('🤖 Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    let generatedScript;
    
    try {
      generatedScript = JSON.parse(cleanText);
      console.log('✅ Successfully parsed script');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      const jsonMatch = cleanText.match(/\{.*\}/);
      if (jsonMatch) {
        try {
          generatedScript = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted JSON from text');
        } catch (e) {
          console.error('❌ Failed to extract JSON');
          generatedScript = {
            title: `How to Master ${topic}`,
            hook: `Welcome to this video about ${topic}! Today, we're going to explore everything you need to know.`,
            sections: [
              {
                title: "Introduction",
                content: `Let's start by understanding what ${topic} is all about.`,
                visualCues: ["Title screen", "Key points on screen"],
                duration: "1 minute",
                audioNotes: "Upbeat background music"
              }
            ],
            conclusion: "That's it for today's video!",
            cta: "Like and subscribe for more content!",
            totalDuration: `${duration || 5} minutes`,
            targetAudience: "Beginners and enthusiasts",
            hashtags: [`#${topic.replace(/\s+/g, '')}`, "#video", "#tutorial"],
            thumbnailIdeas: ["Eye-catching title", "Person presenting"]
          };
        }
      } else {
        console.log('⚠️ No JSON found, using fallback');
        generatedScript = {
          title: `The Complete Guide to ${topic}`,
          hook: `Ready to dive into ${topic}? This video has everything you need!`,
          sections: [
            {
              title: "Getting Started",
              content: `First, let's cover the basics of ${topic}.`,
              visualCues: ["Intro animation", "Bullet points"],
              duration: "2 minutes",
              audioNotes: "Energetic intro music"
            }
          ],
          conclusion: "Thanks for watching!",
          cta: "Leave a comment with your questions!",
          totalDuration: `${duration || 5} minutes`,
          targetAudience: "Content creators",
          hashtags: [`#${topic}`, "#howto", "#guide"],
          thumbnailIdeas: ["Bold text", "Colorful background"]
        };
      }
    }

    // Prepare data for database
    const contentForDB = {
      script: generatedScript,
      settings: {
        topic,
        tone,
        videoType,
        duration,
        includeHook,
        includeCTA,
        creativityLevel,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        sections: generatedScript.sections?.length || 1,
        hasCTA: includeCTA,
        hasHook: includeHook
      }
    };

    // Save to database if user is logged in
    let savedRecord = null;
    const isGuestUser = !actualUserEmail || 
                       actualUserEmail === 'guest@example.com' || 
                       actualUserEmail.includes('guest');
    
    if (!isGuestUser && actualUserEmail) {
      try {
        savedRecord = await saveScriptToDatabase(
          topic,
          contentForDB,
          videoType || 'youtube',
          tone || 'engaging',
          duration || 5,
          actualUserEmail,
          actualUserId
        );
        console.log('💾 Script saved to database with ID:', savedRecord?.id);
      } catch (dbError) {
        console.error('⚠️ Failed to save to database, but continuing with response:', dbError);
      }
    } else {
      console.log('ℹ️ Guest user, skipping database save');
    }

    // Return response
    return NextResponse.json({
      success: true,
      script: generatedScript,
      saveInfo: {
        saved: !!savedRecord,
        recordId: savedRecord?.id,
        userEmail: actualUserEmail,
        message: savedRecord ? 'Script saved to database' : 'Script not saved (guest user)'
      },
      metadata: {
        duration: duration || 5,
        videoType: videoType || 'youtube',
        tone: tone || 'engaging',
        generatedAt: new Date().toISOString(),
        user: isGuestUser ? 'guest' : actualUserEmail,
        userId: actualUserId
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating script:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate video script. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}