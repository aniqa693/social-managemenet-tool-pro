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
  Wand2, Coins, CreditCard, PowerOff, Power,
  Calendar, Users, Hash, Image
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

interface ContentCalendar {
  day: string;
  platform: string;
  postType: string;
  idea: string;
  bestTime: string;
}

interface CombinedOutput {
  script: ScriptType;
  postIdeas: PostIdea[];
  contentCalendar: ContentCalendar[];
  engagementTips: string[];
}

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
  const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
  const [contentCalendar, setContentCalendar] = useState<ContentCalendar[]>([]);
  const [engagementTips, setEngagementTips] = useState<string[]>([]);
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
  const [activeContentTab, setActiveContentTab] = useState<'script' | 'postIdeas' | 'calendar'>('script');
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [expandedPostIdeas, setExpandedPostIdeas] = useState<number[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  // Tool enabled/disabled state
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

  // Topic suggestions
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
    // { value: 'tiktok', label: 'TikTok', icon: Film, color: 'bg-gradient-to-r from-black to-gray-800' },
    { value: 'facebook', label: 'Facebook Video', icon: Facebook, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
    // { value: 'twitter', label: 'Twitter Video', icon: Twitter, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    // { value: 'linkedin', label: 'LinkedIn Video', icon: Linkedin, color: 'bg-gradient-to-r from-blue-700 to-blue-900' },
    // { value: 'tutorial', label: 'Tutorial', icon: PlayCircle, color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    // { value: 'vlog', label: 'Vlog', icon: Film, color: 'bg-gradient-to-r from-orange-500 to-yellow-500' },
  ];

  const durations = [
    { value: 1, label: '1 min' },
    { value: 3, label: '3 min' },
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
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
        console.log('🔍 Checking tool status for user:', userId, 'tool: script_generator');
        
        const response = await fetch(`/api/tools/status?userId=${userId}&toolName=script_generator`);
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

  // Effects
  useEffect(() => {
    setShowSuggestions(topic.length > 0);
    
    if (user) {
      console.log('✅ User authenticated:', { 
        email: user.email, 
        name: user.name,
        id: user.id
      });
    }
  }, [topic, user]);

  useEffect(() => {
    fetchToolCost('script_generator');
  }, [fetchToolCost]);

  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  // Copy function
  const copyToClipboard = async (text: string, id: string) => {
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [id]: true });
      toast.success('Copied to clipboard! 📋');
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [id]: false });
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy 😢');
    }
  };

  // Copy full script
  const copyFullScript = () => {
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
    
    copyToClipboard(fullScript, 'full-script');
  };

  // Copy all post ideas
  const copyAllPostIdeas = () => {
    if (!postIdeas.length) return;
    
    const content = postIdeas.map((idea, idx) => `
📱 POST IDEA ${idx + 1} [${idea.platform.toUpperCase()}]
📌 Title: ${idea.title}
📝 Description: ${idea.description}
🎣 Hook: ${idea.hook}

🔑 Key Points:
${idea.keyPoints.map(p => `• ${p}`).join('\n')}

🏷️ Hashtags:
${idea.hashtags.join(' ')}

⏰ Best Time: ${idea.bestTimeToPost}
🎯 Target: ${idea.targetAudience}
📊 Engagement: ${idea.estimatedEngagement}
    `).join('\n' + '─'.repeat(40) + '\n');
    
    copyToClipboard(content, 'all-post-ideas');
  };

  // Copy individual post idea
  const copyPostIdea = (idea: PostIdea, index: number) => {
    const content = `
📱 PLATFORM: ${idea.platform.toUpperCase()}
📌 TITLE: ${idea.title}
📝 DESCRIPTION: ${idea.description}
🎣 HOOK: ${idea.hook}

🔑 KEY POINTS:
${idea.keyPoints.map(p => `• ${p}`).join('\n')}

🏷️ HASHTAGS:
${idea.hashtags.join(' ')}

⏰ BEST TIME: ${idea.bestTimeToPost}
🎯 TARGET: ${idea.targetAudience}
📊 ENGAGEMENT: ${idea.estimatedEngagement}
    `;
    
    copyToClipboard(content, `post-idea-${index}`);
  };

  // Copy content calendar
  const copyCalendar = () => {
    if (!contentCalendar.length) return;
    
    const content = contentCalendar.map(day => `
📅 ${day.day}
📱 Platform: ${day.platform}
📌 Type: ${day.postType}
💡 Idea: ${day.idea}
⏰ Best Time: ${day.bestTime}
    `).join('\n');
    
    copyToClipboard(content, 'calendar');
  };

  // Download all content
  const downloadAll = () => {
    if (!script) return;
    
    const content = `
╔══════════════════════════════════════════════════════════════╗
║              COMPLETE CONTENT PACKAGE                        ║
╚══════════════════════════════════════════════════════════════╝

📌 TOPIC: ${topic}
🎬 VIDEO TYPE: ${videoTypes.find(v => v.value === videoType)?.label}
🎯 TONE: ${tones.find(t => t.value === tone)?.label}
⏱️ DURATION: ${duration} minutes
📅 GENERATED: ${new Date().toLocaleString()}

${'═'.repeat(60)}

🎥 VIDEO SCRIPT
${'═'.repeat(60)}

TITLE: ${script.title}
TARGET AUDIENCE: ${script.targetAudience}
TOTAL DURATION: ${script.totalDuration}

🎣 HOOK/INTRO
${'─'.repeat(40)}
${script.hook}

${script.sections.map((section, idx) => `

📝 SECTION ${idx + 1}: ${section.title}
⏱️ Duration: ${section.duration}

SCRIPT:
${section.content}

VISUAL CUES:
${section.visualCues.map(cue => `• ${cue}`).join('\n')}

AUDIO NOTES:
${section.audioNotes}
`).join('\n' + '─'.repeat(40) + '\n')}

🏁 CONCLUSION
${'─'.repeat(40)}
${script.conclusion}

📢 CALL-TO-ACTION
${'─'.repeat(40)}
${script.cta}

🏷️ RECOMMENDED HASHTAGS
${'─'.repeat(40)}
${script.hashtags.join(' ')}

🖼️ THUMBNAIL IDEAS
${'─'.repeat(40)}
${script.thumbnailIdeas.map(idea => `• ${idea}`).join('\n')}

${'═'.repeat(60)}

📱 SOCIAL MEDIA POST IDEAS
${'═'.repeat(60)}

${postIdeas.map((idea, idx) => `
POST IDEA ${idx + 1} [${idea.platform.toUpperCase()}]
${'─'.repeat(40)}
Title: ${idea.title}
Description: ${idea.description}
Hook: ${idea.hook}

Key Points:
${idea.keyPoints.map(p => `  • ${p}`).join('\n')}

Hashtags:
${idea.hashtags.map(t => `  ${t}`).join(' ')}

Best Time: ${idea.bestTimeToPost}
Target: ${idea.targetAudience}
Engagement: ${idea.estimatedEngagement}
Format: ${idea.format}
`).join('\n')}

${'═'.repeat(60)}

📅 7-DAY CONTENT CALENDAR
${'═'.repeat(60)}

${contentCalendar.map(day => `
${day.day}:
  Platform: ${day.platform}
  Type: ${day.postType}
  Idea: ${day.idea}
  Best Time: ${day.bestTime}
`).join('\n')}

${'═'.repeat(60)}

💡 ENGAGEMENT TIPS
${'═'.repeat(60)}

${engagementTips.map((tip, idx) => `${idx + 1}. ${tip}`).join('\n')}

${'═'.repeat(60)}
Generated by AI Video Script Generator
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content_package_${topic.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Complete content package downloaded! 💾');
  };

  // Generate content
  const generateContent = async () => {
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
    setScript(null);
    setPostIdeas([]);
    setContentCalendar([]);
    setEngagementTips([]);
    setSaveStatus({saved: false});

    const loadingToast = toast.loading('🎬 Generating complete content package...');

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
        if (response.status === 403) {
          if (data.error?.includes('disabled')) {
            setToolEnabled(false);
            throw new Error('This tool has been disabled by the administrator');
          }
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate content');
      }

      setScript(data.script);
      setPostIdeas(data.postIdeas || []);
      setContentCalendar(data.contentCalendar || []);
      setEngagementTips(data.engagementTips || []);
      setExpandedSections([0]);
      setCurrentSection(0);
      setActiveContentTab('script');
      
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }
      
      toast.dismiss(loadingToast);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          <span>
            Generated complete package! Script + {data.postIdeas?.length || 0} post ideas in {(endTime - startTime)/1000}s
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

  const useSuggestion = (suggestion: string) => {
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

  const togglePostIdea = (index: number) => {
    if (expandedPostIdeas.includes(index)) {
      setExpandedPostIdeas(expandedPostIdeas.filter(i => i !== index));
    } else {
      setExpandedPostIdeas([...expandedPostIdeas, index]);
    }
  };

  const playScript = () => {
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool is disabled by administrator');
      return;
    }
    
    setIsPlaying(true);
    toast.success('Playing script preview...');
    
    setTimeout(() => {
      setIsPlaying(false);
    }, 5000);
  };

  const VideoIcon = videoTypes.find(v => v.value === videoType)?.icon || Film;

  // Get platform color
  const getPlatformColor = (platform: string) => {
    const colors: {[key: string]: string} = {
      instagram: 'from-purple-500 to-pink-500',
      facebook: 'from-blue-500 to-indigo-500',
      youtube: 'from-red-500 to-rose-500',
      tiktok: 'from-teal-500 to-cyan-500',
      linkedin: 'from-blue-600 to-blue-800',
      twitter: 'from-slate-600 to-gray-600',
      pinterest: 'from-red-600 to-red-700'
    };
    return colors[platform] || 'from-gray-500 to-gray-600';
  };

  // Get engagement color
  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-purple-500 text-white px-6 py-3 rounded-full mb-4">
              <Film className="h-6 w-6" />
              <span className="font-semibold">AI Video Script + Post Ideas Generator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-purple-500">
                Complete Content Creation Suite
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Generate professional video scripts PLUS social media post ideas, content calendar, and engagement tips in one go!
            </p>
          </div>
          
          {/* Credit Display */}
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
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Balance: {balance} credits
            </Badge>

            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-1 inline" />
              Script + Post Ideas + Calendar
            </Badge>
          </div>

          {/* Stats */}
          {script && (
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
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">{postIdeas.length} ideas</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{contentCalendar.length} days</span>
              </div>
            </div>
          )}
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
                The content generator tool has been disabled. Please contact support if you believe this is an error.
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
                You need {toolCost} credits to generate content. You have {balance} credits.
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
              Generate
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <FileText className="h-4 w-4" />
              Your Content
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate">
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
                      <Settings className="h-6 w-6 text-red-500" />
                      Content Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Configure your complete content package
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Topic Input */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <Video className="h-5 w-5 text-red-500" />
                        Main Topic
                        <Badge className="ml-2 bg-red-100 text-red-700">Required</Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="e.g., Digital Marketing, Healthy Recipes, Travel Tips..."
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
                            Popular Topics:
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

                    {/* What You'll Get */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        You'll receive:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Complete video script with visuals & audio
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          5+ social media post ideas for different platforms
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          7-day content calendar for consistent posting
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Engagement tips for maximum reach
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Hashtags and thumbnail ideas
                        </li>
                      </ul>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateContent}
                      disabled={
                        loading || 
                        !topic.trim() || 
                        (isLoggedIn && !canAfford) ||
                        (isLoggedIn && !toolEnabled)
                      }
                      className={`w-full h-14 text-lg ${
                        isLoggedIn && !toolEnabled
                          ? 'bg-gray-400 cursor-not-allowed'
                          : !canAfford && isLoggedIn
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 via-orange-500 to-purple-500 hover:from-red-600 hover:via-orange-600 hover:to-purple-600'
                      } shadow-lg hover:shadow-xl transition-all duration-300 text-white`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Complete Package...
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
                          <Wand2 className="h-5 w-5 mr-2" />
                          Generate Complete Content Package ({toolCost} Credits)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Preview */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Eye className="h-5 w-5 text-blue-500" />
                      What You'll Get
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Script Preview */}
                      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                          <VideoIcon className="h-5 w-5 text-red-500" />
                          <h3 className="font-semibold text-gray-900">Video Script</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Title:</span>
                            <span className="text-gray-900 font-medium">
                              {topic ? `Ultimate Guide to ${topic}` : 'Your Video Title'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-900 font-medium">{duration} minutes</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sections:</span>
                            <span className="text-gray-900 font-medium">3-5 sections</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Ideas Preview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900">Post Ideas</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Instagram className="h-4 w-4 text-purple-500" />
                              <span>Instagram carousel post</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {/* <TikTok className="h-4 w-4 text-teal-500" /> */}
                              <span>TikTok behind-the-scenes</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Twitter className="h-4 w-4 text-blue-500" />
                              <span>Twitter discussion thread</span>
                            </div>
                          </div>
                        </div>

                        {/* Calendar Preview */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-5 w-5 text-green-500" />
                            <h3 className="font-semibold text-gray-900">Content Calendar</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Monday:</span>
                              <span className="text-gray-900">Teaser post</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Wednesday:</span>
                              <span className="text-gray-900">Main video</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Friday:</span>
                              <span className="text-gray-900">Behind scenes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            {script ? (
              <div className="space-y-6">
                {/* Content Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                  <Button
                    variant={activeContentTab === 'script' ? 'default' : 'outline'}
                    onClick={() => setActiveContentTab('script')}
                    className={activeContentTab === 'script' ? 'bg-red-500 text-white' : 'border-red-200 text-gray-700'}
                  >
                    <Film className="h-4 w-4 mr-2" />
                    Video Script
                  </Button>
                  <Button
                    variant={activeContentTab === 'postIdeas' ? 'default' : 'outline'}
                    onClick={() => setActiveContentTab('postIdeas')}
                    className={activeContentTab === 'postIdeas' ? 'bg-purple-500 text-white' : 'border-purple-200 text-gray-700'}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post Ideas ({postIdeas.length})
                  </Button>
                  <Button
                    variant={activeContentTab === 'calendar' ? 'default' : 'outline'}
                    onClick={() => setActiveContentTab('calendar')}
                    className={activeContentTab === 'calendar' ? 'bg-green-500 text-white' : 'border-green-200 text-gray-700'}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Content Calendar
                  </Button>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyFullScript}
                    className="border-purple-300 hover:border-purple-500"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Script
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllPostIdeas}
                    className="border-blue-300 hover:border-blue-500"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Ideas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCalendar}
                    className="border-green-300 hover:border-green-500"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAll}
                    className="border-red-300 hover:border-red-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>

                {/* Script Tab Content */}
                {activeContentTab === 'script' && (
                  <div className="space-y-6">
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
                              className="border-red-300 hover:border-red-500"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2 text-red-500" />
                                  <span className="text-red-500">Playing...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2 text-red-500" />
                                  <span className="text-red-500">Preview</span>
                                </>
                              )}
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

                          {/* Sections */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Main Sections</h3>
                            {script.sections.map((section, index) => (
                              <Card key={index} className="border-2 border-gray-200 hover:border-blue-300">
                                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => toggleSection(index)}
                                        className="h-8 w-8 border-2 border-blue-300"
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
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                              <Camera className="h-4 w-4 text-purple-500" />
                                              Visual Cues
                                            </h4>
                                            <ul className="space-y-1">
                                              {section.visualCues.map((cue, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></span>
                                                  {cue}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                              <Music className="h-4 w-4 text-green-500" />
                                              Audio Notes
                                            </h4>
                                            <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                                              {section.audioNotes}
                                            </p>
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
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900">Conclusion</h3>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-700">{script.conclusion}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900">Call-to-Action</h3>
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-gray-700">{script.cta}</p>
                              </div>
                            </div>
                          </div>

                          {/* Hashtags & Thumbnails */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900">Hashtags</h3>
                              <div className="flex flex-wrap gap-2">
                                {script.hashtags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900">Thumbnail Ideas</h3>
                              <div className="space-y-2">
                                {script.thumbnailIdeas.map((idea, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                    <Camera className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm text-gray-700">{idea}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Post Ideas Tab Content */}
                {activeContentTab === 'postIdeas' && postIdeas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {postIdeas.map((idea, index) => {
                      const platformColor = getPlatformColor(idea.platform);
                      const engagementColor = getEngagementColor(idea.estimatedEngagement);
                      
                      return (
                        <Card key={index} className="border-2 hover:border-purple-300 hover:shadow-xl transition-all">
                          <CardHeader className={`bg-gradient-to-r ${platformColor} text-white rounded-t-lg`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge className="bg-white/20 text-white border-0 mb-2">
                                  {idea.platform.toUpperCase()}
                                </Badge>
                                <CardTitle className="text-lg">{idea.title}</CardTitle>
                              </div>
                              <Badge className={`${engagementColor} text-white`}>
                                {idea.estimatedEngagement} engagement
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            <p className="text-gray-600 text-sm">{idea.description}</p>
                            
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-1">
                                <Zap className="h-4 w-4" />
                                Hook
                              </div>
                              <p className="text-sm">"{idea.hook}"</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-2">
                                <BookOpen className="h-4 w-4" />
                                Key Points
                              </div>
                              <ul className="space-y-1">
                                {idea.keyPoints.map((point, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                                      {i + 1}
                                    </span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-2">
                                <Hash className="h-4 w-4" />
                                Hashtags
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {idea.hashtags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-2 border-t">
                              {idea.bestTimeToPost && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Best: {idea.bestTimeToPost}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {idea.targetAudience}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {idea.contentType}
                              </div>
                              <div className="flex items-center gap-1">
                                <Film className="h-3 w-3" />
                                {idea.format}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPostIdea(idea, index)}
                              className="w-full"
                            >
                              {copiedStates[`post-idea-${index}`] ? (
                                <>
                                  <Check className="h-3 w-3 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copy Post Idea
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Calendar Tab Content */}
                {activeContentTab === 'calendar' && contentCalendar.length > 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentCalendar.map((day, index) => {
                        const platformColor = getPlatformColor(day.platform);
                        
                        return (
                          <Card key={index} className={`border-2 border-l-4 hover:shadow-lg transition-all`}
                            style={{ borderLeftColor: `var(--${day.platform}-color)` }}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <Badge className="bg-gray-100 text-gray-800 border-0">
                                  {day.day}
                                </Badge>
                                <Badge variant="outline" className={`bg-gradient-to-r ${platformColor} text-white border-0`}>
                                  {day.platform}
                                </Badge>
                              </div>
                              <CardTitle className="text-base mt-2">{day.idea}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Tag className="h-3 w-3" />
                                  {day.postType}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  Best time: {day.bestTime}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Engagement Tips */}
                    {engagementTips.length > 0 && (
                      <Card className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <Lightbulb className="h-5 w-5" />
                            Engagement Tips for Maximum Reach
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {engagementTips.map((tip, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                  <Sparkles className="h-4 w-4 text-yellow-600" />
                                </div>
                                <p className="text-sm text-gray-700">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-8">
                    <Film className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No Content Generated Yet
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Generate your first complete content package to see your video script, post ideas, and content calendar here.
                  </p>
                  <Button 
                    onClick={() => setSelectedTab('generate')}
                    className="bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Content Package
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
                  <div className="font-bold text-gray-900">AI Content Creation Suite</div>
                  <div className="text-sm text-gray-600">Scripts + Post Ideas + Calendar</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Complete content packages for creators and marketers.
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{script?.sections?.length || 0}</div>
                <div className="text-xs text-gray-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{postIdeas.length}</div>
                <div className="text-xs text-gray-600">Post Ideas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{contentCalendar.length}</div>
                <div className="text-xs text-gray-600">Calendar Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(generationTime/1000).toFixed(1)}s</div>
                <div className="text-xs text-gray-600">Generation</div>
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
              <Link href="/post-ideas" className="hover:text-green-500 transition-colors">
                <Button variant="link" className="h-auto p-0 text-gray-600 hover:text-green-500">
                  Post Ideas
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              © {new Date().getFullYear()} AI Content Creation Suite. All rights reserved.
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
              Creating Your Complete Content Package...
            </p>
            <p className="mt-2 text-gray-600 max-w-md">
              Generating video script, post ideas, and content calendar for "{topic}"
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Script</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <span>Post Ideas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span>Calendar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}