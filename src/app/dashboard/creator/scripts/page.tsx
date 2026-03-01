'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Sparkles, Copy, PlayCircle, Camera, Music, 
  Clock, TrendingUp, Palette, Volume2, Check, 
  Share2, Download, Star, Target, Zap, Film,
  Clipboard, Grid, List, Database, Save, User,
  LogOut, Type, Tag, Youtube, Instagram, 
  Facebook, Twitter, Linkedin, Eye, PenTool, Lightbulb,
  Rocket, Crown, Layers, Filter, Sparkle, AlertCircle,
  ThumbsUp, BarChart, Award, Brain, Video,
  Headphones, Mic, Edit, Scissors, Globe, Bell,
  Maximize, Minimize, ChevronRight, ChevronDown,
  Play, Pause, Volume2 as VolumeIcon, Settings,
  FileText, BookOpen, MessageSquare,
  Wand2, Coins, CreditCard, PowerOff, Power
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useSession } from '../../../../../lib/auth-client';
import { useCredits } from '../../../../../useCredits';

type ScriptSection = {
  title: string;
  content: string;
  visualCues: string[];
  duration: string;
  audioNotes: string;
};

type ScriptType = {
  title: string;
  hook: string;
  sections: ScriptSection[];
  conclusion: string;
  cta: string;
  totalDuration: string;
  targetAudience: string;
  hashtags: string[];
  thumbnailIdeas: string[];
};

type TopicSuggestion = {
  value: string;
  category: string;
  icon: React.ReactNode;
  color: string;
};

export default function VideoScriptGeneratorPage() {
  // Get real user session from your auth system
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const isLoggedIn = !!user;
  const userEmail = user?.email || '';
  const userName = user?.name || '';
  const userId = user?.id || '';

  // State
  const [topic, setTopic] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [script, setScript] = useState<ScriptType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('engaging');
  const [videoType, setVideoType] = useState('youtube');
  const [duration, setDuration] = useState(5);
  const [includeHook, setIncludeHook] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState([8]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [saveStatus, setSaveStatus] = useState<{saved: boolean; recordId?: number}>({saved: false});
  const [selectedTab, setSelectedTab] = useState('generate');
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // NEW: Tool enabled/disabled state
  const [toolEnabled, setToolEnabled] = useState<boolean>(true);
  const [checkingToolStatus, setCheckingToolStatus] = useState<boolean>(true);
  const [toolDetails, setToolDetails] = useState<any>(null);

  // Credit management hook with real user ID
  const { 
    balance, 
    loading: creditsLoading, 
    error: creditsError,
    checkCredits,
    refreshBalance,
    toolCost,
    fetchToolCost 
  } = useCredits(userId);

  // Check if user can afford
  const canAfford = isLoggedIn ? (balance >= toolCost) : false;

  // NEW: Check if tool is enabled for this user
  useEffect(() => {
    const checkToolStatus = async () => {
      if (!userId) {
        setCheckingToolStatus(false);
        setToolEnabled(true); // Default to enabled for guests/unauthenticated
        return;
      }

      try {
        setCheckingToolStatus(true);
        console.log('🔍 Checking tool status for user:', userId, 'tool: script_generator');
        
        const response = await fetch(`/api/tools/status?userId=${userId}&toolName=script_generator`);
        const data = await response.json();

        if (response.ok) {
          setToolEnabled(data.enabled);
          setToolDetails(data);
          console.log('✅ Tool status:', { enabled: data.enabled, source: data.source });
          
          if (!data.enabled) {
            console.log('⚠️ Script generator is disabled for this user');
          }
        } else {
          console.error('Failed to check tool status:', data.error);
          setToolEnabled(true); // Default to enabled on error
        }
      } catch (error) {
        console.error('Error checking tool status:', error);
        setToolEnabled(true); // Default to enabled on error
      } finally {
        setCheckingToolStatus(false);
      }
    };

    checkToolStatus();
  }, [userId]);

  // Data
  const topicSuggestions: TopicSuggestion[] = [
    { value: 'How to Start a YouTube Channel', category: 'Tutorial', icon: <Youtube className="h-4 w-4" />, color: 'bg-gradient-to-r from-red-500 to-pink-500' },
    { value: 'Product Review Script', category: 'Review', icon: <Star className="h-4 w-4" />, color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
    { value: 'Educational Science Video', category: 'Education', icon: <Brain className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'Travel Vlog Script', category: 'Travel', icon: <Globe className="h-4 w-4" />, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'Business Tutorial', category: 'Business', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    { value: 'Cooking Demonstration', category: 'Food', icon: <ChevronRight className="h-4 w-4" />, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  ];

  const tones = [
    { value: 'engaging', label: 'Engaging', icon: <Sparkles className="h-4 w-4" />, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    { value: 'professional', label: 'Professional', icon: <Award className="h-4 w-4" />, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { value: 'energetic', label: 'Energetic', icon: <Zap className="h-4 w-4" />, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    { value: 'educational', label: 'Educational', icon: <BookOpen className="h-4 w-4" />, color: 'text-green-500', bgColor: 'bg-green-100' },
    { value: 'conversational', label: 'Conversational', icon: <MessageSquare className="h-4 w-4" />, color: 'text-pink-500', bgColor: 'bg-pink-100' },
    { value: 'dramatic', label: 'Dramatic', icon: <Camera className="h-4 w-4" />, color: 'text-red-500', bgColor: 'bg-red-100' },
  ];

  const videoTypes = [
    { value: 'youtube', label: 'YouTube Video', icon: Youtube, color: 'bg-gradient-to-r from-red-500 to-pink-500' },
    { value: 'instagram', label: 'Instagram Reels', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'tiktok', label: 'TikTok', icon: Film, color: 'bg-gradient-to-r from-black to-gray-800' },
    { value: 'facebook', label: 'Facebook Video', icon: Facebook, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
    { value: 'twitter', label: 'Twitter Video', icon: Twitter, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { value: 'linkedin', label: 'LinkedIn Video', icon: Linkedin, color: 'bg-gradient-to-r from-blue-700 to-blue-900' },
    { value: 'tutorial', label: 'Tutorial', icon: PlayCircle, color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    { value: 'vlog', label: 'Vlog', icon: Film, color: 'bg-gradient-to-r from-orange-500 to-yellow-500' },
  ];

  const durations = [
    { value: 1, label: '1 min' },
    { value: 3, label: '3 min' },
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
  ];

  // Effects
  useEffect(() => {
    setShowSuggestions(topic.length > 0);
    
    // Log session info for debugging
    if (user) {
      console.log('✅ User authenticated:', { 
        email: user.email, 
        name: user.name,
        id: user.id
      });
    }
  }, [topic, user]);

  // Fetch tool cost on mount
  useEffect(() => {
    fetchToolCost('script_generator');
  }, [fetchToolCost]);

  // Refresh balance when user logs in
  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  // Functions
  const copyToClipboard = async (text: string) => {
    // NEW: Check if tool is disabled
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard! 📋');
    } catch (err) {
      toast.error('Failed to copy 😢');
    }
  };

  const copyFullScript = () => {
    // NEW: Check if tool is disabled
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    if (!script) return;
    
    const fullScript = `
🎬 VIDEO SCRIPT: ${script.title}
⏱️ Duration: ${script.totalDuration}
🎯 Target: ${script.targetAudience}

🎣 HOOK:
${script.hook}

${script.sections.map((section, idx) => `
📝 SECTION ${idx + 1}: ${section.title}
⏱️ ${section.duration}
${section.content}

🎥 VISUAL CUES:
${section.visualCues.map(cue => `• ${cue}`).join('\n')}

🔊 AUDIO NOTES:
${section.audioNotes}
`).join('\n' + '─'.repeat(40) + '\n')}

🏁 CONCLUSION:
${script.conclusion}

📢 CALL-TO-ACTION:
${script.cta}

🏷️ HASHTAGS:
${script.hashtags.join(' ')}

🖼️ THUMBNAIL IDEAS:
${script.thumbnailIdeas.map(idea => `• ${idea}`).join('\n')}
    `;
    
    navigator.clipboard.writeText(fullScript);
    toast.success('Full script copied! 📋');
  };

  const downloadScript = () => {
    // NEW: Check if tool is disabled
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    if (!script) return;
    
    const content = `
🎬 VIDEO SCRIPT
${'═'.repeat(50)}

📌 TITLE: ${script.title}
⏱️ TOTAL DURATION: ${script.totalDuration}
🎯 TARGET AUDIENCE: ${script.targetAudience}
📅 GENERATED: ${new Date().toLocaleDateString()}

${'─'.repeat(50)}

🎣 HOOK/INTRO (15-30 seconds)
${'─'.repeat(30)}
${script.hook}

${'─'.repeat(50)}

📝 MAIN CONTENT
${'─'.repeat(30)}
${script.sections.map((section, idx) => `
SECTION ${idx + 1}: ${section.title}
Duration: ${section.duration}

SCRIPT:
${section.content}

VISUAL CUES:
${section.visualCues.map(cue => `• ${cue}`).join('\n')}

AUDIO NOTES:
${section.audioNotes}
`).join('\n' + '─'.repeat(30) + '\n')}

${'─'.repeat(50)}

🏁 CONCLUSION
${'─'.repeat(30)}
${script.conclusion}

${'─'.repeat(50)}

📢 CALL-TO-ACTION
${'─'.repeat(30)}
${script.cta}

${'─'.repeat(50)}

🏷️ RECOMMENDED HASHTAGS
${'─'.repeat(30)}
${script.hashtags.join('\n')}

${'─'.repeat(50)}

🖼️ THUMBNAIL IDEAS
${'─'.repeat(30)}
${script.thumbnailIdeas.map(idea => `• ${idea}`).join('\n')}

${'═'.repeat(50)}
Generated by AI Video Script Generator
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${topic.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Script downloaded! 💾');
  };

  const generateScript = async () => {
    // NEW: Check if tool is disabled by admin
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

    if (!topic.trim()) {
      toast.error('Please enter a video topic');
      return;
    }

    // Credit check for authenticated users
    if (!canAfford) {
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
    setScript(null);
    setSaveStatus({saved: false});

    const loadingToast = toast.loading('🎬 Crafting your video script...');

    try {
      console.log('Sending request with user:', { 
        email: userEmail, 
        isLoggedIn, 
        name: userName,
        userId
      });

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          tone, 
          videoType,
          duration,
          includeHook,
          includeCTA,
          creativityLevel: creativityLevel[0],
          userEmail: userEmail,
          userId: userId
        }),
      });

      const data = await response.json();
      const endTime = Date.now();
      setGenerationTime(endTime - startTime);

      if (!response.ok) {
        // Handle credit-specific errors
        if (response.status === 403) {
          if (data.error?.includes('disabled')) {
            // Tool disabled error
            setToolEnabled(false);
            throw new Error('This tool has been disabled by the administrator');
          }
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate script');
      }

      setScript(data.script);
      setExpandedSections([0]);
      setCurrentSection(0);
      
      // Refresh balance if credits were deducted
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }
      
      if (data.saveInfo?.saved) {
        setSaveStatus({ saved: true, recordId: data.saveInfo.recordId });
        toast.dismiss(loadingToast);
        
        // Show success message with credit info
        toast.success(
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-green-500" />
            <span>
              Script generated! Used {data.creditInfo?.amount || toolCost} credits. 
              Remaining: {data.creditInfo?.remainingCredits || balance - toolCost}
            </span>
          </div>,
          { duration: 5000 }
        );
      } else {
        setSaveStatus({ saved: false });
        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-yellow-500" />
            <span>Script generated in {(endTime - startTime)/1000}s! 🚀</span>
          </div>,
          { duration: 4000 }
        );
      }

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

  const useSuggestion = (suggestion: string) => {
    // NEW: Check if tool is disabled
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    setTopic(suggestion);
    setShowSuggestions(false);
    toast.success(`Using: ${suggestion}`, { icon: '🎬' });
  };

  const toggleSection = (index: number) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  const playScript = () => {
    // NEW: Check if tool is disabled
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    setIsPlaying(true);
    toast.success('Playing script preview...');
    
    // Simulate script playback
    setTimeout(() => {
      setIsPlaying(false);
    }, 5000);
  };

  const VideoIcon = videoTypes.find(v => v.value === videoType)?.icon || Film;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-purple-500 text-white px-6 py-3 rounded-full mb-4">
              <Film className="h-6 w-6" />
              <span className="font-semibold">AI Video Script Generator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-purple-500">
                Create Production-Ready Video Scripts
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Generate complete video scripts with visual cues, audio notes, and timing. Perfect for YouTube, TikTok, and more.
            </p>
          </div>
          
          {/* Credit Display for Authenticated User */}
          <div className="flex items-center gap-4">
            {/* Tool Status Indicator */}
            {isLoggedIn && !toolEnabled && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full border border-red-300">
                <PowerOff className="h-4 w-4" />
                <span className="text-sm font-medium">Tool Disabled</span>
              </div>
            )}
            
            <Link href="/">
              <Button variant="outline" className="gap-2 border-2 border-purple-300 hover:border-purple-500">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Captions
              </Button>
            </Link>
            <Link href="/titles">
              <Button variant="outline" className="gap-2 border-2 border-blue-300 hover:border-blue-500">
                <Type className="h-4 w-4 text-blue-500" />
                Titles
              </Button>
            </Link>
            
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

        {/* Credit Info Bar */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex gap-4">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm">
              <Coins className="h-4 w-4 mr-1 inline" />
              Cost: {toolCost} credits per generation
            </Badge>
            
            {/* Tool Status Badge for logged in users */}
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
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Your balance: {balance} credits
            </Badge>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{duration}m</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Layers className="h-4 w-4" />
              <span className="text-sm">{script?.sections?.length || 0} sections</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm">{(generationTime/1000).toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Coins className="h-4 w-4" />
              <span className="text-sm">{balance} credits</span>
            </div>
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
                The video script generator tool has been disabled. Please contact support if you believe this is an error.
              </p>
              {toolDetails?.source === 'custom' && toolDetails?.updatedBy && (
                <p className="text-xs text-red-500 mt-1">
                  Disabled by {toolDetails.updatedBy} on {new Date(toolDetails.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Credit Warning for logged in users */}
        {!canAfford && toolEnabled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Insufficient Credits</p>
              <p className="text-sm text-red-600">
                You need {toolCost} credits to generate a script. You have {balance} credits.
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

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full md:w-auto md:inline-flex mb-6 bg-white border border-gray-200">
            <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Wand2 className="h-4 w-4" />
              Generate Script
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Edit className="h-4 w-4" />
              Script Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Input Form */}
              <div className="lg:col-span-2 space-y-8">
                <Card className={`shadow-xl border-0 ${
                  isLoggedIn && !toolEnabled 
                    ? 'border-red-300 bg-red-50/30 opacity-75' 
                    : !canAfford && isLoggedIn && toolEnabled 
                      ? 'border-red-300 bg-red-50/30' 
                      : 'bg-gradient-to-br from-white to-gray-50'
                }`}>
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                      <Settings className="h-6 w-6 text-red-500" />
                      Script Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Configure your video script parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Topic Input */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <Video className="h-5 w-5 text-red-500" />
                        Video Topic
                        <Badge className="ml-2 bg-red-100 text-red-700">Required</Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="What's your video about? (e.g., Product Review, Tutorial, Vlog...)"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className={`h-14 text-lg border-2 pl-12 text-gray-900 ${
                            isLoggedIn && !toolEnabled 
                              ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                              : 'border-gray-300 focus:border-red-500'
                          }`}
                          disabled={isLoggedIn && !toolEnabled}
                        />
                        <Film className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                      </div>
                      
                      {showSuggestions && toolEnabled && (
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600 flex items-center gap-2">
                            <Lightbulb className="h-3 w-3" />
                            Popular Video Topics:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {topicSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => useSuggestion(suggestion.value)}
                                disabled={isLoggedIn && !toolEnabled}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-red-400 hover:shadow-md transition-all duration-200 ${
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

                    {/* Additional Notes */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-purple-500" />
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add specific details, key points, or style preferences..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className={`min-h-[100px] border-2 ${
                          isLoggedIn && !toolEnabled 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                            : 'border-gray-300 focus:border-purple-500'
                        } text-gray-900`}
                        disabled={isLoggedIn && !toolEnabled}
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Video Type */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-red-500" />
                          Video Platform
                        </Label>
                        <Select 
                          value={videoType} 
                          onValueChange={setVideoType}
                          disabled={isLoggedIn && !toolEnabled}
                        >
                          <SelectTrigger className={`border-2 h-12 text-gray-900 ${
                            isLoggedIn && !toolEnabled ? 'border-gray-300 bg-gray-100' : 'border-gray-300'
                          }`}>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {videoTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-md ${type.color}`}>
                                      <Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tone */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-purple-500" />
                          Tone of Voice
                        </Label>
                        <Select 
                          value={tone} 
                          onValueChange={setTone}
                          disabled={isLoggedIn && !toolEnabled}
                        >
                          <SelectTrigger className={`border-2 h-12 text-gray-900 ${
                            isLoggedIn && !toolEnabled ? 'border-gray-300 bg-gray-100' : 'border-gray-300'
                          }`}>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            {tones.map((toneOption) => (
                              <SelectItem key={toneOption.value} value={toneOption.value}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-md ${toneOption.bgColor}`}>
                                    <div className={toneOption.color}>
                                      {toneOption.icon}
                                    </div>
                                  </div>
                                  <span>{toneOption.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Video Duration
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {durations.map((dur) => (
                            <Button
                              key={dur.value}
                              type="button"
                              variant={duration === dur.value ? "default" : "outline"}
                              onClick={() => setDuration(dur.value)}
                              disabled={isLoggedIn && !toolEnabled}
                              className={`h-10 ${
                                duration === dur.value 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : isLoggedIn && !toolEnabled 
                                    ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                                    : 'border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {dur.label}
                            </Button>
                          ))}
                          <div className="col-span-3">
                            <Slider
                              value={[duration]}
                              onValueChange={(value) => setDuration(value[0])}
                              max={30}
                              min={1}
                              step={1}
                              className="mt-4"
                              disabled={isLoggedIn && !toolEnabled}
                            />
                            <div className="text-sm text-gray-600 text-center mt-2">
                              Custom: {duration} minutes
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Creativity Level */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2 justify-between">
                          <span className="flex items-center gap-2">
                            <Sparkle className="h-4 w-4 text-yellow-500" />
                            Creativity Level
                          </span>
                          <span className="text-sm font-medium text-yellow-600">
                            {creativityLevel[0]}/10
                          </span>
                        </Label>
                        <Slider
                          value={creativityLevel}
                          onValueChange={setCreativityLevel}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-4"
                          disabled={isLoggedIn && !toolEnabled}
                        />
                      </div>
                    </div>

                    {/* Feature Switches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                        <Label className="text-gray-700 flex items-center gap-2 cursor-pointer">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Include Strong Hook
                        </Label>
                        <Switch 
                          checked={includeHook} 
                          onCheckedChange={setIncludeHook}
                          className="data-[state=checked]:bg-red-500"
                          disabled={isLoggedIn && !toolEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <Label className="text-gray-700 flex items-center gap-2 cursor-pointer">
                          <Bell className="h-4 w-4 text-green-500" />
                          Include Call-to-Action
                        </Label>
                        <Switch 
                          checked={includeCTA} 
                          onCheckedChange={setIncludeCTA}
                          className="data-[state=checked]:bg-green-500"
                          disabled={isLoggedIn && !toolEnabled}
                        />
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateScript}
                      disabled={
                        loading || 
                        !topic.trim() || 
                        !canAfford || 
                        (isLoggedIn && !toolEnabled)
                      }
                      className={`w-full h-14 text-lg ${
                        isLoggedIn && !toolEnabled
                          ? 'bg-gray-400 cursor-not-allowed'
                          : !canAfford
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 via-orange-500 to-purple-500 hover:from-red-600 hover:via-orange-600 hover:to-purple-600'
                      } shadow-lg hover:shadow-xl transition-all duration-300 text-white`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Script...
                        </>
                      ) : isLoggedIn && !toolEnabled ? (
                        <>
                          <PowerOff className="h-5 w-5 mr-2" />
                          Tool Disabled by Admin
                        </>
                      ) : !canAfford ? (
                        <>
                          <Coins className="h-5 w-5 mr-2" />
                          Need {toolCost} Credits (You have {balance})
                        </>
                      ) : (
                        <>
                          <Film className="h-5 w-5 mr-2" />
                          Generate Complete Video Script ({toolCost} Credits)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Preview & Tools */}
              <div className="space-y-8">
                {/* Script Preview */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Script Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <VideoIcon className="h-4 w-4 text-red-500" />
                          <div className="text-xs text-blue-600">VIDEO TYPE</div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {topic 
                            ? `${videoTypes.find(v => v.value === videoType)?.label || 'Video'} Script`
                            : 'Script Preview'
                          }
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-900 font-medium">{duration} minutes</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Sections:</span>
                            <span className="text-gray-900 font-medium">3-5 planned</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tone:</span>
                            <span className="text-gray-900 font-medium">{tones.find(t => t.value === tone)?.label}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">Estimated Structure:</div>
                        <div className="space-y-2">
                          {['Hook (0:30)', 'Section 1 (1:00)', 'Section 2 (1:30)', 'Section 3 (1:00)', 'CTA (0:30)']
                            .map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                <span className="text-sm text-gray-700">{item}</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Production Tools */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Scissors className="h-5 w-5 text-purple-500" />
                      Production Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-100 rounded-md">
                          <Camera className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">Visual Planning</div>
                          <div className="text-xs text-gray-600">Includes shot suggestions</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <Music className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">Audio Notes</div>
                          <div className="text-xs text-gray-600">Music & SFX suggestions</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-green-100 rounded-md">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">Timing Guide</div>
                          <div className="text-xs text-gray-600">Section durations included</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const examples = ['Product Review', 'Tutorial', 'Vlog', 'Educational'];
                          setTopic(examples[Math.floor(Math.random() * examples.length)]);
                        }}
                        disabled={isLoggedIn && !toolEnabled}
                        className={`h-10 border-2 border-yellow-300 hover:border-yellow-500 ${
                          isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
                        Example
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
                        disabled={isLoggedIn && !toolEnabled}
                        className={`h-10 border-2 border-blue-300 hover:border-blue-500 ${
                          isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {viewMode === 'editor' ? (
                          <>
                            <Eye className="h-3 w-3 mr-1 text-blue-500" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Edit className="h-3 w-3 mr-1 text-blue-500" />
                            Editor
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyFullScript}
                        disabled={!script || (isLoggedIn && !toolEnabled)}
                        className={`h-10 border-2 border-purple-300 hover:border-purple-500 ${
                          !script || (isLoggedIn && !toolEnabled) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Copy className="h-3 w-3 mr-1 text-purple-500" />
                        Copy Script
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadScript}
                        disabled={!script || (isLoggedIn && !toolEnabled)}
                        className={`h-10 border-2 border-green-300 hover:border-green-500 ${
                          !script || (isLoggedIn && !toolEnabled) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Download className="h-3 w-3 mr-1 text-green-500" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor">
            {script ? (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                    <Edit className="h-6 w-6 text-blue-500" />
                    Script Editor
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Edit and customize your generated script
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Video Title</Label>
                    <Input
                      value={script.title}
                      onChange={(e) => setScript({...script, title: e.target.value})}
                      className="border-2 border-gray-300 focus:border-blue-500 text-gray-900 text-lg"
                      disabled={isLoggedIn && !toolEnabled}
                    />
                  </div>

                  {/* Hook */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Hook / Introduction
                    </Label>
                    <Textarea
                      value={script.hook}
                      onChange={(e) => setScript({...script, hook: e.target.value})}
                      className="min-h-[120px] border-2 border-gray-300 focus:border-red-500 text-gray-900"
                      disabled={isLoggedIn && !toolEnabled}
                    />
                    <p className="text-sm text-gray-500">Grab attention in the first 15-30 seconds</p>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <Label className="text-gray-700 font-medium text-lg">Script Sections</Label>
                    {script.sections.map((section, index) => (
                      <Card key={index} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleSection(index)}
                                className="h-8 w-8 border-2 border-blue-300 hover:border-blue-500"
                                disabled={isLoggedIn && !toolEnabled}
                              >
                                {expandedSections.includes(index) ? (
                                  <ChevronDown className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-blue-500" />
                                )}
                              </Button>
                              <CardTitle className="text-lg text-gray-900">
                                Section {index + 1}: {section.title}
                              </CardTitle>
                            </div>
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              {section.duration}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedSections.includes(index) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="space-y-4 pt-4">
                                <div className="space-y-3">
                                  <Label className="text-gray-700 font-medium">Content</Label>
                                  <Textarea
                                    value={section.content}
                                    onChange={(e) => {
                                      const newSections = [...script.sections];
                                      newSections[index].content = e.target.value;
                                      setScript({...script, sections: newSections});
                                    }}
                                    className="min-h-[150px] border-2 border-gray-300 focus:border-blue-500 text-gray-900"
                                    disabled={isLoggedIn && !toolEnabled}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                      <Camera className="h-4 w-4 text-purple-500" />
                                      Visual Cues
                                    </Label>
                                    <Textarea
                                      value={section.visualCues.join('\n')}
                                      onChange={(e) => {
                                        const newSections = [...script.sections];
                                        newSections[index].visualCues = e.target.value.split('\n').filter(line => line.trim());
                                        setScript({...script, sections: newSections});
                                      }}
                                      className="min-h-[120px] border-2 border-gray-300 focus:border-purple-500 text-gray-900"
                                      placeholder="One visual cue per line"
                                      disabled={isLoggedIn && !toolEnabled}
                                    />
                                    <p className="text-sm text-gray-500">What to show on screen</p>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                      <Headphones className="h-4 w-4 text-green-500" />
                                      Audio Notes
                                    </Label>
                                    <Textarea
                                      value={section.audioNotes}
                                      onChange={(e) => {
                                        const newSections = [...script.sections];
                                        newSections[index].audioNotes = e.target.value;
                                        setScript({...script, sections: newSections});
                                      }}
                                      className="min-h-[120px] border-2 border-gray-300 focus:border-green-500 text-gray-900"
                                      disabled={isLoggedIn && !toolEnabled}
                                    />
                                    <p className="text-sm text-gray-500">Music & sound suggestions</p>
                                  </div>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ))}
                  </div>

                  {/* Conclusion & CTA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">Conclusion</Label>
                      <Textarea
                        value={script.conclusion}
                        onChange={(e) => setScript({...script, conclusion: e.target.value})}
                        className="min-h-[100px] border-2 border-gray-300 focus:border-gray-500 text-gray-900"
                        disabled={isLoggedIn && !toolEnabled}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">Call-to-Action</Label>
                      <Textarea
                        value={script.cta}
                        onChange={(e) => setScript({...script, cta: e.target.value})}
                        className="min-h-[100px] border-2 border-gray-300 focus:border-green-500 text-gray-900"
                        disabled={isLoggedIn && !toolEnabled}
                      />
                      <p className="text-sm text-gray-500">Tell viewers what to do next</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button 
                      onClick={copyFullScript}
                      variant="outline"
                      className="border-2 border-purple-300 hover:border-purple-500"
                      disabled={isLoggedIn && !toolEnabled}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </Button>
                    <Button 
                      onClick={downloadScript}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      disabled={isLoggedIn && !toolEnabled}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-8">
                    <Edit className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No Script Generated Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Generate a script first to use the editor
                  </p>
                  <Button 
                    onClick={() => setSelectedTab('generate')}
                    className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600"
                  >
                    Go to Generator
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            {script ? (
              <div className="space-y-8">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50">
                  <CardHeader className="border-b border-red-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl text-gray-900">{script.title}</CardTitle>
                        <CardDescription className="text-gray-600">
                          {script.totalDuration} • {script.targetAudience}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={playScript}
                          disabled={isPlaying || (isLoggedIn && !toolEnabled)}
                          className={`border-2 border-red-300 hover:border-red-500 ${
                            isLoggedIn && !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-2 text-red-500" />
                              <span className="text-red-500">Playing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2 text-red-500" />
                              <span className="text-red-500">Play Preview</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={copyFullScript}
                          className="border-2 border-purple-300 hover:border-purple-500"
                          disabled={isLoggedIn && !toolEnabled}
                        >
                          <Copy className="h-4 w-4 mr-2 text-purple-500" />
                          Copy Script
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Hook Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Hook / Introduction</h3>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <p className="text-gray-700">{script.hook}</p>
                        </div>
                      </div>

                      {/* Timeline Preview */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-500" />
                          Video Timeline
                        </h3>
                        <div className="space-y-2">
                          {script.sections.map((section, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 hover:border-blue-300 transition-all cursor-pointer"
                              onClick={() => toggleSection(index)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <div className="text-sm font-bold text-blue-700">{index + 1}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{section.title}</div>
                                  <div className="text-sm text-gray-600">{section.duration}</div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-700"
                                disabled={isLoggedIn && !toolEnabled}
                              >
                                {expandedSections.includes(index) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Conclusion & CTA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900">Conclusion</h3>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-700">{script.conclusion}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900">Call-to-Action</h3>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-gray-700">{script.cta}</p>
                          </div>
                        </div>
                      </div>

                      {/* Hashtags & Thumbnails */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900">Recommended Hashtags</h3>
                          <div className="flex flex-wrap gap-2">
                            {script.hashtags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900">Thumbnail Ideas</h3>
                          <div className="space-y-2">
                            {script.thumbnailIdeas.map((idea, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <div className="p-1 bg-purple-100 rounded">
                                  <Camera className="h-3 w-3 text-purple-600" />
                                </div>
                                <span className="text-sm text-gray-700">{idea}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Sections */}
                {script.sections.map((section, index) => (
                  <Card key={index} className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <div className="text-lg font-bold text-blue-700">{index + 1}</div>
                          </div>
                          <div>
                            <CardTitle className="text-xl text-gray-900">{section.title}</CardTitle>
                            <CardDescription className="text-gray-600">
                              Duration: {section.duration}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          Section {index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-gray-700">Script Content</h4>
                        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                          <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Camera className="h-4 w-4 text-purple-600" />
                            Visual Cues
                          </h4>
                          <div className="space-y-2">
                            {section.visualCues.map((cue, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <div className="p-1 bg-purple-100 rounded mt-0.5">
                                  <Eye className="h-3 w-3 text-purple-600" />
                                </div>
                                <span className="text-sm text-gray-700">{cue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Music className="h-4 w-4 text-green-600" />
                            Audio Notes
                          </h4>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-gray-700">{section.audioNotes}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-100 to-blue-100 flex items-center justify-center mx-auto mb-8">
                    <Eye className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Generate a Script First
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Preview will appear here after generating a script
                  </p>
                  <Button 
                    onClick={() => setSelectedTab('generate')}
                    className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600"
                  >
                    Generate Script
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-red-500 to-purple-500 rounded-lg">
                  <Film className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">AI Video Script Generator</div>
                  <div className="text-sm text-gray-600">Production-ready scripts in seconds</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Create complete video scripts with visuals, audio, and timing.
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{script?.sections?.length || 0}</div>
                <div className="text-xs text-gray-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{duration}</div>
                <div className="text-xs text-gray-600">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(generationTime/1000).toFixed(1)}s</div>
                <div className="text-xs text-gray-600">Generation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{balance}</div>
                <div className="text-xs text-gray-600">Credits</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="hover:text-red-500 transition-colors">
                <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-red-500">
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
              <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-blue-500">
                Help Center
              </Button>
            </div>
            <div className="mt-4">
              © {new Date().getFullYear()} AI Video Script Generator. All rights reserved.
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
              <div className="w-32 h-32 border-4 border-transparent rounded-full animate-spin border-t-red-500 border-r-orange-500 border-b-purple-500 border-l-blue-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="h-12 w-12 text-red-500 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">
              Crafting Your Video Script...
            </p>
            <p className="mt-2 text-gray-600">
              Generating {duration}-minute script for "{topic}"
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}