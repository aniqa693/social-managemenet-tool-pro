'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Sparkles, TrendingUp, Users, Target, 
  Zap, Check, Copy, Download, Star, Clock, 
  MessageSquare, Heart, Eye, PenTool, Lightbulb,
  Rocket, Crown, Layers, Filter, Sparkle, AlertCircle,
  BarChart, Award, Brain, Video, Camera, Music,
  Globe, Bell, Calendar, Hash, Tag, ThumbsUp,
  Share2, Settings, PowerOff, Power, Coins,
  CreditCard, LogOut, LogIn, UserPlus, Instagram,
  Facebook, Youtube, Twitter, Linkedin, Film,
  BookOpen, ChevronRight, ChevronDown, Play,
  Pause, Volume2, Maximize, Minimize, Wand2,
  Database, Save, User, Type, Grid, List
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useSession } from '../../../../../../lib/auth-client';
import { useCredits } from '../../../../../../useCredits';

// Types
type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest';
type GrowthStage = 'starting' | 'growing' | 'established' | 'pro';
type TipCategory = 'content' | 'engagement' | 'algorithm' | 'hashtags' | 'posting' | 'analytics' | 'monetization';
type Priority = 'high' | 'medium' | 'low';

interface GrowthTip {
  title: string;
  description: string;
  category: TipCategory;
  priority: Priority;
  implementation: string;
  expectedResult: string;
  timeToImplement: string;
}

interface WeeklySchedule {
  day: string;
  tip: string;
  action: string;
}

interface Metric {
  metric: string;
  target: string;
  howToTrack: string;
}

interface PlatformStrategy {
  platform: Platform;
  overview: string;
  tips: GrowthTip[];
  weeklySchedule: WeeklySchedule[];
  metrics: Metric[];
  commonMistakes: string[];
  quickWins: string[];
}

interface AudienceInsights {
  demographics: string[];
  painPoints: string[];
  desires: string[];
}

interface NicheAnalysis {
  niche: string;
  competition: 'low' | 'medium' | 'high';
  audienceInsights: AudienceInsights;
  contentGaps: string[];
  trendingTopics: string[];
}

interface MonthlyPlan {
  week: number;
  focus: string;
  actions: string[];
}

interface Resource {
  name: string;
  type: string;
  description: string;
  url?: string;
}

interface EstimatedGrowth {
  followers: string;
  engagement: string;
  timeline: string;
}

interface GrowthPackage {
  analysis: NicheAnalysis;
  strategies: PlatformStrategy[];
  monthlyPlan: MonthlyPlan[];
  resources: Resource[];
  estimatedGrowth: EstimatedGrowth;
}

interface NicheSuggestion {
  value: string;
  category: string;
  icon: React.ReactNode;
  color: string;
}

interface PlatformOption {
  value: Platform;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface ContentTypeOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface GrowthStageOption {
  value: GrowthStage;
  label: string;
  description: string;
}

export default function GrowthAdvisorPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const isLoggedIn = !!user;
  const userEmail = user?.email || '';
  const userName = user?.name || '';
  const userId = user?.id || '';

  // State
  const [niche, setNiche] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'facebook']);
  const [currentFollowers, setCurrentFollowers] = useState<string>('');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('growing');
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [analysis, setAnalysis] = useState<NicheAnalysis | null>(null);
  const [strategies, setStrategies] = useState<PlatformStrategy[]>([]);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [estimatedGrowth, setEstimatedGrowth] = useState<EstimatedGrowth | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'plan' | 'resources'>('overview');
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram');
  const [expandedTips, setExpandedTips] = useState<number[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  // Tool enabled/disabled state
  const [toolEnabled, setToolEnabled] = useState<boolean>(true);
  const [checkingToolStatus, setCheckingToolStatus] = useState<boolean>(true);
  const [toolDetails, setToolDetails] = useState<any>(null);

  // Credit management
  const { 
    balance, 
    loading: creditsLoading, 
    error: creditsError,
    refreshBalance,
    toolCost,
    fetchToolCost 
  } = useCredits(userId);

  const canAfford = isLoggedIn ? (balance >= toolCost) : false;

  // Niche suggestions
  const nicheSuggestions: NicheSuggestion[] = [
    { value: 'Fitness & Wellness', category: 'Health', icon: <Heart className="h-4 w-4" />, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'Digital Marketing', category: 'Business', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'Food & Cooking', category: 'Lifestyle', icon: <Camera className="h-4 w-4" />, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { value: 'Travel & Adventure', category: 'Lifestyle', icon: <Globe className="h-4 w-4" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'Personal Finance', category: 'Finance', icon: <Coins className="h-4 w-4" />, color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { value: 'Fashion & Beauty', category: 'Lifestyle', icon: <Sparkles className="h-4 w-4" />, color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
    { value: 'Tech & Gadgets', category: 'Technology', icon: <Zap className="h-4 w-4" />, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { value: 'Parenting & Family', category: 'Lifestyle', icon: <Heart className="h-4 w-4" />, color: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
    { value: 'Business & Entrepreneurship', category: 'Business', icon: <Rocket className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
    { value: 'Photography', category: 'Creative', icon: <Camera className="h-4 w-4" />, color: 'bg-gradient-to-r from-gray-600 to-gray-800' },
  ];

  const platformOptions: PlatformOption[] = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-gradient-to-r from-red-500 to-rose-500' },
    { value: 'tiktok', label: 'TikTok', icon: Film, color: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
    { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'bg-gradient-to-r from-slate-600 to-gray-600' },
    { value: 'pinterest', label: 'Pinterest', icon: Target, color: 'bg-gradient-to-r from-red-600 to-red-700' },
  ];

  const contentTypesOptions: ContentTypeOption[] = [
    { value: 'video', label: 'Video', icon: Video },
    { value: 'image', label: 'Images', icon: Camera },
    { value: 'carousel', label: 'Carousels', icon: Layers },
    { value: 'story', label: 'Stories', icon: Film },
    { value: 'reel', label: 'Reels/Shorts', icon: Play },
    { value: 'live', label: 'Live Videos', icon: Camera },
    { value: 'text', label: 'Text Posts', icon: Type },
  ];

  const growthStages: GrowthStageOption[] = [
    { value: 'starting', label: 'Just Starting (0-1000)', description: 'New account, building foundation' },
    { value: 'growing', label: 'Growing (1K-10K)', description: 'Building momentum' },
    { value: 'established', label: 'Established (10K-50K)', description: 'Growing audience' },
    { value: 'pro', label: 'Pro (50K+)', description: 'Large following' },
  ];

  // Check if tool is enabled
  useEffect(() => {
    const checkToolStatus = async () => {
      if (!userId) {
        setCheckingToolStatus(false);
        setToolEnabled(true);
        return;
      }

      try {
        setCheckingToolStatus(true);
        console.log('🔍 Checking tool status for user:', userId, 'tool: growth_advisor');
        
        const response = await fetch(`/api/tools/status?userId=${userId}&toolName=growth_advisor`);
        const data = await response.json();

        if (response.ok) {
          setToolEnabled(data.enabled);
          setToolDetails(data);
          console.log('✅ Tool status:', { enabled: data.enabled, source: data.source });
        } else {
          console.error('Failed to check tool status:', data.error);
          setToolEnabled(true);
        }
      } catch (error) {
        console.error('Error checking tool status:', error);
        setToolEnabled(true);
      } finally {
        setCheckingToolStatus(false);
      }
    };

    checkToolStatus();
  }, [userId]);

  useEffect(() => {
    setShowSuggestions(niche.length > 0);
  }, [niche]);

  useEffect(() => {
    fetchToolCost('growth_advisor');
  }, [fetchToolCost]);

  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  // Copy function
  const copyToClipboard = async (text: string, id: string): Promise<void> => {
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [id]: true });
      toast.success('Copied to clipboard! 📋');
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy 😢');
    }
  };

  // Toggle platform selection
  const togglePlatform = (platform: Platform): void => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p: Platform) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Toggle content type
  const toggleContentType = (type: string): void => {
    if (contentTypes.includes(type)) {
      setContentTypes(contentTypes.filter((t: string) => t !== type));
    } else {
      setContentTypes([...contentTypes, type]);
    }
  };

  // Toggle tip expansion
  const toggleTip = (index: number): void => {
    if (expandedTips.includes(index)) {
      setExpandedTips(expandedTips.filter((i: number) => i !== index));
    } else {
      setExpandedTips([...expandedTips, index]);
    }
  };

  // Generate growth strategy
  const generateStrategy = async (): Promise<void> => {
    if (!toolEnabled && isLoggedIn) {
      toast.error(
        <div className="flex items-center gap-2">
          <PowerOff className="h-5 w-5 text-red-500" />
          <span>This tool has been disabled by the administrator. Please contact support for assistance.</span>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    if (!niche.trim()) {
      toast.error('Please enter your niche');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    if (isLoggedIn && !canAfford) {
      toast.error(
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span>Insufficient credits! You need {toolCost} credits but have {balance}.</span>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const startTime = Date.now();
    setLoading(true);
    setError('');
    setAnalysis(null);
    setStrategies([]);
    setMonthlyPlan([]);
    setResources([]);
    setEstimatedGrowth(null);

    const loadingToast = toast.loading('📊 Analyzing your niche and creating growth strategy...');

    try {
      const response = await fetch('/api/growth-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche,
          platforms: selectedPlatforms,
          currentFollowers,
          growthStage,
          contentTypes,
          goals,
          userEmail: userEmail,
          userId: userId
        }),
      });

      const data = await response.json();
      const endTime = Date.now();
      setGenerationTime(endTime - startTime);

      if (!response.ok) {
        if (response.status === 403) {
          if (data.error?.includes('disabled')) {
            setToolEnabled(false);
            throw new Error('This tool has been disabled by the administrator');
          }
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate strategy');
      }

      setAnalysis(data.analysis);
      setStrategies(data.strategies || []);
      setMonthlyPlan(data.monthlyPlan || []);
      setResources(data.resources || []);
      setEstimatedGrowth(data.estimatedGrowth);
      
      if (data.strategies && data.strategies.length > 0) {
        setActivePlatform(data.strategies[0].platform);
      }
      
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }
      
      toast.dismiss(loadingToast);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          <span>
            Growth strategy created! {data.strategies?.length || 0} platforms analyzed in {(endTime - startTime)/1000}s
          </span>
        </div>,
        { duration: 5000 }
      );

    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  // Use suggestion
  const useSuggestion = (suggestion: string): void => {
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    setNiche(suggestion);
    setShowSuggestions(false);
    toast.success(`Using: ${suggestion}`, { icon: '🎯' });
  };

  // Download strategy
  const downloadStrategy = (): void => {
    if (!analysis || !strategies.length) return;

    let content = `
╔══════════════════════════════════════════════════════════════╗
║              SOCIAL MEDIA GROWTH STRATEGY                    ║
╚══════════════════════════════════════════════════════════════╝

📌 NICHE: ${analysis.niche}
📊 COMPETITION: ${analysis.competition.toUpperCase()}
📅 GENERATED: ${new Date().toLocaleString()}
👤 ACCOUNT STAGE: ${growthStage}
👥 CURRENT FOLLOWERS: ${currentFollowers || 'Not specified'}

${'═'.repeat(60)}

🔍 NICHE ANALYSIS
${'═'.repeat(60)}

COMPETITION LEVEL: ${analysis.competition}

AUDIENCE INSIGHTS:
${'─'.repeat(40)}
DEMOGRAPHICS:
${analysis.audienceInsights.demographics.map((d: string) => `• ${d}`).join('\n')}

PAIN POINTS:
${analysis.audienceInsights.painPoints.map((p: string) => `• ${p}`).join('\n')}

DESIRES:
${analysis.audienceInsights.desires.map((d: string) => `• ${d}`).join('\n')}

CONTENT GAPS:
${analysis.contentGaps.map((g: string) => `• ${g}`).join('\n')}

TRENDING TOPICS:
${analysis.trendingTopics.map((t: string) => `• ${t}`).join('\n')}

${'═'.repeat(60)}

📱 PLATFORM STRATEGIES
${'═'.repeat(60)}

${strategies.map((strategy: PlatformStrategy) => `
${strategy.platform.toUpperCase()} STRATEGY
${'─'.repeat(40)}
OVERVIEW:
${strategy.overview}

TOP PRIORITY TIPS:
${strategy.tips.filter((tip: GrowthTip) => tip.priority === 'high').map((tip: GrowthTip, idx: number) => `
TIP ${idx + 1}: ${tip.title}
• ${tip.description}
• IMPLEMENTATION: ${tip.implementation}
• EXPECTED RESULT: ${tip.expectedResult}
• TIME: ${tip.timeToImplement}
`).join('\n')}

QUICK WINS:
${strategy.quickWins.map((w: string) => `• ${w}`).join('\n')}

COMMON MISTAKES TO AVOID:
${strategy.commonMistakes.map((m: string) => `• ${m}`).join('\n')}

KEY METRICS TO TRACK:
${strategy.metrics.map((m: Metric) => `• ${m.metric}: Target ${m.target} (Track via ${m.howToTrack})`).join('\n')}
`).join('\n' + '─'.repeat(40) + '\n')}

${'═'.repeat(60)}

📅 4-WEEK ACTION PLAN
${'═'.repeat(60)}

${monthlyPlan.map((week: MonthlyPlan) => `
WEEK ${week.week}: ${week.focus}
${week.actions.map((a: string) => `• ${a}`).join('\n')}
`).join('\n')}

${'═'.repeat(60)}

🛠️ RECOMMENDED RESOURCES
${'═'.repeat(60)}

${resources.map((r: Resource) => `• ${r.name} (${r.type}): ${r.description}${r.url ? ` - ${r.url}` : ''}`).join('\n')}

${'═'.repeat(60)}

📈 ESTIMATED GROWTH PROJECTION
${'═'.repeat(60)}

FOLLOWERS: ${estimatedGrowth?.followers || 'N/A'}
ENGAGEMENT: ${estimatedGrowth?.engagement || 'N/A'}
TIMELINE: ${estimatedGrowth?.timeline || 'N/A'}

${'═'.repeat(60)}
Generated by AI Growth Advisor
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth_strategy_${niche.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Growth strategy downloaded! 💾');
  };

  // Get priority color
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: TipCategory): React.ReactNode => {
    switch (category) {
      case 'content': return <Camera className="h-4 w-4" />;
      case 'engagement': return <Heart className="h-4 w-4" />;
      case 'algorithm': return <Brain className="h-4 w-4" />;
      case 'hashtags': return <Hash className="h-4 w-4" />;
      case 'posting': return <Clock className="h-4 w-4" />;
      case 'analytics': return <BarChart className="h-4 w-4" />;
      case 'monetization': return <Coins className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  if (sessionLoading || checkingToolStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full mb-4">
              <Rocket className="h-6 w-6" />
              <span className="font-semibold">AI Growth Advisor</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Personalized Social Media Growth Strategy
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Get custom growth tips for Facebook, Instagram, and more based on your specific niche and goals.
            </p>
          </div>
          
          {/* Credit Display */}
          <div className="flex items-center gap-4">
            {isLoggedIn && !toolEnabled && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full border border-red-300">
                <PowerOff className="h-4 w-4" />
                <span className="text-sm font-medium">Tool Disabled</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-white shadow-md rounded-full px-6 py-3 border border-purple-200">
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || 'User'} 
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-700">
                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">{balance}</span>
                  {balance < toolCost && (
                    <Badge variant="destructive" className="text-xs ml-1">Low</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm">
              <Coins className="h-4 w-4 mr-1 inline" />
              Cost: {toolCost} credits
            </Badge>
            
            {isLoggedIn && (
              <Badge className={`px-4 py-2 text-sm ${toolEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {toolEnabled ? (
                  <>
                    <Power className="h-4 w-4 mr-1 inline" />
                    Tool Enabled
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4 mr-1 inline" />
                    Tool Disabled
                  </>
                )}
              </Badge>
            )}
            
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm">
              <Target className="h-4 w-4 mr-1 inline" />
              Niche-Based Strategy
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Tool Disabled Warning */}
        {isLoggedIn && !toolEnabled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
            <PowerOff className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Tool Disabled by Administrator</p>
              <p className="text-sm text-red-600">
                The growth advisor tool has been disabled. Please contact support if you believe this is an error.
              </p>
              {toolDetails?.source === 'custom' && toolDetails?.updatedBy && (
                <p className="text-xs text-red-500 mt-1">
                  Disabled by {toolDetails.updatedBy} on {new Date(toolDetails.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Credit Warning */}
        {isLoggedIn && !canAfford && toolEnabled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Insufficient Credits</p>
              <p className="text-sm text-red-600">
                You need {toolCost} credits to get growth strategy. You have {balance} credits.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-300"
              onClick={() => toast.success('Redirecting to purchase page...')}
            >
              Buy Credits
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1 space-y-8">
            <Card className={`shadow-xl border-0 ${
              isLoggedIn && !toolEnabled 
                ? 'border-red-300 bg-red-50/30 opacity-75' 
                : !canAfford && isLoggedIn && toolEnabled 
                  ? 'border-red-300 bg-red-50/30' 
                  : 'bg-gradient-to-br from-white to-gray-50'
            }`}>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                  <Settings className="h-6 w-6 text-indigo-500" />
                  Your Profile
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Tell us about your niche and goals
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Niche Input */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Your Niche
                    <Badge className="ml-2 bg-indigo-100 text-indigo-700">Required</Badge>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g., Fitness, Digital Marketing, Food, Travel..."
                      value={niche}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNiche(e.target.value)}
                      className={`h-14 text-lg border-2 pl-12 text-gray-900 ${
                        isLoggedIn && !toolEnabled 
                          ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                          : 'border-gray-300 focus:border-indigo-500'
                      }`}
                      disabled={isLoggedIn && !toolEnabled}
                    />
                    <TrendingUp className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                  </div>
                  
                  {showSuggestions && toolEnabled && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 flex items-center gap-2">
                        <Lightbulb className="h-3 w-3" />
                        Popular Niches:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {nicheSuggestions.map((suggestion: NicheSuggestion, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => useSuggestion(suggestion.value)}
                            disabled={isLoggedIn && !toolEnabled}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-indigo-400 hover:shadow-md transition-all duration-200 ${
                              isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                            } bg-white`}
                          >
                            <div className={`p-1.5 rounded-md ${suggestion.color}`}>
                              {suggestion.icon}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm text-gray-900">{suggestion.value}</div>
                              <div className="text-xs text-gray-500">{suggestion.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-500" />
                    Platforms You Use
                    <Badge className="ml-2 bg-purple-100 text-purple-700">Select at least one</Badge>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {platformOptions.map((platform: PlatformOption) => {
                      const Icon = platform.icon;
                      return (
                        <button
                          key={platform.value}
                          onClick={() => togglePlatform(platform.value)}
                          disabled={isLoggedIn && !toolEnabled}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                            isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            selectedPlatforms.includes(platform.value)
                              ? `${platform.color} text-white border-transparent shadow-lg scale-105`
                              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{platform.label}</span>
                          {selectedPlatforms.includes(platform.value) && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Followers */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Current Followers (Optional)
                  </Label>
                  <Input
                    placeholder="e.g., 1000, 10K, 50K+"
                    value={currentFollowers}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentFollowers(e.target.value)}
                    className={`border-2 ${
                      isLoggedIn && !toolEnabled 
                        ? 'border-gray-300 bg-gray-100' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    disabled={isLoggedIn && !toolEnabled}
                  />
                </div>

                {/* Growth Stage */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-green-500" />
                    Growth Stage
                  </Label>
                  <Select 
                    value={growthStage} 
                    onValueChange={(value: GrowthStage) => setGrowthStage(value)}
                    disabled={isLoggedIn && !toolEnabled}
                  >
                    <SelectTrigger className={`border-2 h-12 ${
                      isLoggedIn && !toolEnabled ? 'border-gray-300 bg-gray-100' : 'border-gray-300'
                    }`}>
                      <SelectValue placeholder="Select your stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {growthStages.map((stage: GrowthStageOption) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div>
                            <div>{stage.label}</div>
                            <div className="text-xs text-gray-500">{stage.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Types */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-pink-500" />
                    Content Types You Create
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {contentTypesOptions.map((type: ContentTypeOption) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => toggleContentType(type.value)}
                          disabled={isLoggedIn && !toolEnabled}
                          className={`flex items-center gap-1 px-3 py-2 rounded-full border transition-all ${
                            isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            contentTypes.includes(type.value)
                              ? 'bg-pink-500 text-white border-pink-500'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="text-xs">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Your Goals (Optional)
                  </Label>
                  <Textarea
                    placeholder="e.g., Increase engagement, grow followers, monetize, build community..."
                    value={goals}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoals(e.target.value)}
                    className={`min-h-[80px] border-2 ${
                      isLoggedIn && !toolEnabled 
                        ? 'border-gray-300 bg-gray-100' 
                        : 'border-gray-300 focus:border-orange-500'
                    }`}
                    disabled={isLoggedIn && !toolEnabled}
                  />
                </div>

                {/* What You'll Get */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    You'll receive:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Niche analysis & audience insights
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Platform-specific growth tips
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Weekly content schedule
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      4-week action plan
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Recommended tools & resources
                    </li>
                  </ul>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateStrategy}
                  disabled={
                    loading || 
                    !niche.trim() || 
                    selectedPlatforms.length === 0 ||
                    (isLoggedIn && !canAfford) ||
                    (isLoggedIn && !toolEnabled)
                  }
                  className={`w-full h-14 text-lg ${
                    isLoggedIn && !toolEnabled
                      ? 'bg-gray-400 cursor-not-allowed'
                      : !canAfford && isLoggedIn
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700'
                  } shadow-lg hover:shadow-xl transition-all duration-300 text-white`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Your Growth Strategy...
                    </>
                  ) : isLoggedIn && !toolEnabled ? (
                    <>
                      <PowerOff className="h-5 w-5 mr-2" />
                      Tool Disabled by Admin
                    </>
                  ) : !canAfford && isLoggedIn ? (
                    <>
                      <Coins className="h-5 w-5 mr-2" />
                      Need {toolCost} Credits (You have {balance})
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5 mr-2" />
                      Generate Growth Strategy ({toolCost} Credits)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-8">
            {analysis && strategies.length > 0 ? (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Rocket className="h-6 w-6 text-indigo-500" />
                      Your Growth Strategy
                    </h2>
                    <p className="text-gray-600">
                      Niche: <span className="font-semibold text-indigo-700">{analysis.niche}</span> • 
                      Competition: <Badge variant="outline" className="ml-1 capitalize">{analysis.competition}</Badge>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadStrategy}
                    className="border-indigo-300 hover:border-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Strategy
                  </Button>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'overview' | 'strategies' | 'plan' | 'resources')}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="strategies" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Strategies
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      4-Week Plan
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Resources
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <Card className="shadow-xl border-0">
                      <CardContent className="pt-6 space-y-6">
                        {/* Audience Insights */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Audience Insights
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Demographics</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {analysis.audienceInsights.demographics.map((item: string, i: number) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Pain Points</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {analysis.audienceInsights.painPoints.map((item: string, i: number) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Desires</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {analysis.audienceInsights.desires.map((item: string, i: number) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Content Gaps */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-500" />
                            Content Gaps & Opportunities
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Content Gaps to Fill</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {analysis.contentGaps.map((gap: string, i: number) => (
                                    <li key={i} className="text-sm p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                      {gap}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Trending Topics</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {analysis.trendingTopics.map((topic: string, i: number) => (
                                    <li key={i} className="text-sm p-2 bg-green-50 rounded-lg border border-green-200">
                                      🔥 {topic}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Estimated Growth */}
                        {estimatedGrowth && (
                          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-indigo-700">
                                <Rocket className="h-5 w-5" />
                                Estimated Growth Projection
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                  <div className="text-2xl font-bold text-indigo-600">{estimatedGrowth.followers}</div>
                                  <div className="text-sm text-gray-600">Follower Growth</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                  <div className="text-2xl font-bold text-green-600">{estimatedGrowth.engagement}</div>
                                  <div className="text-sm text-gray-600">Engagement Rate</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                  <div className="text-2xl font-bold text-purple-600">{estimatedGrowth.timeline}</div>
                                  <div className="text-sm text-gray-600">Timeline</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Strategies Tab */}
                  <TabsContent value="strategies">
                    <div className="space-y-6">
                      {/* Platform Selector */}
                      <div className="flex flex-wrap gap-2">
                        {strategies.map((strategy: PlatformStrategy) => {
                          const platform = platformOptions.find((p: PlatformOption) => p.value === strategy.platform);
                          const Icon = platform?.icon || Target;
                          const isActive = activePlatform === strategy.platform;
                          
                          return (
                            <Button
                              key={strategy.platform}
                              variant={isActive ? "default" : "outline"}
                              onClick={() => setActivePlatform(strategy.platform)}
                              className={isActive ? `bg-gradient-to-r ${platform?.color} text-white` : ''}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {platform?.label}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Active Platform Strategy */}
                      {strategies.map((strategy: PlatformStrategy) => {
                        if (strategy.platform !== activePlatform) return null;
                        
                        const platform = platformOptions.find((p: PlatformOption) => p.value === strategy.platform);
                        
                        return (
                          <div key={strategy.platform} className="space-y-6">
                            {/* Overview */}
                            <Card className="shadow-xl border-0">
                              <CardHeader className={`bg-gradient-to-r ${platform?.color} text-white rounded-t-lg`}>
                                <CardTitle>{platform?.label} Strategy Overview</CardTitle>
                                <CardDescription className="text-white/90">
                                  Tailored for your {niche} niche
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-6">
                                <p className="text-gray-700">{strategy.overview}</p>
                              </CardContent>
                            </Card>

                            {/* Quick Wins */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                  <Zap className="h-5 w-5" />
                                  Quick Wins (Do These First)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {strategy.quickWins.map((win: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span className="text-sm text-gray-700">{win}</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Growth Tips */}
                            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">
                              Detailed Growth Tips
                            </h3>
                            
                            {strategy.tips.map((tip: GrowthTip, index: number) => (
                              <Card key={index} className="border-2 hover:border-indigo-300 transition-all">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => toggleTip(index)}
                                        className="h-8 w-8 border-2 border-indigo-300"
                                      >
                                        {expandedTips.includes(index) ? (
                                          <ChevronDown className="h-4 w-4 text-indigo-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-indigo-500" />
                                        )}
                                      </Button>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge className={getPriorityColor(tip.priority)}>
                                            {tip.priority} priority
                                          </Badge>
                                          <Badge variant="outline" className="capitalize">
                                            <span className="flex items-center gap-1">
                                              {getCategoryIcon(tip.category)}
                                              {tip.category}
                                            </span>
                                          </Badge>
                                        </div>
                                        <CardTitle className="text-lg text-gray-900">
                                          {tip.title}
                                        </CardTitle>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                <AnimatePresence>
                                  {expandedTips.includes(index) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <CardContent className="space-y-4 pt-0">
                                        <p className="text-gray-600">{tip.description}</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                                          <div>
                                            <div className="text-xs text-gray-500 mb-1">Implementation</div>
                                            <div className="text-sm text-gray-700">{tip.implementation}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-gray-500 mb-1">Expected Result</div>
                                            <div className="text-sm text-gray-700">{tip.expectedResult}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-gray-500 mb-1">Time to Implement</div>
                                            <div className="text-sm text-gray-700">{tip.timeToImplement}</div>
                                          </div>
                                        </div>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copyToClipboard(
                                            `${tip.title}\n\n${tip.description}\n\nImplementation: ${tip.implementation}\nExpected Result: ${tip.expectedResult}`,
                                            `tip-${index}`
                                          )}
                                          className="mt-2"
                                        >
                                          {copiedStates[`tip-${index}`] ? (
                                            <>
                                              <Check className="h-3 w-3 mr-2" />
                                              Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3 w-3 mr-2" />
                                              Copy Tip
                                            </>
                                          )}
                                        </Button>
                                      </CardContent>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Card>
                            ))}

                            {/* Weekly Schedule */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-600">
                                  <Calendar className="h-5 w-5" />
                                  Weekly Content Schedule
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {strategy.weeklySchedule.map((day: WeeklySchedule, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg">
                                      <Badge className="bg-blue-500 text-white min-w-[80px]">
                                        {day.day}
                                      </Badge>
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{day.tip}</div>
                                        <div className="text-sm text-gray-600">{day.action}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Metrics to Track */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                  <BarChart className="h-5 w-5" />
                                  Key Metrics to Track
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {strategy.metrics.map((metric: Metric, i: number) => (
                                    <div key={i} className="p-3 border rounded-lg">
                                      <div className="font-medium text-gray-900">{metric.metric}</div>
                                      <div className="text-sm text-gray-600">Target: {metric.target}</div>
                                      <div className="text-xs text-gray-500 mt-1">Track: {metric.howToTrack}</div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Common Mistakes */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="h-5 w-5" />
                                  Common Mistakes to Avoid
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {strategy.commonMistakes.map((mistake: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-700">
                                      <span className="text-red-500 font-bold">•</span>
                                      {mistake}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* 4-Week Plan Tab */}
                  <TabsContent value="plan">
                    <div className="space-y-4">
                      {monthlyPlan.map((week: MonthlyPlan) => (
                        <Card key={week.week} className="border-l-4 border-l-indigo-500">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="font-bold text-indigo-600">{week.week}</span>
                              </div>
                              <div>
                                <CardTitle className="text-lg">Week {week.week}: {week.focus}</CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {week.actions.map((action: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-gray-700">{action}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-600">
                          <BookOpen className="h-5 w-5" />
                          Recommended Tools & Resources
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resources.map((resource: Resource, i: number) => (
                            <Card key={i} className="hover:shadow-md transition-all">
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <Award className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {resource.type}
                                    </Badge>
                                    <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
                                    {resource.url && (
                                      <a 
                                        href={`https://${resource.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                      >
                                        Visit {resource.url}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-8">
                    <Rocket className="h-12 w-12 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Grow Your Audience?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Fill in your details to get a personalized growth strategy for your niche.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Target className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
                      <span>Niche Analysis</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                      <span>Growth Tips</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-green-500 mx-auto mb-2" />
                      <span>Weekly Plan</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <BookOpen className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                      <span>Resources</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">AI Growth Advisor</div>
                  <div className="text-sm text-gray-600">Personalized niche-based strategies</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Get custom growth tips for your specific niche and platforms.
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{strategies.length}</div>
                <div className="text-xs text-gray-600">Platforms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {strategies.reduce((acc: number, s: PlatformStrategy) => acc + s.tips.length, 0)}
                </div>
                <div className="text-xs text-gray-600">Growth Tips</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(generationTime/1000).toFixed(1)}s</div>
                <div className="text-xs text-gray-600">Generation</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="hover:text-indigo-500 transition-colors">
                <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-indigo-500">
                  Caption Generator
                </Button>
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/titles" className="hover:text-purple-500 transition-colors">
                <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-purple-500">
                  Title Generator
                </Button>
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/script" className="hover:text-pink-500 transition-colors">
                <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-pink-500">
                  Script Generator
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              © {new Date().getFullYear()} AI Growth Advisor. All rights reserved.
              <span className="ml-2 text-xs text-gray-400">
                Logged in as: {userEmail} • Credits: {balance}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-transparent rounded-full animate-spin border-t-indigo-500 border-r-purple-500 border-b-pink-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Rocket className="h-12 w-12 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">
              Analyzing Your Niche...
            </p>
            <p className="mt-2 text-gray-600 max-w-md">
              Creating personalized growth strategy for {selectedPlatforms.length} platforms in the {niche} niche
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Niche Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <span>Platform Tips</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span>Action Plan</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}