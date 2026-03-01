// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Sparkles, Copy, Twitter, Instagram, 
  Facebook, Hash, Linkedin, Zap, TrendingUp, Palette, 
  Volume2, Check, Share2, Download, Star, Clock, 
  MessageSquare, Heart, Target, Wand2,
  ArrowDown, Clipboard, Grid, List, Eye, Filter, Database, Save,
  Coins, AlertCircle, CreditCard, Power, PowerOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useCredits } from '../../../../../useCredits';
import { useSession } from '../../../../../lib/auth-client';

type CaptionType = {
  caption: string;
  hashtags: string[];
  emojis: string[];
  engagementScore?: number;
  tone?: string;
  characterCount?: number;
};

type NicheSuggestion = {
  value: string;
  category: string;
  icon: React.ReactNode;
};

export default function Home() {
  // Get real user session from your auth system
  const { data: session } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';

  // State
  const [niche, setNiche] = useState('');
  const [captions, setCaptions] = useState<CaptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('friendly');
  const [platform, setPlatform] = useState('instagram');
  const [copiedStates, setCopiedStates] = useState<boolean[]>([]);
  const [likedCaptions, setLikedCaptions] = useState<number[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<number | null>(null);
  const [includeTrending, setIncludeTrending] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState([7]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saving, setSaving] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<{saved: boolean; recordId?: number}>({saved: false});
  
  // NEW: Tool enabled/disabled state
  const [toolEnabled, setToolEnabled] = useState<boolean>(true);
  const [checkingToolStatus, setCheckingToolStatus] = useState<boolean>(true);
  
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
  const nicheSuggestions: NicheSuggestion[] = [
    { value: 'Fitness & Health', category: 'Lifestyle', icon: <Zap className="h-4 w-4" /> },
    { value: 'Travel Photography', category: 'Creative', icon: <Eye className="h-4 w-4" /> },
    { value: 'Vegan Recipes', category: 'Food', icon: <Palette className="h-4 w-4" /> },
    { value: 'Tech Gadgets', category: 'Technology', icon: <Zap className="h-4 w-4" /> },
    { value: 'Personal Finance', category: 'Business', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'Digital Marketing', category: 'Business', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const tones = [
    { value: 'friendly', label: 'Friendly', icon: <Heart className="h-4 w-4" />, color: 'text-green-500' },
    { value: 'professional', label: 'Professional', icon: <Linkedin className="h-4 w-4" />, color: 'text-blue-500' },
    { value: 'funny', label: 'Funny', icon: <MessageSquare className="h-4 w-4" />, color: 'text-yellow-500' },
    { value: 'inspirational', label: 'Inspirational', icon: <Sparkles className="h-4 w-4" />, color: 'text-purple-500' },
    { value: 'casual', label: 'Casual', icon: <Heart className="h-4 w-4" />, color: 'text-pink-500' },
    { value: 'bold', label: 'Bold', icon: <Volume2 className="h-4 w-4" />, color: 'text-red-500' },
  ];

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-gradient-to-r from-blue-700 to-blue-900' },
    { value: 'tiktok', label: 'TikTok', icon: MessageSquare, color: 'bg-gradient-to-r from-black to-gray-800' },
  ];

  // NEW: Check if tool is enabled for this user
  useEffect(() => {
    const checkToolStatus = async () => {
      if (!user?.id) {
        setCheckingToolStatus(false);
        return;
      }

      try {
        setCheckingToolStatus(true);
        const response = await fetch(`/api/user/tool-status?userId=${user.id}&toolName=caption_generator`);
        const data = await response.json();

        if (response.ok) {
          setToolEnabled(data.enabled);
          if (!data.enabled) {
            console.log('⚠️ Tool is disabled by admin');
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
  }, [user]);

  // Check if user can afford
  const canAfford = user ? (balance >= toolCost) : false;

  // Effects
  useEffect(() => {
    setShowSuggestions(niche.length > 0);
  }, [niche]);

  // Fetch tool cost on mount
  useEffect(() => {
    fetchToolCost('caption_generator');
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

  const copyAllCaptions = () => {
    const allText = captions.map((cap, idx) => 
      `Option ${idx + 1}:\n${cap.caption}\nHashtags: ${cap.hashtags.join(' ')}\nEmojis: ${cap.emojis.join(' ')}\n\n`
    ).join('---\n');
    copyToClipboard(allText, -1);
    toast.success('All captions copied! 🎉');
  };

  const toggleLike = (index: number) => {
    if (likedCaptions.includes(index)) {
      setLikedCaptions(likedCaptions.filter(i => i !== index));
      toast('Removed from favorites', { icon: '💔' });
    } else {
      setLikedCaptions([...likedCaptions, index]);
      toast.success('Added to favorites! ⭐', { icon: '⭐' });
    }
  };

  const generateCaptions = async () => {
    // NEW: Check if tool is disabled by admin
    if (!toolEnabled) {
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
      toast.error('Please enter a niche');
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
    setCaptions([]);
    setSelectedCaption(null);
    setSaveStatus({saved: false});

    const loadingToast = toast.loading('Generating creative captions... ✨');

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche, 
          tone, 
          platform,
          includeTrending,
          creativityLevel: creativityLevel[0],
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
          if (data.error?.includes('disabled')) {
            // Tool disabled error
            setToolEnabled(false);
            throw new Error(data.message || 'This tool has been disabled by the administrator');
          }
          throw new Error(data.message || data.error || 'Insufficient credits');
        }
        throw new Error(data.error || 'Failed to generate captions');
      }

      // Add engagement scores to generated captions
      const captionsWithScores = (data.captions || []).map((caption: CaptionType, index: number) => ({
        ...caption,
        engagementScore: Math.floor(Math.random() * 30) + 70,
        characterCount: caption.caption.length,
        tone,
      }));

      setCaptions(captionsWithScores);
      setCopiedStates(new Array(captionsWithScores.length).fill(false));
      
      // Refresh balance if credits were deducted
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }

      // Show success message with credit info
      toast.dismiss(loadingToast);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-green-500" />
          <span>
            Generated {captionsWithScores.length} captions! Used {data.creditInfo?.amount || toolCost} credits. 
            Remaining: {data.creditInfo?.remainingCredits || balance - toolCost}
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
    setNiche(suggestion);
    setShowSuggestions(false);
    toast.success(`Using: ${suggestion}`, { icon: '🎯' });
  };

  const downloadCaptions = () => {
    const content = captions.map((cap, idx) => 
      `=== Option ${idx + 1} ===\n\nCaption: ${cap.caption}\n\nHashtags: ${cap.hashtags.join(' ')}\n\nEmojis: ${cap.emojis.join(' ')}\n\nEngagement Score: ${cap.engagementScore}%\n\n`
    ).join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions_${niche.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Captions downloaded! 💾');
  };

  const shareCaption = (index: number) => {
    if (navigator.share) {
      const caption = captions[index];
      navigator.share({
        title: `Caption for ${niche}`,
        text: `${caption.caption}\n\n${caption.hashtags.join(' ')}`,
      });
    } else {
      copyToClipboard(captions[index].caption, index);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platforms.find(p => p.value === platform)?.icon || Hash;
  };

  // Save individual caption
  const saveIndividualCaption = async (caption: CaptionType, index: number) => {
    // NEW: Check if tool is disabled by admin before saving
    if (!toolEnabled) {
      toast.error(
        <div className="flex items-center gap-2">
          <PowerOff className="h-5 w-5 text-red-500" />
          <span>This tool has been disabled by the administrator. Cannot save captions.</span>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    setSavingIndex(index);
    const saveToast = toast.loading(`Saving caption ${index + 1}...`);

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-single',
          niche: niche,
          captionContent: caption,
          platform: platform,
          tone: tone,
          includeTrending: includeTrending,
          creativityLevel: creativityLevel[0],
          userEmail: user?.email,
          userId: user?.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.includes('disabled')) {
          setToolEnabled(false);
          throw new Error('Tool has been disabled by administrator');
        }
        throw new Error(data.error || 'Failed to save caption');
      }
      
      toast.dismiss(saveToast);
      toast.success(
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-green-500" />
          <span>Caption saved! 💾</span>
        </div>,
        { duration: 2000 }
      );

    } catch (error: any) {
      toast.dismiss(saveToast);
      toast.error(error.message || 'Failed to save caption');
    } finally {
      setSavingIndex(null);
      setSaving(false);
    }
  };

  if (isLoading || checkingToolStatus) {
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
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header with Credit Display and Tool Status */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="inline-flex items-center gap-3 bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full">
              <Wand2 className="h-6 w-6" />
              <span className="font-semibold">AI Caption Generator</span>
            </div>
            
            {/* Tool Status Indicator */}
            {!toolEnabled && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full border border-red-300">
                <PowerOff className="h-4 w-4" />
                <span className="text-sm font-medium">Tool Disabled by Admin</span>
              </div>
            )}
            
            {/* Credit Display for Authenticated User */}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => toast.success('Redirecting to purchase page...')}
              >
                Buy Credits
              </Button>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-600 via-pink-600 to-purple-600">
              Create Captivating Captions
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter any niche and generate beautiful, engaging social media captions instantly
          </p>

          {/* Cost Display */}
          <div className="mt-4 flex justify-center gap-3">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm">
              <Coins className="h-4 w-4 mr-1 inline" />
              Cost: {toolCost} credits per generation
            </Badge>
            
            {/* Tool Status Badge */}
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
          </div>
        </header>

        {/* Input Section */}
        <div className="mb-8">
          <Card className={`shadow-lg border ${
            !toolEnabled 
              ? 'border-red-300 bg-red-50/30 opacity-75' 
              : !canAfford 
                ? 'border-red-300 bg-red-50/30' 
                : 'border-purple-200'
          }`}>
            <CardHeader>
              <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Generate Your Captions
              </CardTitle>
              <CardDescription>
                Fill in the details below and click generate to create amazing captions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tool Disabled Warning */}
              {!toolEnabled && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
                  <PowerOff className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">Tool Disabled by Administrator</p>
                    <p className="text-sm text-red-600">
                      The caption generator tool has been disabled. Please contact support if you believe this is an error.
                    </p>
                  </div>
                </div>
              )}

              {/* Credit Warning */}
              {!canAfford && toolEnabled && (
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

              <div className="space-y-3">
                <Label className="text-gray-700 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  What's Your Niche?
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your niche (e.g., Fitness, Travel, Food, Tech...)"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="h-14 text-lg border-2 border-purple-300 focus:border-purple-500 pl-12"
                    disabled={!toolEnabled} // NEW: Disable input if tool is disabled
                  />
                  <Sparkles className="absolute left-4 top-4 h-6 w-6 text-purple-400" />
                </div>
                
                {showSuggestions && toolEnabled && ( // NEW: Only show suggestions if tool is enabled
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500 flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      Quick Suggestions:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {nicheSuggestions.map((suggestion, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-sm px-3 py-1"
                          onClick={() => useSuggestion(suggestion.value)}
                        >
                          {suggestion.icon}
                          <span className="ml-1">{suggestion.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-blue-500" />
                    Platform
                  </Label>
                  <Select 
                    value={platform} 
                    onValueChange={setPlatform}
                    disabled={!toolEnabled} // NEW: Disable select if tool is disabled
                  >
                    <SelectTrigger className="border-2 border-purple-300 h-12">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platformOption) => (
                        <SelectItem key={platformOption.value} value={platformOption.value}>
                          {platformOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-pink-500" />
                    Tone of Voice
                  </Label>
                  <Select 
                    value={tone} 
                    onValueChange={setTone}
                    disabled={!toolEnabled} // NEW: Disable select if tool is disabled
                  >
                    <SelectTrigger className="border-2 border-purple-300 h-12">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((toneOption) => (
                        <SelectItem key={toneOption.value} value={toneOption.value}>
                          <div className="flex items-center gap-2">
                            {toneOption.icon}
                            {toneOption.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-yellow-500" />
                      Creativity Level
                    </span>
                    <span className="text-sm font-medium text-purple-600">
                      {creativityLevel[0]}/10
                    </span>
                  </Label>
                  <Slider
                    value={creativityLevel}
                    onValueChange={setCreativityLevel}
                    max={10}
                    min={1}
                    step={1}
                    disabled={!toolEnabled} // NEW: Disable slider if tool is disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-purple-100">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Include Trending Hashtags
                  </Label>
                  <Switch 
                    checked={includeTrending} 
                    onCheckedChange={setIncludeTrending}
                    disabled={!toolEnabled} // NEW: Disable switch if tool is disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Grid className="h-4 w-4 text-purple-500" />
                    View Mode
                  </Label>
                  <div className="flex border border-purple-200 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                      disabled={!toolEnabled} // NEW: Disable button if tool is disabled
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none"
                      disabled={!toolEnabled} // NEW: Disable button if tool is disabled
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={generateCaptions}
                disabled={
                  loading || 
                  !niche.trim() || 
                  !canAfford || 
                  !toolEnabled || // NEW: Disable if tool is disabled
                  checkingToolStatus
                }
                className={`w-full h-14 text-lg ${
                  !toolEnabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : !canAfford
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating Captions...
                  </>
                ) : !toolEnabled ? (
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
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Captions ({toolCost} Credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {captions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 grid grid-cols-4 gap-4"
            >
              <Card className="text-center p-4 bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{captions.length}</div>
                <div className="text-sm text-gray-600">Captions</div>
              </Card>
              <Card className="text-center p-4 bg-linear-to-br from-pink-50 to-pink-100 border border-pink-200">
                <div className="text-2xl font-bold text-pink-700">{likedCaptions.length}</div>
                <div className="text-sm text-gray-600">Favorites</div>
              </Card>
              <Card className="text-center p-4 bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{(generationTime / 1000).toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Generation Time</div>
              </Card>
              <Card className="text-center p-4 bg-linear-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{balance}</div>
                <div className="text-sm text-gray-600">Credits Left</div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Output Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Clipboard className="h-6 w-6 text-purple-600" />
                Generated Captions
                {captions.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {captions.length} results
                  </Badge>
                )}
              </h2>
              {captions.length > 0 && (
                <p className="text-gray-600 mt-1">
                  For: <span className="font-semibold text-purple-700">{niche}</span> • 
                  Platform: <span className="font-semibold text-blue-600">{platforms.find(p => p.value === platform)?.label}</span> • 
                  Tone: <span className="font-semibold text-pink-600">{tones.find(t => t.value === tone)?.label}</span>
                  {saveStatus.saved && (
                    <span className="ml-3 text-green-600 font-medium">
                      <Database className="h-4 w-4 inline mr-1" />
                      Saved successfully
                    </span>
                  )}
                </p>
              )}
            </div>

            {captions.length > 0 && toolEnabled && ( // NEW: Only show action buttons if tool is enabled
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyAllCaptions}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
                <Button variant="outline" onClick={downloadCaptions}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {captions.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                {captions.map((caption, index) => {
                  const PlatformIcon = getPlatformIcon(platform);
                  const fullText = `${caption.caption}\n\n${caption.hashtags.join(' ')}\n\n${caption.emojis.join(' ')}`;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border border-purple-200 hover:border-purple-300 transition-all">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
                                <PlatformIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  Option {index + 1}
                                  {likedCaptions.includes(index) && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {caption.tone}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {caption.characterCount} chars
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleLike(index)}
                                disabled={!toolEnabled} // NEW: Disable if tool is disabled
                              >
                                <Star className={`h-4 w-4 ${likedCaptions.includes(index) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => saveIndividualCaption(caption, index)}
                                disabled={saving && savingIndex === index || !toolEnabled} // NEW: Disable if tool is disabled
                              >
                                {saving && savingIndex === index ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className={`h-4 w-4 ${toolEnabled ? 'text-gray-600 hover:text-green-600' : 'text-gray-400'}`} />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => copyToClipboard(fullText, index)}
                                disabled={!toolEnabled} // NEW: Disable if tool is disabled
                              >
                                {copiedStates[index] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className={`h-4 w-4 ${toolEnabled ? '' : 'text-gray-400'}`} />}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-purple-500" />
                              Caption
                            </Label>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                              <p className="text-gray-800 text-lg leading-relaxed font-medium">
                                {caption.caption}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500 flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Hashtags ({caption.hashtags.length})
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {caption.hashtags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="cursor-pointer hover:bg-blue-100">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Emojis</Label>
                              <div className="flex gap-3 text-2xl">
                                {caption.emojis.map((emoji, emojiIndex) => (
                                  <span key={emojiIndex} className="cursor-pointer hover:scale-110 transition-transform">
                                    {emoji}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t border-purple-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(fullText, index)}
                              className="flex-1"
                              disabled={!toolEnabled} // NEW: Disable if tool is disabled
                            >
                              {copiedStates[index] ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy All
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareCaption(index)}
                              disabled={!toolEnabled} // NEW: Disable if tool is disabled
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-purple-300 bg-purple-50/80">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-linear-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-8">
                    <Clipboard className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Your Captions Will Appear Here
                  </h3>
                  <p className="text-gray-600">
                    Fill in the form above and click "Generate Captions Now" to create amazing content.
                  </p>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Wand2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">AI Caption Generator</span>
              </div>
              <p className="text-gray-500 text-sm">
                Powered by Google Gemini AI • Create beautiful captions instantly
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Avg: {captions.length > 0 ? (generationTime / 1000).toFixed(1) : '--'}s</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Target className="h-4 w-4" />
                <span>{captions.length} captions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Coins className="h-4 w-4" />
                <span>{balance} credits</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 border-4 border-purple-600 rounded-full animate-spin border-t-transparent mx-auto"></div>
            <p className="mt-4 text-purple-600 font-medium">
              Generating amazing captions for you...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}