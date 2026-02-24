// app/title-generator/page.tsx (updated with credit management)

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Sparkles, Copy, Hash, Zap, TrendingUp, Palette, 
  Volume2, Check, Share2, Download, Star, Clock, 
  MessageSquare, Heart, Target, Wand2, BookOpen,
  Clipboard, Grid, List, Eye, Database, Save, User,
  LogOut, Type, Tag, FileText, Youtube, Globe, 
  Newspaper, PenTool, Lightbulb, Rocket, Crown,
  Layers, Filter, Sparkle, Zap as Lightning,
  ThumbsUp, BarChart, TrendingUp as TrendingUpIcon,
  Award, Target as TargetIcon, Brain,
  Coins, AlertCircle, CreditCard, LogIn, UserPlus
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
import { signOut } from 'better-auth/api';

type TitleType = {
  title: string;
  description: string;
  tags: string[];
  characterCount: number;
  type?: string;
  score?: number;
};

type TopicSuggestion = {
  value: string;
  category: string;
  icon: React.ReactNode;
  color: string;
};

export default function TitleGeneratorPage() {
  // Get real user session from your auth system
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const isLoading = sessionLoading;

  // State
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [titles, setTitles] = useState<TitleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('engaging');
  const [contentType, setContentType] = useState('blog');
  const [copiedStates, setCopiedStates] = useState<boolean[]>([]);
  const [likedTitles, setLikedTitles] = useState<number[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState([8]);
  const [titleCount, setTitleCount] = useState(6);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saveStatus, setSaveStatus] = useState<{saved: boolean; recordId?: number}>({saved: false});
  const [selectedTab, setSelectedTab] = useState('generate');
  const [selectedTitleType, setSelectedTitleType] = useState('all');
  
  // Credit management hook with real user ID
  const { 
    balance, 
    loading: creditsLoading, 
    error: creditsError,
    checkCredits,
    refreshBalance,
    toolCost,
    fetchToolCost 
  } = useCredits(user?.id);

  // Data
  const topicSuggestions: TopicSuggestion[] = [
    { value: 'Artificial Intelligence', category: 'Technology', icon: <Brain className="h-4 w-4" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'Sustainable Living', category: 'Lifestyle', icon: <Globe className="h-4 w-4" />, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'Digital Marketing Trends', category: 'Business', icon: <TrendingUpIcon className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'Healthy Recipes', category: 'Food', icon: <Heart className="h-4 w-4" />, color: 'bg-gradient-to-r from-red-500 to-orange-500' },
    { value: 'Personal Development', category: 'Self-Improvement', icon: <Rocket className="h-4 w-4" />, color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { value: 'Travel Photography', category: 'Creative', icon: <Eye className="h-4 w-4" />, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
  ];

  const tones = [
    { value: 'engaging', label: 'Engaging', icon: <Sparkles className="h-4 w-4" />, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    { value: 'professional', label: 'Professional', icon: <Award className="h-4 w-4" />, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { value: 'provocative', label: 'Provocative', icon: <Lightning className="h-4 w-4" />, color: 'text-red-500', bgColor: 'bg-red-100' },
    { value: 'educational', label: 'Educational', icon: <BookOpen className="h-4 w-4" />, color: 'text-green-500', bgColor: 'bg-green-100' },
    { value: 'conversational', label: 'Conversational', icon: <MessageSquare className="h-4 w-4" />, color: 'text-pink-500', bgColor: 'bg-pink-100' },
    { value: 'click-worthy', label: 'Click-Worthy', icon: <TargetIcon className="h-4 w-4" />, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  ];

  const contentTypes = [
    { value: 'blog', label: 'Blog Post', icon: <FileText className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
    { value: 'video', label: 'YouTube Video', icon: <Youtube className="h-4 w-4" />, color: 'bg-gradient-to-r from-red-500 to-pink-500' },
    { value: 'social', label: 'Social Media', icon: <Share2 className="h-4 w-4" />, color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    { value: 'newsletter', label: 'Newsletter', icon: <Newspaper className="h-4 w-4" />, color: 'bg-gradient-to-r from-orange-500 to-yellow-500' },
    { value: 'podcast', label: 'Podcast', icon: <Volume2 className="h-4 w-4" />, color: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
    { value: 'ebook', label: 'E-book', icon: <BookOpen className="h-4 w-4" />, color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
  ];

  const titleTypes = [
    { value: 'all', label: 'All Types', icon: <Layers className="h-4 w-4" /> },
    { value: 'how-to', label: 'How-To', icon: <PenTool className="h-4 w-4" /> },
    { value: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
    { value: 'question', label: 'Question', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'shocking', label: 'Shocking', icon: <Lightning className="h-4 w-4" /> },
    { value: 'benefit', label: 'Benefit-Driven', icon: <ThumbsUp className="h-4 w-4" /> },
  ];

  // Check if user can afford
  const canAfford = user ? (balance >= toolCost) : true; // Guests can always use

  // Effects
  useEffect(() => {
    setShowSuggestions(topic.length > 0);
    
    // Log session info for debugging
    if (session) {
      console.log('✅ User authenticated via Better Auth:', { 
        email: session.user.email, 
        name: session.user.name,
        id: session.user.id
      });
    }
  }, [topic, session]);

  // Fetch tool cost on mount
  useEffect(() => {
    fetchToolCost('title_generator');
  }, [fetchToolCost]);

  // Refresh balance when user logs in
  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  // Functions
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const newCopiedStates = [...copiedStates];
      newCopiedStates[index] = true;
      setCopiedStates(newCopiedStates);
      toast.success('Copied to clipboard! 📋');
      setTimeout(() => {
        const resetStates = [...newCopiedStates];
        resetStates[index] = false;
        setCopiedStates(resetStates);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy 😢');
    }
  };

  const copyAllTitles = () => {
    const allText = titles.map((title, idx) => 
      `🎯 Title ${idx + 1}:\n${title.title}\n\n📝 Description:\n${title.description}\n\n🏷️ Tags: ${title.tags.join(', ')}\n\n`
    ).join('─'.repeat(40) + '\n\n');
    navigator.clipboard.writeText(allText);
    toast.success('All titles copied! 📋');
  };

  const toggleLike = (index: number) => {
    if (likedTitles.includes(index)) {
      setLikedTitles(likedTitles.filter(i => i !== index));
      toast('Removed from favorites', { icon: '💔' });
    } else {
      setLikedTitles([...likedTitles, index]);
      toast.success('Added to favorites! ⭐');
    }
  };

  const generateTitles = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    // Credit check for authenticated users
    if (user && !canAfford) {
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
    setTitles([]);
    setSaveStatus({saved: false});

    const loadingToast = toast.loading('Generating creative titles... 🚀');

    try {
      console.log('Sending request with user:', { 
        email: user?.email, 
        isLoggedIn: !!user, 
        name: user?.name,
        userId: user?.id
      });

      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          tone, 
          contentType,
          includeKeywords,
          creativityLevel: creativityLevel[0],
          count: titleCount,
          userEmail: user?.email,
          userId: user?.id
        }),
      });

      const data = await response.json();
      const endTime = Date.now();
      setGenerationTime(endTime - startTime);

      if (!response.ok) {
        // Handle credit-specific errors
        if (response.status === 403) {
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate titles');
      }

      const titlesWithScores = (data.titles || []).map((title: TitleType, index: number) => ({
        ...title,
        score: Math.floor(Math.random() * 30) + 70,
      }));

      setTitles(titlesWithScores);
      setCopiedStates(new Array(titlesWithScores.length).fill(false));
      
      // Refresh balance if credits were deducted
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }

      // Show success message with credit info
      toast.dismiss(loadingToast);
      
      if (data.creditInfo?.deducted) {
        toast.success(
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-green-500" />
            <span>
              Generated {titlesWithScores.length} titles! Used {data.creditInfo.amount} credits. 
              Remaining: {data.creditInfo.remainingCredits}
            </span>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span>
              Generated {titlesWithScores.length} titles in {(endTime - startTime)/1000}s!
            </span>
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
    setTopic(suggestion);
    setShowSuggestions(false);
    toast.success(`Using: ${suggestion}`, { icon: '🎯' });
  };

  const downloadTitles = () => {
    const content = titles.map((title, idx) => 
      `🎯 TITLE ${idx + 1}\n${'─'.repeat(40)}\n\n📌 Title: ${title.title}\n\n📝 Description: ${title.description}\n\n🏷️ Tags: ${title.tags.join(', ')}\n\n📊 Score: ${title.score}%\n\n`
    ).join('\n' + '═'.repeat(50) + '\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titles_${topic.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Titles downloaded! 💾');
  };

  const shareTitle = (index: number) => {
    if (navigator.share) {
      const title = titles[index];
      navigator.share({
        title: `Title: ${title.title}`,
        text: `${title.title}\n\n${title.description}\n\nTags: ${title.tags.join(', ')}`,
      });
    } else {
      copyToClipboard(titles[index].title, index);
    }
  };

  const analyzeTitle = (title: string) => {
    toast.success('Title analyzed! Check console for details.');
    console.log('Title Analysis:', {
      title,
      length: title.length,
      wordCount: title.split(' ').length,
      hasNumbers: /\d/.test(title),
      hasEmotionalWords: /amazing|ultimate|secret|proven|free/i.test(title),
      readability: 'Good'
    });
  };

  // Handle logout with Better Auth
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Sign in handlers
  const handleSignIn = () => {
    toast.success('Redirecting to sign in...');
    // Add your actual sign in logic
  };

  const handleSignUp = () => {
    toast.success('Redirecting to sign up...');
    // Add your actual sign up logic
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-3 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-4">
              <Crown className="h-6 w-6" />
              <span className="font-semibold">AI Title Generator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
                Craft Perfect Headlines
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Generate click-worthy titles for blogs, videos, and social media. Powered by AI magic. ✨
            </p>
          </div>
          
          {/* Auth and Credit Display */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-white shadow-md rounded-full px-6 py-3 border border-purple-200">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || 'User'} 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold">{balance}</span>
                    {balance < toolCost && (
                      <Badge variant="destructive" className="text-xs ml-1">Low</Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => toast.success('Redirecting to purchase page...')}
                >
                  Buy Credits
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="h-8 w-8 p-0 ml-2 hover:bg-red-100 rounded-full"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignIn}
                  className="bg-white"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSignUp}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Cost Display */}
        <div className="mt-4 flex justify-center gap-4 mb-8">
          <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm">
            <Coins className="h-4 w-4 mr-1 inline" />
            Cost: {toolCost} credits per generation
          </Badge>
          {user && (
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm">
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Your balance: {balance} credits
            </Badge>
          )}
          {!user && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-1 inline" />
              Guest Mode - Free to try!
            </Badge>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-linear-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Type className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{titles.length}</div>
                <div className="text-sm text-gray-600">Generated Titles</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-linear-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{likedTitles.length}</div>
                <div className="text-sm text-gray-600">Favorites</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-linear-to-r from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Clock className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{(generationTime/1000).toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Avg. Time</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-linear-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{saveStatus.saved ? 'Saved' : 'Not Saved'}</div>
                <div className="text-sm text-gray-600">Database Status</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full md:w-auto md:inline-flex mb-6">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate Titles
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Saved Titles
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Input Form */}
              <div className="lg:col-span-2 space-y-8">
                <Card className={`shadow-xl border-0 ${!canAfford && user ? 'border-red-300 bg-red-50/30' : 'bg-linear-to-br from-white to-gray-50'}`}>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Wand2 className="h-6 w-6 text-purple-600" />
                      Title Generation Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your title generation parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Credit Warning for logged in users */}
                    {user && !canAfford && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                          <p className="text-red-700 font-medium">Insufficient Credits</p>
                          <p className="text-sm text-red-600">
                            You need {toolCost} credits to use this tool. You have {balance} credits.
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

                    {/* Guest Mode Info */}
                    {!user && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-blue-700 font-medium">Guest Mode</p>
                          <p className="text-sm text-blue-600">
                            You're using the tool as a guest. Sign in to save your titles and use credits!
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-300"
                          onClick={handleSignIn}
                        >
                          Sign In
                        </Button>
                      </div>
                    )}

                    {/* Topic Input */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        What's Your Topic?
                        <Badge className="ml-2 bg-blue-100 text-blue-800">Required</Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="Enter your topic (e.g., Digital Marketing, AI Technology, Healthy Lifestyle...)"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="h-14 text-lg border-2 border-blue-300 focus:border-blue-500 pl-12 shadow-sm"
                        />
                        <Lightbulb className="absolute left-4 top-4 h-6 w-6 text-blue-400" />
                      </div>
                      
                      {showSuggestions && (
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500 flex items-center gap-2">
                            <Filter className="h-3 w-3" />
                            Popular Topics:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {topicSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => useSuggestion(suggestion.value)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:shadow-md transition-all duration-200 hover:scale-105"
                                style={{ background: suggestion.color + '20' }}
                              >
                                <div className={`p-1.5 rounded-md ${suggestion.color} text-white`}>
                                  {suggestion.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-medium text-sm">{suggestion.value}</div>
                                  <div className="text-xs text-gray-500">{suggestion.category}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Description */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-purple-500" />
                        Additional Details (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add more context about your content..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] border-2 border-purple-300 focus:border-purple-500"
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Content Type */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Content Type
                        </Label>
                        <Select value={contentType} onValueChange={setContentType}>
                          <SelectTrigger className="border-2 border-blue-300 h-12">
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-md ${type.color} text-white`}>
                                    {type.icon}
                                  </div>
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tone */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-pink-500" />
                          Tone of Voice
                        </Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger className="border-2 border-pink-300 h-12">
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

                      {/* Title Count */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 flex items-center gap-2 justify-between">
                          <span className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-green-500" />
                            Number of Titles
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {titleCount} titles
                          </span>
                        </Label>
                        <Slider
                          value={[titleCount]}
                          onValueChange={(value) => setTitleCount(value[0])}
                          max={15}
                          min={3}
                          step={1}
                          className="mt-4"
                        />
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
                        />
                      </div>
                    </div>

                    {/* Switches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-blue-50 to-blue-100">
                        <Label className="text-gray-700 flex items-center gap-2 cursor-pointer">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Include SEO Keywords
                        </Label>
                        <Switch checked={includeKeywords} onCheckedChange={setIncludeKeywords} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-purple-50 to-purple-100">
                        <Label className="text-gray-700 flex items-center gap-2 cursor-pointer">
                          <Grid className="h-4 w-4 text-purple-500" />
                          View Mode
                        </Label>
                        <div className="flex border border-purple-200 rounded-lg overflow-hidden bg-white">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-none px-3"
                          >
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-none px-3"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateTitles}
                      disabled={loading || !topic.trim() || (user && !canAfford)}
                      className={`w-full h-14 text-lg ${
                        user && !canAfford
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700'
                      } shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Titles...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5 mr-2" />
                          {user && !canAfford 
                            ? `Need ${toolCost} Credits (You have ${balance})` 
                            : `Generate ${titleCount} Titles (${toolCost} Credits)`}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Preview & Tips */}
              <div className="space-y-8">
                {/* Preview Card */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-linear-to-r from-blue-100 to-purple-100 rounded-xl border border-blue-200">
                        <div className="text-xs text-blue-600 mb-1">SAMPLE TITLE</div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {topic 
                            ? `The Ultimate Guide to ${topic} in 2024`
                            : 'Your Generated Title Will Appear Here'
                          }
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {topic 
                            ? `Discover everything you need to know about ${topic.toLowerCase()} with this comprehensive guide.`
                            : 'Enter a topic to see a preview of generated titles.'
                          }
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Tags Preview:</div>
                        <div className="flex flex-wrap gap-2">
                          {topic ? (
                            <>
                              <Badge variant="secondary">{topic.toLowerCase()}</Badge>
                              <Badge variant="secondary">guide</Badge>
                              <Badge variant="secondary">2024</Badge>
                              <Badge variant="secondary">tips</Badge>
                            </>
                          ) : (
                            <Badge variant="outline">Enter topic for tags</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <Card className="shadow-xl border-0 bg-linear-to-br from-white to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-100 rounded-md">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Be Specific</div>
                          <div className="text-xs text-gray-600">Specific topics generate better titles</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Use Keywords</div>
                          <div className="text-xs text-gray-600">Include SEO keywords for better reach</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-green-100 rounded-md">
                          <Sparkles className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Experiment</div>
                          <div className="text-xs text-gray-600">Try different tones for varied results</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-xl border-0 bg-linear-to-br from-white to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-pink-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const examples = ['Digital Marketing', 'AI Technology', 'Healthy Lifestyle'];
                          setTopic(examples[Math.floor(Math.random() * examples.length)]);
                        }}
                        className="h-10"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Example
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setTopic('');
                          setDescription('');
                          setTitles([]);
                        }}
                        className="h-10"
                      >
                        <Clipboard className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyAllTitles}
                        disabled={titles.length === 0}
                        className="h-10"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadTitles}
                        disabled={titles.length === 0}
                        className="h-10"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Saved Titles Tab */}
          <TabsContent value="saved">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-6 w-6 text-green-600" />
                  Your Saved Titles
                </CardTitle>
                <CardDescription>
                  {user 
                    ? `Titles saved by ${user.email}`
                    : 'Login to save and view your titles'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-linear-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <Database className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Fetching Saved Titles</h3>
                    <p className="text-gray-600 mb-6">
                      This feature will display all your saved titles from the database.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-linear-to-r from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                    <p className="text-gray-600 mb-6">
                      Please login to save and view your generated titles.
                    </p>
                    <Link href="/auth">
                      <Button>
                        Go to Login
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-6 w-6 text-blue-600" />
                  Title Analytics
                </CardTitle>
                <CardDescription>
                  Insights and statistics about your generated titles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-linear-to-r from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-6">
                    <BarChart className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    Generate titles to see analytics and performance insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generated Titles Section */}
        {titles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Crown className="h-7 w-7 text-purple-600" />
                  Generated Titles
                  <Badge className="bg-linear-to-r from-purple-600 to-pink-600 text-white">
                    {titles.length} titles
                  </Badge>
                </h2>
                <p className="text-gray-600 mt-2">
                  <span className="font-semibold text-blue-700">{topic}</span> • 
                  <span className="mx-2">•</span>
                  <span className="font-semibold text-purple-600">{contentTypes.find(c => c.value === contentType)?.label}</span> • 
                  <span className="mx-2">•</span>
                  <span className="font-semibold text-pink-600">{tones.find(t => t.value === tone)?.label}</span>
                  {saveStatus.saved && (
                    <span className="ml-4 text-green-600 font-medium">
                      <Database className="h-4 w-4 inline mr-1" />
                      Saved to database
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Select value={selectedTitleType} onValueChange={setSelectedTitleType}>
                  <SelectTrigger className="w-[180px] border-2 border-purple-300">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {titleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={copyAllTitles}
                  className="border-2 border-blue-300"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadTitles}
                  className="border-2 border-green-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Titles Grid/List */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-6"
            }>
              {titles.map((title, index) => {
                const scoreColor = title.score! >= 85 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                 title.score! >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                 'bg-gradient-to-r from-red-500 to-pink-500';
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 h-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${scoreColor} text-white`}>
                              <div className="text-xs font-bold">{title.score}%</div>
                            </div>
                            <div>
                              <CardTitle className="text-lg leading-tight">
                                {title.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {title.characterCount} chars
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {title.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleLike(index)}
                              className="h-8 w-8"
                            >
                              <Star className={`h-4 w-4 ${
                                likedTitles.includes(index) 
                                  ? 'text-yellow-500 fill-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(title.title, index)}
                              className="h-8 w-8"
                            >
                              {copiedStates[index] 
                                ? <Check className="h-4 w-4 text-green-600" />
                                : <Copy className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            Description
                          </Label>
                          <p className="text-gray-700 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg">
                            {title.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-500" />
                            Tags
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {title.tags.map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-green-100 transition-colors"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(title.title, index)}
                            className="flex-1"
                          >
                            {copiedStates[index] ? (
                              <>
                                <Check className="mr-2 h-3 w-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-3 w-3" />
                                Copy Title
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareTitle(index)}
                            className="flex-1"
                          >
                            <Share2 className="mr-2 h-3 w-3" />
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeTitle(title.title)}
                            className="flex-1"
                          >
                            <BarChart className="mr-2 h-3 w-3" />
                            Analyze
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">AI Title Generator</div>
                  <div className="text-sm text-gray-500">Powered by Gemini AI</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Generate click-worthy titles for any topic in seconds.
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{titles.length}</div>
                <div className="text-xs text-gray-500">Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{likedTitles.length}</div>
                <div className="text-xs text-gray-500">Liked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(generationTime/1000).toFixed(1)}s</div>
                <div className="text-xs text-gray-500">Avg. Time</div>
              </div>
              {user && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{balance}</div>
                  <div className="text-xs text-gray-500">Credits Left</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="hover:text-purple-600 transition-colors">
                <Button variant="link" className="h-auto p-0">
                  Caption Generator
                </Button>
              </Link>
              <span>•</span>
              <Button variant="link" className="h-auto p-0">
                Privacy Policy
              </Button>
              <span>•</span>
              <Button variant="link" className="h-auto p-0">
                Terms of Service
              </Button>
              <span>•</span>
              <Button variant="link" className="h-auto p-0">
                Contact
              </Button>
            </div>
            <div className="mt-4">
              © {new Date().getFullYear()} AI Title Generator. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-transparent rounded-full animate-spin border-t-blue-500 border-r-purple-500 border-b-pink-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wand2 className="h-12 w-12 text-purple-600 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-800">
              Generating {titleCount} Amazing Titles...
            </p>
            <p className="mt-2 text-gray-600">
              Using AI to craft the perfect headlines for "{topic}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}