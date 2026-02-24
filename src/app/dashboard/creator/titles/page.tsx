// app/title-generator/page.tsx (updated with platform-specific titles)

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
  Coins, AlertCircle, CreditCard, LogIn, UserPlus,
  Instagram, Video, Music, Facebook,
  Info
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
  platform: string;
  characterCount: number;
  style?: string;
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
  const [titles, setTitles] = useState<TitleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook', 'youtube']);
  const [copiedStates, setCopiedStates] = useState<boolean[]>([]);
  const [likedTitles, setLikedTitles] = useState<number[]>([]);
  const [creativityLevel, setCreativityLevel] = useState([8]);
  const [titleCount, setTitleCount] = useState(12);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTab, setSelectedTab] = useState('generate');
  const [titleStyle, setTitleStyle] = useState('catchy');
  
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

  // Platform options
  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500', maxChars: 60 },
    { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-indigo-500', maxChars: 80 },
    { value: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'bg-gradient-to-r from-red-500 to-rose-500', maxChars: 70 },
    { value: 'tiktok', label: 'TikTok', icon: <Music className="h-4 w-4" />, color: 'bg-gradient-to-r from-teal-500 to-cyan-500', maxChars: 50 },
    // { value: 'linkedin', label: 'LinkedIn', icon: <Briefcase className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-600 to-sky-600', maxChars: 70 },
    { value: 'twitter', label: 'Twitter/X', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-gradient-to-r from-slate-600 to-gray-600', maxChars: 50 },
  ];

  const titleStyles = [
    { value: 'catchy', label: 'Catchy & Viral', icon: <Sparkles className="h-4 w-4" />, color: 'text-purple-500' },
    { value: 'question', label: 'Question Based', icon: <MessageSquare className="h-4 w-4" />, color: 'text-blue-500' },
    { value: 'howto', label: 'How-To', icon: <PenTool className="h-4 w-4" />, color: 'text-green-500' },
    { value: 'list', label: 'List Style', icon: <List className="h-4 w-4" />, color: 'text-orange-500' },
    { value: 'emotional', label: 'Emotional', icon: <Heart className="h-4 w-4" />, color: 'text-red-500' },
    { value: 'controversial', label: 'Controversial', icon: <Zap className="h-4 w-4" />, color: 'text-yellow-500' },
  ];

  const topicSuggestions: TopicSuggestion[] = [
    { value: 'Digital Marketing Tips', category: 'Business', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'Healthy Breakfast Ideas', category: 'Food', icon: <Heart className="h-4 w-4" />, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'Fitness Motivation', category: 'Health', icon: <Zap className="h-4 w-4" />, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { value: 'Travel Hacks', category: 'Travel', icon: <Globe className="h-4 w-4" />, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { value: 'Money Saving Tips', category: 'Finance', icon: <Coins className="h-4 w-4" />, color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { value: 'Productivity Hacks', category: 'Self-Improvement', icon: <Rocket className="h-4 w-4" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  ];

  // Check if user can afford
  const canAfford = user ? (balance >= toolCost) : true;

  // Effects
  useEffect(() => {
    setShowSuggestions(topic.length > 0);
    
    if (session) {
      console.log('✅ User authenticated:', { 
        email: session.user.email, 
        name: session.user.name,
        id: session.user.id
      });
    }
  }, [topic, session]);

  useEffect(() => {
    fetchToolCost('title_generator');
  }, [fetchToolCost]);

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
      `[${title.platform.toUpperCase()}] ${title.title}`
    ).join('\n\n');
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

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generateTitles = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

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

    const loadingToast = toast.loading('Generating platform-specific titles... 🚀');

    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic,
          platforms: selectedPlatforms,
          style: titleStyle,
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
        if (response.status === 403) {
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate titles');
      }

      const titlesWithScores = (data.titles || []).map((title: TitleType, index: number) => ({
        ...title,
        score: Math.floor(Math.random() * 20) + 75,
      }));

      setTitles(titlesWithScores);
      setCopiedStates(new Array(titlesWithScores.length).fill(false));
      
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }

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
      `[${title.platform.toUpperCase()}] ${title.title}`
    ).join('\n');
    
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

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSignIn = () => {
    toast.success('Redirecting to sign in...');
  };

  const handleSignUp = () => {
    toast.success('Redirecting to sign up...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Get platform icon and color
  const getPlatformDetails = (platform: string) => {
    return platforms.find(p => p.value === platform) || platforms[0];
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-3 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-4">
              <Crown className="h-6 w-6" />
              <span className="font-semibold">Multi-Platform Title Generator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
                Create Viral Titles
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Generate perfect titles for Instagram, Facebook, YouTube and more. No hashtags, just pure catchy titles! ✨
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
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full md:w-auto md:inline-flex mb-6">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate Titles
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites ({likedTitles.length})
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
                      Configure your platform-specific title generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Credit Warning */}
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
                            You're using the tool as a guest. Sign in to save your favorites and use credits!
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
                          placeholder="e.g., Digital Marketing, Healthy Recipes, Travel Tips..."
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

                    {/* Platform Selection */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-500" />
                        Select Platforms
                        <Badge className="ml-2 bg-green-100 text-green-800">Select at least one</Badge>
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {platforms.map((platform) => (
                          <button
                            key={platform.value}
                            onClick={() => togglePlatform(platform.value)}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                              selectedPlatforms.includes(platform.value)
                                ? `${platform.color} text-white border-transparent shadow-lg scale-105`
                                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            {platform.icon}
                            <span className="text-sm font-medium">{platform.label}</span>
                            {selectedPlatforms.includes(platform.value) && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title Style */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-500" />
                        Title Style
                      </Label>
                      <Select value={titleStyle} onValueChange={setTitleStyle}>
                        <SelectTrigger className="border-2 border-purple-300 h-12">
                          <SelectValue placeholder="Select title style" />
                        </SelectTrigger>
                        <SelectContent>
                          {titleStyles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              <div className="flex items-center gap-3">
                                <div className={style.color}>
                                  {style.icon}
                                </div>
                                <span>{style.label}</span>
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
                          {titleCount} titles total
                        </span>
                      </Label>
                      <Slider
                        value={[titleCount]}
                        onValueChange={(value) => setTitleCount(value[0])}
                        max={30}
                        min={6}
                        step={3}
                        className="mt-4"
                      />
                      <p className="text-xs text-gray-500">
                        ~{Math.ceil(titleCount / selectedPlatforms.length)} titles per platform
                      </p>
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

                    {/* Generate Button */}
                    <Button
                      onClick={generateTitles}
                      disabled={loading || !topic.trim() || selectedPlatforms.length === 0 || (user && !canAfford)}
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
                            : `Generate ${titleCount} Platform Titles (${toolCost} Credits)`}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Tips & Info */}
              <div className="space-y-8">
                {/* Platform Info Card */}
                <Card className="shadow-xl border-0 bg-linear-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Platform Title Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPlatforms.map(platform => {
                      const p = getPlatformDetails(platform);
                      return (
                        <div key={platform} className="p-3 rounded-lg bg-white/50">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-md ${p.color} text-white`}>
                              {p.icon}
                            </div>
                            <span className="font-semibold">{p.label}</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Max {p.maxChars} characters • Keep it {platform === 'instagram' ? 'visual & trending' : platform === 'youtube' ? 'click-worthy' : 'engaging'}
                          </p>
                        </div>
                      );
                    })}
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
                          const examples = ['Digital Marketing Tips', 'Healthy Breakfast Ideas', 'Travel Hacks'];
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

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                  Your Favorite Titles
                </CardTitle>
                <CardDescription>
                  Titles you've starred for later use
                </CardDescription>
              </CardHeader>
              <CardContent>
                {likedTitles.length > 0 ? (
                  <div className="space-y-4">
                    {titles.filter((_, index) => likedTitles.includes(index)).map((title, idx) => {
                      const originalIndex = titles.findIndex((_, i) => likedTitles.includes(i));
                      const platform = getPlatformDetails(title.platform);
                      return (
                        <div key={idx} className="p-4 border rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${platform.color} text-white`}>
                              {platform.icon}
                            </div>
                            <div>
                              <p className="font-medium">{title.title}</p>
                              <p className="text-xs text-gray-500">{platform.label} • {title.characterCount} chars</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLike(originalIndex)}
                          >
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-linear-to-r from-yellow-100 to-amber-100 flex items-center justify-center mx-auto mb-6">
                      <Star className="h-10 w-10 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-600">
                      Star your favorite titles while generating to see them here!
                    </p>
                  </div>
                )}
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
                  Platform Titles
                  <Badge className="bg-linear-to-r from-purple-600 to-pink-600 text-white">
                    {titles.length} titles
                  </Badge>
                </h2>
                <p className="text-gray-600 mt-2">
                  Topic: <span className="font-semibold text-blue-700">{topic}</span> • 
                  Style: <span className="font-semibold text-purple-600">{titleStyles.find(s => s.value === titleStyle)?.label}</span>
                </p>
              </div>

              <div className="flex gap-3">
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

            {/* Titles Grid - Platform Grouped */}
            <div className="space-y-8">
              {selectedPlatforms.map(platform => {
                const platformTitles = titles.filter(t => t.platform === platform);
                if (platformTitles.length === 0) return null;
                
                const platformDetails = getPlatformDetails(platform);
                
                return (
                  <div key={platform}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${platformDetails.color} text-white`}>
                        {platformDetails.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {platformDetails.label} Titles
                      </h3>
                      <Badge variant="outline">{platformTitles.length}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {platformTitles.map((title, index) => {
                        const originalIndex = titles.findIndex(t => t === title);
                        const scoreColor = title.score! >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                         title.score! >= 80 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                         'bg-gradient-to-r from-orange-500 to-red-500';
                        
                        return (
                          <motion.div
                            key={originalIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: originalIndex * 0.05 }}
                          >
                            <Card className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 h-full">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3 w-full">
                                    <div className={`p-2 rounded-lg ${scoreColor} text-white min-w-[50px] text-center`}>
                                      <div className="text-xs font-bold">{title.score}%</div>
                                    </div>
                                    <div className="flex-1">
                                      <CardTitle className="text-base leading-tight">
                                        {title.title}
                                      </CardTitle>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {title.characterCount} chars
                                        </Badge>
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {title.style || titleStyle}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleLike(originalIndex)}
                                        className="h-8 w-8"
                                      >
                                        <Star className={`h-4 w-4 ${
                                          likedTitles.includes(originalIndex) 
                                            ? 'text-yellow-500 fill-yellow-500' 
                                            : 'text-gray-400 hover:text-yellow-500'
                                        }`} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(title.title, originalIndex)}
                                    className="flex-1"
                                  >
                                    {copiedStates[originalIndex] ? (
                                      <>
                                        <Check className="mr-2 h-3 w-3" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copy
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (navigator.share) {
                                        navigator.share({
                                          title: 'Title',
                                          text: title.title
                                        });
                                      } else {
                                        copyToClipboard(title.title, originalIndex);
                                      }
                                    }}
                                    className="flex-1"
                                  >
                                    <Share2 className="mr-2 h-3 w-3" />
                                    Share
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
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
              Generating Platform Titles...
            </p>
            <p className="mt-2 text-gray-600">
              Creating catchy titles for {selectedPlatforms.map(p => getPlatformDetails(p).label).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}