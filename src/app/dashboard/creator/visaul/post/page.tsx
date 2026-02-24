// app/dashboard/social-posts/page.tsx
'use client';

import { Upload, ImagePlus, X, Loader2, Download, Sparkles, Instagram, Facebook, Coins, CreditCard, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import SocialPostList from '../../../../../../components/dashboard/Socialpostlist';
import { useToast } from '../../../../../../hooks/use-toast';
import { useSession } from '../../../../../../lib/auth-client';
import { useCredits } from '../../../../../../useCredits';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Platform and ratio configurations
const PLATFORMS = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'from-purple-600 to-pink-600',
    ratios: [
      { value: '1:1', label: 'Square (1:1)', description: 'Perfect for feed posts' },
      { value: '4:5', label: 'Portrait (4:5)', description: 'Ideal for feed, takes more space' },
      { value: '16:9', label: 'Landscape (16:9)', description: 'Great for video thumbnails' },
      { value: '9:16', label: 'Story (9:16)', description: 'For Stories & Reels' }
    ]
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'from-blue-600 to-indigo-600',
    ratios: [
      { value: '1:1', label: 'Square (1:1)', description: 'Standard feed post' },
      { value: '16:9', label: 'Landscape (16:9)', description: 'Best for link shares' },
      { value: '9:16', label: 'Portrait (9:16)', description: 'For mobile optimization' },
      { value: '4:5', label: 'Vertical (4:5)', description: 'Recommended for feed' }
    ]
  }
};

export default function SocialPostGeneratorPage() {
  const [userInput, setUserInput] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [includeImage, setIncludeImage] = useState<File | null>(null);
  const [includeImagePreview, setIncludeImagePreview] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [outputPostImage, setOutputPostImage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  // Get session from Better Auth
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const userEmail = session?.user?.email;
  const userId = session?.user?.id;

  // Credit management hook
  const { 
    balance, 
    loading: creditsLoading, 
    error: creditsError,
    checkCredits,
    refreshBalance,
    toolCost,
    fetchToolCost 
  } = useCredits(userId);

  // Check if user can afford (3 credits per generation as specified)
  const canAfford = isLoggedIn ? (balance >= toolCost) : false;

  // Fetch tool cost on mount
  useEffect(() => {
    fetchToolCost('social_post_generator');
  }, [fetchToolCost]);

  // Refresh balance when user logs in
  useEffect(() => {
    if (userId) {
      refreshBalance();
    }
  }, [userId, refreshBalance]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clean up previous preview
    if (includeImagePreview) URL.revokeObjectURL(includeImagePreview);
    
    const previewUrl = URL.createObjectURL(file);
    setIncludeImage(file);
    setIncludeImagePreview(previewUrl);
  };

  const clearPreviews = () => {
    if (includeImagePreview) URL.revokeObjectURL(includeImagePreview);
    setIncludeImagePreview(undefined);
    setIncludeImage(null);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please login to generate social posts",
        variant: "destructive",
      });
      return;
    }

    if (!userInput) {
      toast({
        title: "Description required",
        description: "Please describe what you want in your post",
        variant: "destructive",
      });
      return;
    }

    // Credit check
    if (!canAfford) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${toolCost} credits to generate a post. You have ${balance} credits.`,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('description', userInput);
    formData.append('platform', selectedPlatform);
    formData.append('aspectRatio', selectedRatio);
    formData.append('userId', userId || '');
    formData.append('userEmail', userEmail || '');
    if (includeImage) formData.append('includeImage', includeImage);
    
    try {
      const result = await axios.post('/api/generate-social-post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const postUrl = result.data.postUrl;
      setOutputPostImage(postUrl);
      
      // Refresh balance after credit deduction
      await refreshBalance();
      
      // Clear the form
      setUserInput('');
      clearPreviews();
      
      const remainingCredits = result.data.creditInfo?.remainingCredits || balance - toolCost;
      toast({
        title: "Success",
        description: `${PLATFORMS[selectedPlatform].name} post generated! Used ${toolCost} credits. Remaining: ${remainingCredits}`,
      });
      
      // Trigger refresh of posts list
      setRefreshTrigger(prev => prev + 1);
      
    } catch (e: any) {
      console.error('Generation error:', e);
      
      // Handle credit-specific errors
      if (e.response?.status === 403) {
        toast({
          title: "Insufficient Credits",
          description: e.response?.data?.message || "You don't have enough credits to generate a post.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: e.response?.data?.error || "Failed to generate post. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const downloadPost = async () => {
    if (!outputPostImage) {
      toast({
        title: "Error",
        description: "No post to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(outputPostImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPlatform}-post-${selectedRatio.replace(':', '-')}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Post download started",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download post",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  const currentPlatform = PLATFORMS[selectedPlatform];
  const PlatformIcon = currentPlatform.icon;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8 transition-colors duration-300">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`p-2 bg-gradient-to-r ${currentPlatform.color} rounded-full shadow-lg`}>
            <PlatformIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            Social Media Post Generator
          </h1>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Create stunning social media posts for Instagram and Facebook with perfect dimensions for every format.
          </p>
          
          {/* Credit Info Bar */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm shadow-sm">
              <Coins className="h-4 w-4 mr-1 inline" />
              Cost: {toolCost} credits per post
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm shadow-sm">
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Your balance: {balance} credits
              {balance < toolCost && (
                <span className="ml-2 text-xs text-red-600 font-bold">(Low)</span>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-blue-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-700">
              Logged in as: <span className="font-semibold text-blue-600">{userEmail}</span>
            </p>
          </div>
        </div>

        {/* Credit Warning */}
        {balance < toolCost && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-red-700 font-medium">Insufficient Credits</p>
              <p className="text-sm text-red-600">
                You need {toolCost} credits to generate a post. You have {balance} credits.
              </p>
            </div>
            <Link href="/purchase-credits">
              <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-50">
                Buy Credits
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Platform Selector */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-4 justify-center">
          {Object.entries(PLATFORMS).map(([key, platform]) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedPlatform(key as 'instagram' | 'facebook');
                  setSelectedRatio(platform.ratios[0].value);
                }}
                disabled={loading || balance < toolCost}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-r ${platform.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className="h-5 w-5" />
                {platform.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Select Aspect Ratio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentPlatform.ratios.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => setSelectedRatio(ratio.value)}
              disabled={loading || balance < toolCost}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedRatio === ratio.value
                  ? `border-${selectedPlatform === 'instagram' ? 'purple' : 'blue'}-500 bg-gradient-to-br from-white to-${selectedPlatform === 'instagram' ? 'purple' : 'blue'}-50 shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-semibold text-gray-800">{ratio.label}</div>
              <div className="text-xs text-gray-500 mt-1">{ratio.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Post Preview Section */}
      <div className="flex justify-center items-center max-w-4xl mx-auto mb-8">
        {loading ? (
          <div className="h-[300px] bg-white border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-xl">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <h2 className="text-lg font-medium mt-4 text-gray-800">Creating your {currentPlatform.name} post...</h2>
            <p className="text-sm text-gray-500 mt-1">This will cost {toolCost} credits</p>
          </div>
        ) : (
          <div className="relative group w-full max-w-2xl">
            {outputPostImage ? (
              <>
                <div className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-white bg-white">
                  <Image 
                    src={outputPostImage} 
                    alt='AI generated social post'
                    width={600} 
                    height={selectedRatio === '9:16' ? 1067 : selectedRatio === '16:9' ? 338 : 600} 
                    className={`w-full object-cover ${
                      selectedRatio === '1:1' ? 'aspect-square' :
                      selectedRatio === '4:5' ? 'aspect-[4/5]' :
                      selectedRatio === '16:9' ? 'aspect-video' :
                      'aspect-[9/16]'
                    }`}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <button
                      onClick={downloadPost}
                      className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full font-medium shadow-lg hover:bg-gray-50 hover:scale-105 active:scale-95"
                    >
                      <Download className="h-5 w-5 text-blue-600" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  {selectedRatio}
                </div>
              </>
            ) : (
              <div className="h-[300px] bg-white border-2 border-dashed border-blue-300 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-lg">
                <div className="p-3 bg-blue-100 rounded-full mb-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 text-center">Your {currentPlatform.name} post will appear here</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Describe your post and select {selectedRatio} format
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Cost: {toolCost} credits per generation
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="max-w-4xl mx-auto">
        {/* Textarea with upload */}
        <div className="relative mb-8">
          <textarea
            id="description"
            rows={4}
            value={userInput}
            placeholder={`Describe your ${currentPlatform.name} post... (e.g., "A motivational quote with mountain background" or "Product showcase for summer sale")`}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || balance < toolCost}
            className="w-full px-5 py-4 pr-14 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base bg-white text-gray-800 placeholder-gray-400 resize-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !userInput || balance < toolCost}
            className={`absolute right-3 bottom-3 text-white bg-gradient-to-r ${currentPlatform.color} hover:from-opacity-90 hover:to-opacity-90 p-3 cursor-pointer rounded-full shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            title="Generate post"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        </div>

        {/* Upload Image Section */}
        <div className="flex flex-col items-center gap-4">
          <label htmlFor="includeimage" className="w-full max-w-md">
            {!includeImagePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 text-gray-700 w-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 cursor-pointer bg-white group relative overflow-hidden ${loading || balance < toolCost ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors z-10">
                  <ImagePlus className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium z-10">Include Image (Optional)</span>
              </div>
            ) : (
              <div className='relative h-32 w-full rounded-xl overflow-hidden group cursor-pointer border-2 border-blue-400 bg-white'>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-20 shadow-md hover:bg-red-600 transition-colors' 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearPreviews();
                  }}
                />
                <Image 
                  src={includeImagePreview} 
                  alt='Include image preview' 
                  fill
                  className='object-cover'
                />
              </div>
            )}
          </label>
          <input 
            type="file" 
            id='includeimage' 
            className='hidden' 
            onChange={handleFileChange}
            accept="image/*"
            disabled={loading || balance < toolCost}
          />
        </div>

        {/* Credit Info and Clear Form */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            <Coins className="h-4 w-4 inline mr-1 text-yellow-500" />
            Balance: <span className="font-semibold">{balance}</span> credits
            {balance < toolCost && (
              <span className="ml-2 text-xs text-red-500">(Need {toolCost - balance} more)</span>
            )}
          </div>
          
          {(userInput || includeImagePreview) && (
            <button
              onClick={() => {
                setUserInput('');
                clearPreviews();
                setOutputPostImage('');
              }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors hover:underline"
            >
              Clear Form
            </button>
          )}
        </div>
      </div>
      
      <SocialPostList refreshTrigger={refreshTrigger} selectedPlatform={selectedPlatform} />
    </div>
  );
}