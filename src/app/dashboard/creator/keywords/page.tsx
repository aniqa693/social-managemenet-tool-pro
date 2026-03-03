'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Sparkles, Copy, Check, Download, 
  Search, Hash, Instagram, Facebook, Youtube,
  PowerOff, Coins, AlertCircle, Wand2,
  ChevronDown, ChevronRight, Filter, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useSession } from '../../../../../lib/auth-client';
import { useCredits } from '../../../../../useCredits';

// Define types
type Platform = 'instagram' | 'facebook' | 'youtube';

interface PlatformKeywords {
  platform: Platform;
  keywords: string[];
  totalCount: number;
}

interface PlatformOption {
  value: Platform;
  label: string;
  icon: React.ElementType;
  color: string;
  placeholder: string;
}

interface Stats {
  totalKeywords: number;
  platformsAnalyzed: number;
  keywordsByPlatform: { platform: string; count: number }[];
}

interface CreditInfo {
  deducted: boolean;
  amount: number;
  remainingCredits: number;
}

interface KeywordResponse {
  keywords: string[];
  platformKeywords: PlatformKeywords[];
  stats: Stats;
  creditInfo?: CreditInfo;
}

export default function KeywordsOnlyPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const isLoggedIn = !!user;
  const userEmail = user?.email || '';
  const userId = user?.id || '';

  // State
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram']);
  const [instagramUrl, setInstagramUrl] = useState<string>('');
  const [facebookQuery, setFacebookQuery] = useState<string>('');
  const [youtubeQuery, setYoutubeQuery] = useState<string>('');
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [platformKeywords, setPlatformKeywords] = useState<PlatformKeywords[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Tool enabled/disabled state
  const [toolEnabled, setToolEnabled] = useState<boolean>(true);
  const [checkingToolStatus, setCheckingToolStatus] = useState<boolean>(true);

  // Credit management
  const { balance, refreshBalance, toolCost, fetchToolCost } = useCredits(userId);
  const canAfford = isLoggedIn ? (balance >= toolCost) : false;

  // Platform options with proper typing
  const platformOptions: PlatformOption[] = [
    { 
      value: 'instagram', 
      label: 'Instagram', 
      icon: Instagram, 
      color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
      placeholder: 'Enter Instagram reel URL' 
    },
    { 
      value: 'facebook', 
      label: 'Facebook', 
      icon: Facebook, 
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
      placeholder: 'Enter search query' 
    },
    { 
      value: 'youtube', 
      label: 'YouTube', 
      icon: Youtube, 
      color: 'bg-gradient-to-r from-red-500 to-rose-500', 
      placeholder: 'Enter search query' 
    },
  ];

  // Check tool status
  useEffect(() => {
    const checkToolStatus = async () => {
      if (!userId) {
        setCheckingToolStatus(false);
        setToolEnabled(true);
        return;
      }
      try {
        setCheckingToolStatus(true);
        const response = await fetch(`/api/tools/status?userId=${userId}&toolName=keyword_only`);
        const data = await response.json();
        if (response.ok) setToolEnabled(data.enabled);
        else setToolEnabled(true);
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
    fetchToolCost('keyword_only');
  }, [fetchToolCost]);

  useEffect(() => {
    if (user) refreshBalance();
  }, [user, refreshBalance]);

  // Toggle platform selection
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p: Platform) => p !== platform));
        if (activePlatform === platform) {
          setActivePlatform(selectedPlatforms[0] as Platform);
        }
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Extract keywords
  const extractKeywords = async () => {
    if (!toolEnabled && isLoggedIn) {
      toast.error('Tool disabled by administrator');
      return;
    }

    // Validate inputs
    if (selectedPlatforms.includes('instagram') && !instagramUrl) {
      toast.error('Please enter Instagram URL');
      return;
    }
    if (selectedPlatforms.includes('facebook') && !facebookQuery) {
      toast.error('Please enter Facebook query');
      return;
    }
    if (selectedPlatforms.includes('youtube') && !youtubeQuery) {
      toast.error('Please enter YouTube query');
      return;
    }

    if (isLoggedIn && !canAfford) {
      toast.error(`Need ${toolCost} credits. You have ${balance}`);
      return;
    }

    setLoading(true);
    setKeywords([]);
    setPlatformKeywords([]);
    setStats(null);

    const loadingToast = toast.loading('🔑 Extracting keywords...');

    try {
      const response = await fetch('/api/social-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          instagramUrl,
          facebookQuery,
          youtubeQuery,
          userEmail,
          userId
        }),
      });

      const data: KeywordResponse = await response.json();

      if (!response.ok) {
        if (response.status === 403 && (data as any).error?.includes('disabled')) {
          setToolEnabled(false);
          throw new Error('Tool disabled by administrator');
        }
        throw new Error((data as any).error || 'Failed to extract keywords');
      }

      setKeywords(data.keywords || []);
      setPlatformKeywords(data.platformKeywords || []);
      setStats(data.stats || null);
      
      if (data.platformKeywords?.length > 0) {
        setActivePlatform(data.platformKeywords[0].platform);
      }
      
      if (data.creditInfo?.deducted && user) {
        await refreshBalance();
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Extracted ${data.keywords?.length || 0} keywords!`);

    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Copy all keywords
  const copyAllKeywords = async () => {
    const text = keywords.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('All keywords copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Download keywords
  const downloadKeywords = () => {
    const content = keywords.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Keywords downloaded!');
  };

  // Filter keywords
  const filteredKeywords = keywords.filter((k: string) => 
    k.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current platform keywords
  const currentPlatformKeywords = platformKeywords.find((p: PlatformKeywords) => p.platform === activePlatform)?.keywords || [];

  if (sessionLoading || checkingToolStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                Keyword Extractor
              </span>
            </h1>
            <p className="text-gray-600 mt-2">
              Extract pure keywords from Instagram, Facebook & YouTube - no descriptions, no hashtags, just keywords
            </p>
          </div>
          
          {/* Credit display */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{balance}</span>
            <Badge variant="outline" className="ml-2">{toolCost} credits</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Platforms</CardTitle>
                <CardDescription>Choose which platforms to extract keywords from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {platformOptions.map((platform: PlatformOption) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.value);
                    return (
                      <button
                        key={platform.value}
                        onClick={() => togglePlatform(platform.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          isSelected 
                            ? `${platform.color} text-white border-transparent shadow-md scale-105` 
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs">{platform.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input fields */}
                {selectedPlatforms.includes('instagram') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                    <Input
                      placeholder="https://instagram.com/p/..."
                      value={instagramUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstagramUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedPlatforms.includes('facebook') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Facebook Search</label>
                    <Input
                      placeholder="e.g., pizza, cars, jobs"
                      value={facebookQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFacebookQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedPlatforms.includes('youtube') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">YouTube Search</label>
                    <Input
                      placeholder="e.g., tutorial, review"
                      value={youtubeQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <Button
                  onClick={extractKeywords}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  {loading ? 'Extracting...' : 'Extract Keywords'}
                </Button>

                {stats && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium">Total: {stats.totalKeywords} keywords</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {stats.keywordsByPlatform?.map((p: { platform: string; count: number }) => (
                        <div key={p.platform}>{p.platform}: {p.count}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Keywords Display */}
          <div className="lg:col-span-2">
            {keywords.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Extracted Keywords</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyAllKeywords}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadKeywords}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Platform tabs */}
                  {platformKeywords.length > 1 && (
                    <div className="flex gap-2 mt-2">
                      {platformKeywords.map((p: PlatformKeywords) => (
                        <Button
                          key={p.platform}
                          variant={activePlatform === p.platform ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActivePlatform(p.platform)}
                          className={activePlatform === p.platform ? 'bg-purple-600' : ''}
                        >
                          {p.platform} ({p.totalCount})
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Search */}
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Filter keywords..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-2.5"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Keywords grid */}
                  <div className="flex flex-wrap gap-2 max-h-[500px] overflow-y-auto p-1">
                    {(searchTerm ? filteredKeywords : (activePlatform ? currentPlatformKeywords : keywords)).map((keyword: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(keyword);
                          toast.success(`Copied: ${keyword}`);
                        }}
                      >
                        {keyword}
                        <Copy className="h-3 w-3 ml-2 opacity-50" />
                      </Badge>
                    ))}
                  </div>

                  {filteredKeywords.length === 0 && searchTerm && (
                    <p className="text-center text-gray-500 py-8">No keywords match your search</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Hash className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Keywords Yet</h3>
                  <p className="text-gray-500">
                    Select platforms and enter your queries to extract keywords
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}