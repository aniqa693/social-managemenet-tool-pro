import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { videoScripts } from '../../../../db/schema';
import { CreditManager } from '../../../../lib/credit-manager';
import { eq, and } from 'drizzle-orm';
import { userToolPermissions, toolPricingTable } from '../../../../db/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest';
type ContentType = 'educational' | 'entertainment' | 'promotional' | 'inspirational' | 'behind_scenes' | 'user_generated';
type PostFormat = 'carousel' | 'video' | 'image' | 'story' | 'reel' | 'live' | 'text';

interface PostIdea {
  title: string;
  description: string;
  platform: Platform;
  contentType: ContentType;
  format: PostFormat;
  hook: string;
  keyPoints: string[];
  hashtags: string[];
  estimatedEngagement: 'high' | 'medium' | 'low';
  bestTimeToPost?: string;
  targetAudience: string;
}

interface ScriptSection {
  title: string;
  content: string;
  visualCues: string[];
  duration: string;
  audioNotes: string;
}

interface ScriptType {
  title: string;
  hook: string;
  sections: ScriptSection[];
  conclusion: string;
  cta: string;
  totalDuration: string;
  targetAudience: string;
  hashtags: string[];
  thumbnailIdeas: string[];
}

interface CombinedOutput {
  script: ScriptType;
  postIdeas: PostIdea[];
  contentCalendar: {
    day: string;
    platform: string;
    postType: string;
    idea: string;
    bestTime: string;
  }[];
  engagementTips: string[];
}

// Helper function to check if tool is enabled for user
async function isToolEnabledForUser(userId: string, toolName: string): Promise<boolean> {
  try {
    const userPermission = await db.query.userToolPermissions.findFirst({
      where: and(
        eq(userToolPermissions.userId, userId),
        eq(userToolPermissions.toolName, toolName)
      )
    });

    if (userPermission) {
      return userPermission.isEnabled;
    }

    const toolSetting = await db.query.toolPricingTable.findFirst({
      where: eq(toolPricingTable.tool_name, toolName)
    });

    return toolSetting?.enable_disenable ?? true;
    
  } catch (error) {
    console.error('Error checking tool enabled status:', error);
    return true;
  }
}

// Helper function to save combined output to database
async function saveToDatabase(
  userInput: string,
  content: any,
  videoType: string,
  tone: string,
  duration: number,
  userEmail: string,
  userId?: string
) {
  try {
    console.log('💾 Saving combined output to database for user:', userEmail);
    
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

    console.log('✅ Saved successfully:', result[0]);
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
      userEmail,
      userId
    } = await request.json();

    console.log('🎬 Combined generation for:', {
      userEmail,
      userId,
      topic,
      videoType,
      duration
    });

    // Check if tool is enabled for this user
    if (userId) {
      const toolEnabled = await isToolEnabledForUser(userId, 'script_generator');
      
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

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
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
    let requiredCredits = 5; // Increased cost for combined output
    
    console.log('💰 Checking credits for user:', userId);
    
    try {
      requiredCredits = await CreditManager.getToolCost('script_generator');
      const creditCheck = await CreditManager.hasSufficientCredits(userId, 'script_generator');

      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            requiredCredits: creditCheck.requiredCredits,
            currentCredits: creditCheck.currentCredits,
            message: `You need ${creditCheck.requiredCredits} credits to generate content. You have ${creditCheck.currentCredits} credits.`
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

    console.log('🚀 Generating combined content for:', {
      topic,
      tone,
      videoType,
      duration,
      includeHook,
      includeCTA,
      creativityLevel
    });

    // Try different model names
    let model;
    const modelNames = ['gemini-2.5-flash'];
    
    for (const modelName of modelNames) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('test');
        console.log(`✅ Successfully connected to model: ${modelName}`);
        break;
      } catch (error: any) {
        console.log(`❌ Failed with model ${modelName}:`, error?.message);
        continue;
      }
    }
    
    if (!model) {
      throw new Error('Failed to connect to any Gemini model');
    }

    // Enhanced prompt for combined script and post ideas
    const prompt = `
      Generate a comprehensive content package for the topic: "${topic}"
      
      MAIN VIDEO SCRIPT REQUIREMENTS:
      - Video Type: ${videoType || 'YouTube video'}
      - Tone: ${tone || 'engaging'}
      - Duration: ${duration || 5} minutes
      ${includeHook ? '- Include a strong hook/opener' : ''}
      ${includeCTA ? '- Include a call-to-action' : ''}
      - Creativity level: ${creativityLevel || 7}/10
      
      ADDITIONAL CONTENT REQUIREMENTS:
      - Generate 5 post ideas for social media platforms
      - Create a 7-day content calendar
      - Provide engagement tips for each platform
      
      Return a JSON object with this exact structure:
      {
        "script": {
          "title": "Catchy Video Title",
          "hook": "Attention-grabbing opening lines...",
          "sections": [
            {
              "title": "Section Title",
              "content": "Script content...",
              "visualCues": ["Visual element 1", "Visual element 2"],
              "duration": "X minutes",
              "audioNotes": "Music or sound suggestions"
            }
          ],
          "conclusion": "Wrapping up...",
          "cta": "Call-to-action...",
          "totalDuration": "${duration || 5} minutes",
          "targetAudience": "Primary audience",
          "hashtags": ["#hashtag1", "#hashtag2"],
          "thumbnailIdeas": ["Thumbnail idea 1", "Thumbnail idea 2"]
        },
        "postIdeas": [
          {
            "title": "Post Title",
            "description": "Post description",
            "platform": "instagram",
            "contentType": "educational",
            "format": "carousel",
            "hook": "Attention grabber",
            "keyPoints": ["Point 1", "Point 2", "Point 3"],
            "hashtags": ["#tag1", "#tag2"],
            "estimatedEngagement": "high",
            "bestTimeToPost": "6-8 PM",
            "targetAudience": "Audience description"
          }
        ],
        "contentCalendar": [
          {
            "day": "Monday",
            "platform": "instagram",
            "postType": "educational",
            "idea": "Brief idea description",
            "bestTime": "6:00 PM"
          }
        ],
        "engagementTips": [
          "Tip 1: How to engage audience",
          "Tip 2: Platform-specific strategy"
        ]
      }
      
      Make everything cohesive and aligned with the main topic: "${topic}".
      Ensure the post ideas complement the video content and can be used for promotion.
    `;

    console.log('🤖 Sending prompt to Gemini AI...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    let generatedContent: CombinedOutput;
    
    try {
      generatedContent = JSON.parse(cleanText);
      console.log('✅ Successfully parsed combined content');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      
      // Fallback content
      generatedContent = {
        script: {
          title: `The Ultimate Guide to ${topic}`,
          hook: `Welcome to this comprehensive guide about ${topic}! Today, we'll cover everything you need to know.`,
          sections: [
            {
              title: "Introduction",
              content: `Let's start with the basics of ${topic}.`,
              visualCues: ["Title card", "Key points animation"],
              duration: "2 minutes",
              audioNotes: "Upbeat background music"
            },
            {
              title: "Main Content",
              content: `Now let's dive deep into ${topic}.`,
              visualCues: ["Demonstration footage", "Charts and graphs"],
              duration: "3 minutes",
              audioNotes: "Informative background music"
            }
          ],
          conclusion: "That wraps up our guide to " + topic + "!",
          cta: "Subscribe for more content like this!",
          totalDuration: `${duration || 5} minutes`,
          targetAudience: "Anyone interested in " + topic,
          hashtags: [`#${topic.replace(/\s+/g, '')}`, "#tutorial", "#guide"],
          thumbnailIdeas: ["Bold title text", "Eye-catching image"]
        },
        postIdeas: [
          {
            title: `5 Things You Didn't Know About ${topic}`,
            description: `Discover surprising facts about ${topic} that will blow your mind!`,
            platform: "instagram",
            contentType: "educational",
            format: "carousel",
            hook: `Think you know everything about ${topic}? Think again!`,
            keyPoints: [
              `The origin of ${topic}`,
              `Latest trends in ${topic}`,
              `Future predictions`
            ],
            hashtags: [`#${topic}`, "#facts", "#education"],
            estimatedEngagement: "high",
            bestTimeToPost: "7:00 PM",
            targetAudience: "Curious minds"
          },
          {
            title: `Behind the Scenes: Creating Our ${topic} Video`,
            description: `See how we put together our latest video about ${topic}!`,
            platform: "tiktok",
            contentType: "behind_scenes",
            format: "video",
            hook: `Want to see how we make our videos?`,
            keyPoints: [
              "Filming process",
              "Editing workflow",
              "Final touches"
            ],
            hashtags: ["#behindthescenes", "#creatorlife", "#bts"],
            estimatedEngagement: "medium",
            bestTimeToPost: "12:00 PM",
            targetAudience: "Content creators"
          },
          {
            title: `${topic} Q&A - Answering Your Questions`,
            description: `We're answering the most common questions about ${topic}!`,
            platform: "youtube",
            contentType: "entertainment",
            format: "video",
            hook: `You asked, we answered!`,
            keyPoints: [
              "Question 1 answered",
              "Question 2 answered", 
              "Question 3 answered"
            ],
            hashtags: ["#QandA", "#community", "#questions"],
            estimatedEngagement: "high",
            bestTimeToPost: "8:00 PM",
            targetAudience: "Subscribers and fans"
          }
        ],
        contentCalendar: [
          {
            day: "Monday",
            platform: "instagram",
            postType: "teaser",
            idea: `Teaser for the main ${topic} video`,
            bestTime: "6:00 PM"
          },
          {
            day: "Wednesday",
            platform: "youtube",
            postType: "video",
            idea: `Main ${topic} video goes live`,
            bestTime: "3:00 PM"
          },
          {
            day: "Friday",
            platform: "tiktok",
            postType: "behind_scenes",
            idea: `Behind the scenes of ${topic} video creation`,
            bestTime: "7:00 PM"
          },
          {
            day: "Saturday",
            platform: "twitter",
            postType: "discussion",
            idea: `Discussion thread about ${topic}`,
            bestTime: "11:00 AM"
          },
          {
            day: "Sunday",
            platform: "linkedin",
            postType: "professional",
            idea: `Professional insights on ${topic}`,
            bestTime: "10:00 AM"
          }
        ],
        engagementTips: [
          `Reply to all comments on your ${topic} video within the first hour`,
          `Create polls related to ${topic} to boost engagement`,
          `Share user-generated content about ${topic}`,
          `Cross-promote your video across all platforms`,
          `Use trending hashtags related to ${topic}`
        ]
      };
    }

    // Prepare data for database
    const contentForDB = {
      combined: generatedContent,
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
        scriptSections: generatedContent.script.sections?.length || 1,
        postIdeas: generatedContent.postIdeas?.length || 0,
        calendarDays: generatedContent.contentCalendar?.length || 0,
        tips: generatedContent.engagementTips?.length || 0
      }
    };

    // DEDUCT CREDITS for authenticated user
    let creditDeductionResult = null;
    
    console.log('💰 Deducting credits for user:', userId);
    
    try {
      creditDeductionResult = await CreditManager.useTool(
        userId,
        'script_generator',
        `Generated complete content package for: ${topic} (Script + ${generatedContent.postIdeas?.length || 0} Post Ideas)`,
        { topic, videoType, duration, postIdeasCount: generatedContent.postIdeas?.length }
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
        topic,
        contentForDB,
        videoType || 'youtube',
        tone || 'engaging',
        duration || 5,
        userEmail,
        userId
      );
      console.log('💾 Content saved to database with ID:', savedRecord?.id);
    } catch (dbError) {
      console.error('⚠️ Failed to save to database, but continuing with response:', dbError);
    }

    // Return response with credit info
    return NextResponse.json({
      success: true,
      script: generatedContent.script,
      postIdeas: generatedContent.postIdeas,
      contentCalendar: generatedContent.contentCalendar,
      engagementTips: generatedContent.engagementTips,
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
        message: savedRecord ? 'Content saved to database' : 'Failed to save content'
      },
      metadata: {
        duration: duration || 5,
        videoType: videoType || 'youtube',
        tone: tone || 'engaging',
        postIdeasCount: generatedContent.postIdeas?.length || 0,
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate content. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}