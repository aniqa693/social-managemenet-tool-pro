'use client';

import { Upload, User, ImagePlus, X, Loader2, Download, Sparkles, Coins, CreditCard, AlertCircle, PowerOff, Power } from 'lucide-react';
import { useState, useRef, useEffect } from 'react'; 
import Image from 'next/image';
import axios from 'axios';
import ThumbnailList from '../../../../../../components/thumbnaill';
import Link from 'next/link';
import { useToast } from '../../../../../../hooks/use-toast';
import { useSession } from '../../../../../../lib/auth-client';
import { useCredits } from '../../../../../../useCredits';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ThumbnailGeneratorPage() {
  const [inputUser, setInputUser] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<any>();
  const [includeFace, setIncludeFace] = useState<any>();
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>();
  const [includeFacePreview, setIncludeFacePreview] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [outputThumbnailImage, setOutputThumbnailImage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  // NEW: Tool enabled/disabled state
  const [toolEnabled, setToolEnabled] = useState<boolean>(true);
  const [checkingToolStatus, setCheckingToolStatus] = useState<boolean>(true);
  const [toolDetails, setToolDetails] = useState<any>(null);
  
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

  // NEW: Check if tool is enabled for this user
  useEffect(() => {
    const checkToolStatus = async () => {
      if (!userId) {
        setCheckingToolStatus(false);
        setToolEnabled(true); // Default to enabled for unauthenticated
        return;
      }

      try {
        setCheckingToolStatus(true);
        console.log('🔍 Checking tool status for user:', userId, 'tool: thumbnail_generator');
        
        const response = await fetch(`/api/tools/status?userId=${userId}&toolName=thumbnail_generator`);
        const data = await response.json();

        if (response.ok) {
          setToolEnabled(data.enabled);
          setToolDetails(data);
          console.log('✅ Tool status:', { enabled: data.enabled, source: data.source });
          
          if (!data.enabled) {
            console.log('⚠️ Thumbnail generator is disabled for this user');
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

  // Check if user can afford (set cost to 3 credits per generation)
  const canAfford = isLoggedIn ? (balance >= toolCost) : false;

  // Fetch tool cost on mount
  useEffect(() => {
    fetchToolCost('thumbnail_generator');
  }, [fetchToolCost]);

  // Refresh balance when user logs in
  useEffect(() => {
    if (userId) {
      refreshBalance();
    }
  }, [userId, refreshBalance]);

  const handleFileChange = (field: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clean up previous preview
    if (field === 'referenceimage' && referenceImagePreview) {
      URL.revokeObjectURL(referenceImagePreview);
    } else if (field === 'includeimage' && includeFacePreview) {
      URL.revokeObjectURL(includeFacePreview);
    }
    
    const previewUrl = URL.createObjectURL(file);
    if (field === 'referenceimage') {
      setReferenceImage(file);
      setReferenceImagePreview(previewUrl);
    } else if (field === 'includeimage') {
      setIncludeFace(file);
      setIncludeFacePreview(previewUrl);
    }
  }

  const clearPreviews = () => {
    if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
    if (includeFacePreview) URL.revokeObjectURL(includeFacePreview);
    setReferenceImagePreview(undefined);
    setIncludeFacePreview(undefined);
    setReferenceImage(null);
    setIncludeFace(null);
  };

  const handleSubmit = async () => {
    // NEW: Check if tool is disabled by admin
    if (!toolEnabled) {
      toast({
        title: "Tool Disabled",
        description: "This tool has been disabled by the administrator. Please contact support for assistance.",
        variant: "destructive",
      });
      return;
    }

    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please login to generate thumbnails",
        variant: "destructive",
      });
      return;
    }

    if (!inputUser && !referenceImage && !includeFace) {
      toast({
        title: "Input required",
        description: "Please provide a description or upload images",
        variant: "destructive",
      });
      return;
    }

    // Credit check
    if (!canAfford) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${toolCost} credits to generate a thumbnail. You have ${balance} credits.`,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    if (inputUser) formData.append('description', inputUser);
    if (referenceImage) formData.append('referenceImage', referenceImage);
    if (includeFace) formData.append('includeFace', includeFace);
    formData.append('userId', userId || '');
    formData.append('userEmail', userEmail || '');
    
    try {
      const result = await axios.post('/api/generate-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const thumbnailUrl = result.data.thumbnailUrl;
      setOutputThumbnailImage(thumbnailUrl);
      
      // Refresh balance after credit deduction
      await refreshBalance();
      
      // Clear the form
      setInputUser('');
      clearPreviews();
      
      // Show success message with credit info
      const remainingCredits = result.data.creditInfo?.remainingCredits || balance - toolCost;
      toast({
        title: "Success",
        description: `Thumbnail generated! Used ${toolCost} credits. Remaining: ${remainingCredits}`,
      });
      
      // Trigger refresh of thumbnail list
      setRefreshTrigger(prev => prev + 1);
      
    } catch (e: any) {
      console.error('Generation error:', e);
      
      // Handle tool disabled errors
      if (e.response?.status === 403 && e.response?.data?.error === 'tool_disabled') {
        setToolEnabled(false);
        toast({
          title: "Tool Disabled",
          description: e.response?.data?.message || "This tool has been disabled by the administrator.",
          variant: "destructive",
        });
      }
      // Handle credit-specific errors
      else if (e.response?.status === 403) {
        toast({
          title: "Insufficient Credits",
          description: e.response?.data?.message || "You don't have enough credits to generate a thumbnail.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: e.response?.data?.error || "Failed to generate thumbnail. Please try again.",
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

  const downloadThumbnail = async () => {
    if (!outputThumbnailImage) {
      toast({
        title: "Error",
        description: "No thumbnail to download",
        variant: "destructive",
      });
      return;
    }
    
    // NEW: Check if tool is disabled
    if (!toolEnabled) {
      toast({
        title: "Tool Disabled",
        description: "Download unavailable - tool disabled by administrator",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(outputThumbnailImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-thumbnail-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Thumbnail download started",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download thumbnail",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading || checkingToolStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 px-4 py-8 transition-colors duration-300">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-700 bg-clip-text text-transparent">
            AI Thumbnail Generator
          </h1>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Turn any video into a click magnet with thumbnails that grab attention and drive views.
          </p>
          
          {/* Tool Status Indicator */}
          {!toolEnabled && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full border border-red-300">
              <PowerOff className="h-4 w-4" />
              <span className="text-sm font-medium">Tool Disabled by Admin</span>
            </div>
          )}
          
          {/* Credit Info Bar */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 text-sm shadow-sm">
              <Coins className="h-4 w-4 mr-1 inline" />
              Cost: {toolCost} credits per thumbnail
            </Badge>
            
            {/* Tool Status Badge */}
            <Badge className={`px-4 py-2 text-sm shadow-sm ${toolEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
            
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm shadow-sm">
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Your balance: {balance} credits
              {balance < toolCost && (
                <span className="ml-2 text-xs text-red-600 font-bold">(Low)</span>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-pink-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-700">
              Logged in as: <span className="font-semibold text-pink-600">{userEmail}</span>
            </p>
          </div>
        </div>

        {/* Tool Disabled Warning */}
        {!toolEnabled && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 mb-4">
            <PowerOff className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-red-700 font-medium">Tool Disabled by Administrator</p>
              <p className="text-sm text-red-600">
                The thumbnail generator has been disabled. Please contact support if you believe this is an error.
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
        {balance < toolCost && toolEnabled && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-red-700 font-medium">Insufficient Credits</p>
              <p className="text-sm text-red-600">
                You need {toolCost} credits to generate a thumbnail. You have {balance} credits.
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

      {/* Thumbnail Preview Section */}
      <div className="flex justify-center items-center max-w-4xl mx-auto mb-8">
        {loading ? (
          <div className="h-[250px] bg-white border-2 border-pink-200 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-xl">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <h2 className="text-lg font-medium mt-4 text-gray-800">Generating your thumbnail...</h2>
            <p className="text-sm text-gray-500 mt-1">This will cost {toolCost} credits</p>
          </div>
        ) : (
          <div className="relative group w-full max-w-2xl">
            {outputThumbnailImage ? (
              <>
                <div className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-white bg-white">
                  <Image 
                    src={outputThumbnailImage} 
                    alt='AI generated thumbnail'
                    width={600} 
                    height={400} 
                    className='aspect-video w-full object-cover'
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <button
                      onClick={downloadThumbnail}
                      disabled={!toolEnabled}
                      className={`transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full font-medium shadow-lg hover:bg-gray-50 hover:scale-105 active:scale-95 ${
                        !toolEnabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Download className="h-5 w-5 text-pink-600" />
                      Download
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[250px] bg-white border-2 border-dashed border-pink-300 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-lg">
                <div className="p-3 bg-pink-100 rounded-full mb-4">
                  <ImagePlus className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 text-center">Your thumbnail will appear here</h3>
                <p className="text-sm text-gray-500 text-center mt-1">Enter a description or upload images to generate a thumbnail</p>
                <p className="text-xs text-gray-400 mt-2">
                  Cost: {toolCost} credits per generation
                </p>
                {!toolEnabled && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Tool disabled by administrator
                  </p>
                )}
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
            value={inputUser}
            placeholder="Describe your video content or enter your video title..."
            onChange={(e) => setInputUser(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || balance < toolCost || !toolEnabled}
            className={`w-full px-5 py-4 pr-14 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-base text-gray-800 placeholder-gray-400 resize-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              !toolEnabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-pink-200'
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || (!inputUser && !referenceImage && !includeFace) || balance < toolCost || !toolEnabled}
            className={`absolute right-3 bottom-3 text-white p-3 cursor-pointer rounded-full shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              toolEnabled 
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700' 
                : 'bg-gray-400'
            }`}
            title={!toolEnabled ? "Tool disabled" : "Generate thumbnail"}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <label htmlFor="referenceimage" className="flex-1">
            {!referenceImagePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed rounded-xl transition-all duration-200 w-full group relative overflow-hidden ${
                loading || balance < toolCost || !toolEnabled 
                  ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                  : 'border-pink-300 hover:border-pink-500 text-gray-700 hover:shadow-md hover:scale-[1.02] active:scale-100 cursor-pointer bg-white'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-rose-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className={`p-2 rounded-full transition-colors z-10 ${
                  loading || balance < toolCost || !toolEnabled 
                    ? 'bg-gray-200' 
                    : 'bg-pink-100 group-hover:bg-pink-200'
                }`}>
                  <ImagePlus className={`w-5 h-5 ${
                    loading || balance < toolCost || !toolEnabled 
                      ? 'text-gray-400' 
                      : 'text-pink-600'
                  }`} />
                </div>
                <span className={`font-medium z-10 ${
                  loading || balance < toolCost || !toolEnabled ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {!toolEnabled ? 'Tool Disabled' : 'Reference Image'}
                </span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden group cursor-pointer border-2 border-pink-400 bg-white'>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-20 shadow-md hover:bg-red-600 transition-colors' 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
                    setReferenceImagePreview(undefined);
                    setReferenceImage(null);
                  }}
                />
                <Image 
                  src={referenceImagePreview} 
                  alt='referenceImagepreview' 
                  fill
                  className='object-cover'
                />
              </div>
            )}
          </label>
          <input 
            type="file" 
            id='referenceimage' 
            className='hidden' 
            onChange={(e) => handleFileChange('referenceimage', e)}
            disabled={loading || balance < toolCost || !toolEnabled}
          />
          
          <label htmlFor="includeface" className="flex-1">
            {!includeFacePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed rounded-xl transition-all duration-200 w-full group relative overflow-hidden ${
                loading || balance < toolCost || !toolEnabled 
                  ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                  : 'border-pink-300 hover:border-pink-500 text-gray-700 hover:shadow-md hover:scale-[1.02] active:scale-100 cursor-pointer bg-white'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-rose-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className={`p-2 rounded-full transition-colors z-10 ${
                  loading || balance < toolCost || !toolEnabled 
                    ? 'bg-gray-200' 
                    : 'bg-pink-100 group-hover:bg-pink-200'
                }`}>
                  <User className={`w-5 h-5 ${
                    loading || balance < toolCost || !toolEnabled 
                      ? 'text-gray-400' 
                      : 'text-pink-600'
                  }`} />
                </div>
                <span className={`font-medium z-10 ${
                  loading || balance < toolCost || !toolEnabled ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {!toolEnabled ? 'Tool Disabled' : 'Include Face'}
                </span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden group cursor-pointer border-2 border-pink-400 bg-white'>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-20 shadow-md hover:bg-red-600 transition-colors' 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (includeFacePreview) URL.revokeObjectURL(includeFacePreview);
                    setIncludeFacePreview(undefined);
                    setIncludeFace(null);
                  }}
                />
                <Image 
                  src={includeFacePreview} 
                  alt='includeFaceimagepreview' 
                  fill
                  className='object-cover'
                />
              </div>
            )}
          </label>
          <input 
            type="file" 
            id='includeface' 
            className='hidden' 
            onChange={(e) => handleFileChange('includeimage', e)}
            disabled={loading || balance < toolCost || !toolEnabled}
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
            {!toolEnabled && (
              <span className="ml-2 text-xs text-red-500">(Tool Disabled)</span>
            )}
          </div>
          
          {(inputUser || referenceImagePreview || includeFacePreview) && (
            <button
              onClick={() => {
                setInputUser('');
                clearPreviews();
                setOutputThumbnailImage('');
              }}
              disabled={!toolEnabled}
              className={`px-4 py-2 text-sm transition-colors hover:underline ${
                !toolEnabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Clear Form
            </button>
          )}
        </div>
      </div>
      
      <ThumbnailList refreshTrigger={refreshTrigger} />
    </div>
  );
}