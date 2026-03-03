import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../../db';
import { growthTips } from '../../../../db/schema';
import { CreditManager } from '../../../../lib/credit-manager';
import { eq, and } from 'drizzle-orm';
import { userToolPermissions, toolPricingTable } from '../../../../db/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest';
type GrowthStage = 'starting' | 'growing' | 'established' | 'pro';
type ContentType = 'video' | 'image' | 'carousel' | 'story' | 'reel' | 'live' | 'text';

interface GrowthTip {
  title: string;
  description: string;
  category: 'content' | 'engagement' | 'algorithm' | 'hashtags' | 'posting' | 'analytics' | 'monetization';
  priority: 'high' | 'medium' | 'low';
  implementation: string;
  expectedResult: string;
  timeToImplement: string;
}

interface PlatformGrowthStrategy {
  platform: Platform;
  overview: string;
  tips: GrowthTip[];
  weeklySchedule: {
    day: string;
    tip: string;
    action: string;
  }[];
  metrics: {
    metric: string;
    target: string;
    howToTrack: string;
  }[];
  commonMistakes: string[];
  quickWins: string[];
}

interface NicheAnalysis {
  niche: string;
  competition: 'low' | 'medium' | 'high';
  audienceInsights: {
    demographics: string[];
    painPoints: string[];
    desires: string[];
  };
  contentGaps: string[];
  trendingTopics: string[];
}

interface GrowthPackage {
  analysis: NicheAnalysis;
  strategies: PlatformGrowthStrategy[];
  monthlyPlan: {
    week: number;
    focus: string;
    actions: string[];
  }[];
  resources: {
    name: string;
    type: string;
    description: string;
    url?: string;
  }[];
  estimatedGrowth: {
    followers: string;
    engagement: string;
    timeline: string;
  };
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

// Helper function to save to database
async function saveToDatabase(
  niche: string,
  content: any,
  userEmail: string,
  userId?: string
) {
  try {
    console.log('💾 Saving growth tips to database for user:', userEmail);
    
    const result = await db.insert(growthTips).values({
      niche,
      content,
    //   userEmail,
      userId,
      createdOn: new Date().toISOString(),
    }as any).returning();

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
      niche,
      platforms,
      currentFollowers,
      growthStage,
      contentTypes,
      goals,
      userEmail,
      userId
    } = await request.json();

    console.log('📈 Growth tips generation for:', {
      niche,
      platforms,
      currentFollowers,
      growthStage,
      goals
    });

    // Check if tool is enabled for this user
    if (userId) {
      const toolEnabled = await isToolEnabledForUser(userId, 'growth_advisor');
      
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

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
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

    // CREDIT CHECK
    let requiredCredits = 5;
    
    console.log('💰 Checking credits for user:', userId);
    
    try {
      requiredCredits = await CreditManager.getToolCost('growth_advisor');
      const creditCheck = await CreditManager.hasSufficientCredits(userId, 'growth_advisor');

      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            requiredCredits: creditCheck.requiredCredits,
            currentCredits: creditCheck.currentCredits,
            message: `You need ${creditCheck.requiredCredits} credits to get growth tips. You have ${creditCheck.currentCredits} credits.`
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

    // Initialize model
    let model;
    const modelNames = [ 'gemini-2.5-flash'];
    
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

    // Platform-specific instructions
    const platformInstructions = {
      instagram: "Instagram: Focus on visual aesthetics, Reels, Stories, engagement pods, hashtag strategy, and Instagram SEO.",
      facebook: "Facebook: Focus on community building, Facebook Groups, live videos, engagement posts, and algorithm optimization.",
      youtube: "YouTube: Focus on SEO, thumbnails, retention strategies, playlists, and consistent uploading schedule.",
      tiktok: "TikTok: Focus on trends, sounds, viral hooks, posting frequency, and the For You Page algorithm.",
      linkedin: "LinkedIn: Focus on professional networking, thought leadership, article publishing, and B2B engagement.",
      twitter: "Twitter/X: Focus on threading, real-time engagement, polls, and community participation.",
      pinterest: "Pinterest: Focus on SEO-optimized pins, boards, rich pins, and seasonal content planning."
    };

    const selectedPlatformsList = platforms.map((p: Platform) => platformInstructions[p] || p).join('\n\n');

    const prompt = `
      You are an expert social media growth strategist. Create a comprehensive growth strategy for a content creator in the "${niche}" niche.

      CURRENT SITUATION:
      - Niche: ${niche}
      - Target Platforms: ${platforms.join(', ')}
      - Current Followers: ${currentFollowers || 'Just starting'}
      - Growth Stage: ${growthStage || 'growing'} (starting/growing/established/pro)
      - Preferred Content Types: ${contentTypes?.join(', ') || 'All types'}
      - Goals: ${goals || 'Increase followers and engagement'}

      Generate a complete growth package with:

      1. NICHE ANALYSIS:
      - Competition level analysis
      - Audience demographics, pain points, desires
      - Content gaps in the niche
      - Trending topics right now

      2. PLATFORM-SPECIFIC STRATEGIES (for each selected platform):
      - Platform overview and opportunity
      - 5-7 actionable growth tips with:
        * Clear title
        * Detailed description
        * Category (content/engagement/algorithm/hashtags/posting/analytics/monetization)
        * Priority level (high/medium/low)
        * Step-by-step implementation
        * Expected results
        * Time to implement
      - Weekly posting schedule with specific actions
      - Key metrics to track with targets
      - Common mistakes to avoid
      - Quick wins for immediate results

      3. 4-WEEK MONTHLY PLAN:
      - Week-by-week focus areas
      - Specific actions for each week

      4. RESOURCES:
      - Tools, apps, and resources needed
      - Learning materials

      5. ESTIMATED GROWTH PROJECTION:
      - Follower growth estimate
      - Engagement rate improvement
      - Timeline for results

      Return a JSON object with this exact structure:
      {
        "analysis": {
          "niche": "${niche}",
          "competition": "medium",
          "audienceInsights": {
            "demographics": ["Age 25-34", "60% female", "Urban professionals"],
            "painPoints": ["Lack of time", "Information overload", "Budget constraints"],
            "desires": ["Quick results", "Authentic content", "Community connection"]
          },
          "contentGaps": ["Beginner tutorials", "Behind-the-scenes", "Myth-busting content"],
          "trendingTopics": ["Topic 1", "Topic 2", "Topic 3"]
        },
        "strategies": [
          {
            "platform": "instagram",
            "overview": "Instagram strategy for ${niche}...",
            "tips": [
              {
                "title": "Optimize Your Profile",
                "description": "Complete description",
                "category": "content",
                "priority": "high",
                "implementation": "Step-by-step instructions",
                "expectedResult": "What to expect",
                "timeToImplement": "1-2 hours"
              }
            ],
            "weeklySchedule": [
              {
                "day": "Monday",
                "tip": "Post educational content",
                "action": "Create a carousel post explaining basics"
              }
            ],
            "metrics": [
              {
                "metric": "Engagement Rate",
                "target": "3-5%",
                "howToTrack": "Use Instagram Insights"
              }
            ],
            "commonMistakes": ["Not engaging with comments", "Inconsistent posting"],
            "quickWins": ["Optimize your bio", "Create highlight covers"]
          }
        ],
        "monthlyPlan": [
          {
            "week": 1,
            "focus": "Foundation & Profile Optimization",
            "actions": ["Action 1", "Action 2", "Action 3"]
          }
        ],
        "resources": [
          {
            "name": "Canva",
            "type": "Design Tool",
            "description": "For creating visuals",
            "url": "canva.com"
          }
        ],
        "estimatedGrowth": {
          "followers": "+500-1000 per month",
          "engagement": "3-5% engagement rate",
          "timeline": "3-6 months for significant growth"
        }
      }

      Make it practical, actionable, and tailored specifically for the ${niche} niche.
      Focus on proven growth strategies that work in 2024-2025.
    `;

    console.log('🤖 Sending prompt to Gemini AI...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    let generatedContent: GrowthPackage;
    
    try {
      generatedContent = JSON.parse(cleanText);
      console.log('✅ Successfully parsed growth tips');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      
      // Fallback content
      generatedContent = {
        analysis: {
          niche: niche,
          competition: "medium",
          audienceInsights: {
            demographics: ["25-34 age range", "60% female", "Urban professionals"],
            painPoints: ["Finding quality content", "Time management", "Staying updated"],
            desires: ["Authentic recommendations", "Community connection", "Value-added content"]
          },
          contentGaps: ["Beginner guides", "Case studies", "Expert interviews"],
          trendingTopics: ["Topic trends in " + niche, "Popular discussions", "Viral content formats"]
        },
        strategies: platforms.map((platform: Platform) => ({
          platform: platform,
          overview: `A comprehensive growth strategy for ${platform} in the ${niche} niche.`,
          tips: [
            {
              title: "Optimize Your Profile",
              description: `Create a compelling profile that clearly communicates your value in the ${niche} space.`,
              category: "content",
              priority: "high",
              implementation: "Update bio, profile picture, and highlights to reflect your niche expertise",
              expectedResult: "Increased profile visits and follows",
              timeToImplement: "1 hour"
            },
            {
              title: "Consistent Posting Schedule",
              description: "Post regularly to stay top-of-mind with your audience",
              category: "posting",
              priority: "high",
              implementation: "Create a content calendar with 3-5 posts per week",
              expectedResult: "Better algorithm performance and audience retention",
              timeToImplement: "Ongoing"
            },
            {
              title: "Engage With Your Community",
              description: "Build relationships by actively engaging with followers",
              category: "engagement",
              priority: "high",
              implementation: "Reply to comments within 24 hours, engage with similar accounts",
              expectedResult: "Higher engagement rates and loyal following",
              timeToImplement: "30 mins daily"
            }
          ],
          weeklySchedule: [
            {
              day: "Monday",
              tip: "Educational content",
              action: `Share tips or insights about ${niche}`
            },
            {
              day: "Wednesday",
              tip: "Engagement post",
              action: "Ask questions or create polls"
            },
            {
              day: "Friday",
              tip: "Entertainment",
              action: "Share behind-the-scenes or fun content"
            }
          ],
          metrics: [
            {
              metric: "Engagement Rate",
              target: "3-5%",
              howToTrack: "Use platform analytics"
            },
            {
              metric: "Follower Growth",
              target: "+10-20% monthly",
              howToTrack: "Track weekly in analytics"
            }
          ],
          commonMistakes: [
            "Posting inconsistently",
            "Ignoring comments",
            "Not using relevant hashtags"
          ],
          quickWins: [
            "Optimize your bio with keywords",
            "Create 3 highlight covers",
            "Engage with 10 accounts in your niche daily"
          ]
        })),
        monthlyPlan: [
          {
            week: 1,
            focus: "Foundation & Profile Optimization",
            actions: [
              "Optimize all profiles with niche keywords",
              "Create content calendar for the month",
              "Research top hashtags in your niche"
            ]
          },
          {
            week: 2,
            focus: "Content Creation & Consistency",
            actions: [
              "Create and schedule week's content",
              "Start engaging with similar accounts",
              "Analyze first week's performance"
            ]
          },
          {
            week: 3,
            focus: "Engagement & Community Building",
            actions: [
              "Host a live session or Q&A",
              "Collaborate with another creator",
              "Create engagement-focused posts"
            ]
          },
          {
            week: 4,
            focus: "Analysis & Optimization",
            actions: [
              "Review monthly analytics",
              "Adjust strategy based on data",
              "Plan next month's content"
            ]
          }
        ],
        resources: [
          {
            name: "Canva",
            type: "Design Tool",
            description: "Create professional visuals for your content",
            url: "canva.com"
          },
          {
            name: "Later",
            type: "Scheduling Tool",
            description: "Schedule posts across platforms",
            url: "later.com"
          }
        ],
        estimatedGrowth: {
          followers: "+500-1000 followers per month",
          engagement: "3-5% average engagement rate",
          timeline: "3 months for significant results"
        }
      };
    }

    // Prepare data for database
    const contentForDB = {
      package: generatedContent,
      settings: {
        niche,
        platforms,
        currentFollowers,
        growthStage,
        contentTypes,
        goals,
        generatedAt: new Date().toISOString()
      }
    };

    // DEDUCT CREDITS
    let creditDeductionResult = null;
    
    console.log('💰 Deducting credits for user:', userId);
    
    try {
      creditDeductionResult = await CreditManager.useTool(
        userId,
        'growth_advisor',
        `Generated growth strategy for ${niche} on ${platforms.length} platforms`,
        { niche, platforms }
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
        userEmail,
        userId
      );
      console.log('💾 Growth tips saved to database with ID:', savedRecord?.id);
    } catch (dbError) {
      console.error('⚠️ Failed to save to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      analysis: generatedContent.analysis,
      strategies: generatedContent.strategies,
      monthlyPlan: generatedContent.monthlyPlan,
      resources: generatedContent.resources,
      estimatedGrowth: generatedContent.estimatedGrowth,
      creditInfo: {
        deducted: true,
        amount: Math.abs(creditDeductionResult?.amount || requiredCredits),
        remainingCredits: creditDeductionResult?.remainingCredits || 0,
        transactionId: creditDeductionResult?.transactionId
      },
      saveInfo: {
        saved: !!savedRecord,
        recordId: savedRecord?.id,
        message: savedRecord ? 'Strategy saved' : 'Failed to save'
      },
      metadata: {
        niche,
        platforms: platforms.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 Error generating growth tips:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate growth tips. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}