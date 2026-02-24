// components/dashboard/enhanced-post-list.tsx
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { Download, Eye, Sparkles, RefreshCw, Instagram, Facebook, Wand2, Clock, X, Sparkle, Split, Image as ImageIcon, ArrowLeft, ArrowRight, Maximize2, Minimize2, DownloadCloud, Archive } from 'lucide-react';
import { useSession } from '../../lib/auth-client';

type EnhancedPost = {
  id: number;
  originalImageUrl: string;
  enhancedImageUrl: string;
  platform: 'instagram' | 'facebook';
  enhancementType: string;
  userInput?: string;
  createdOn: string;
};

// Before/After Slider Component
const BeforeAfterSlider = ({ before, after }: { before: string; after: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLDivElement>(null);
  const afterImageRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
    
    if (beforeImageRef.current && afterImageRef.current) {
      beforeImageRef.current.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      afterImageRef.current.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', (e) => {
      if (isDragging) handleMove(e.clientX);
    });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', (e) => {
        if (isDragging) handleMove(e.clientX);
      });
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden rounded-lg cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* After Image (Enhanced) */}
      <div ref={afterImageRef} className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
        <Image
          src={after}
          alt="After"
          fill
          className="object-cover pointer-events-none"
        />
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Enhanced
        </div>
      </div>

      {/* Before Image (Original) */}
      <div ref={beforeImageRef} className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
        <Image
          src={before}
          alt="Before"
          fill
          className="object-cover pointer-events-none"
        />
        <div className="absolute top-2 left-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
          Original
        </div>
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <ArrowLeft className="w-3 h-3 text-gray-600" />
            <ArrowRight className="w-3 h-3 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Modal with Multiple Views
const ComparisonModal = ({ 
  post, 
  onClose 
}: { 
  post: EnhancedPost; 
  onClose: () => void;
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider' | 'split'>('slider');

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Before & After Comparison</h3>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'slider' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <Split className="h-4 w-4" />
                Slider
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'side-by-side' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'split' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <Maximize2 className="h-4 w-4" />
                Split View
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Comparison View */}
          {viewMode === 'slider' && (
            <div className="max-w-2xl mx-auto">
              <BeforeAfterSlider before={post.originalImageUrl} after={post.enhancedImageUrl} />
            </div>
          )}

          {viewMode === 'side-by-side' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Original Image
                </h4>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image 
                    src={post.originalImageUrl}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Enhanced Image
                </h4>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-200">
                  <Image 
                    src={post.enhancedImageUrl}
                    alt="Enhanced"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'split' && (
            <div className="grid grid-cols-2 gap-0 relative">
              <div className="relative aspect-square overflow-hidden">
                <Image 
                  src={post.originalImageUrl}
                  alt="Original"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">Original</span>
                </div>
              </div>
              <div className="relative aspect-square overflow-hidden">
                <Image 
                  src={post.enhancedImageUrl}
                  alt="Enhanced"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">Enhanced</span>
                </div>
              </div>
              {/* Vertical Divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white shadow-lg transform -translate-x-1/2"></div>
            </div>
          )}

          {/* Enhancement Details */}
          {post.userInput && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-purple-600">Enhancement Request:</span> {post.userInput}
              </p>
            </div>
          )}

          {/* Enhancement Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Platform</div>
              <div className="font-medium capitalize flex items-center justify-center gap-1 mt-1">
                {post.platform === 'instagram' ? (
                  <Instagram className="h-4 w-4 text-purple-600" />
                ) : (
                  <Facebook className="h-4 w-4 text-blue-600" />
                )}
                {post.platform}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Enhancement</div>
              <div className="font-medium mt-1 capitalize">{post.enhancementType}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Date</div>
              <div className="font-medium mt-1">{new Date(post.createdOn).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => downloadImage(post.originalImageUrl, `original-${post.id}.jpg`)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Original
          </button>
          <button
            onClick={() => downloadImage(post.enhancedImageUrl, `enhanced-${post.id}.jpg`)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Enhanced
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Image Card with Download Button (Fixed z-index issue)
const EnhancedImageCard = ({ 
  post, 
  onViewComparison 
}: { 
  post: EnhancedPost; 
  onViewComparison: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImprovement, setShowImprovement] = useState(false);
  const [downloading, setDownloading] = useState<'original' | 'enhanced' | null>(null);

  const downloadImage = async (imageUrl: string, type: 'original' | 'enhanced') => {
    setDownloading(type);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${post.id}-${post.platform}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? Instagram : Facebook;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'instagram' 
      ? 'from-purple-600 to-pink-600' 
      : 'from-blue-600 to-indigo-600';
  };

  const getEnhancementLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      basic: 'Basic Adjustments',
      crop: 'Cropped',
      rotate: 'Rotated',
      filters: 'Filter Applied',
      overlay: 'Text Added',
      borders: 'Borders Added',
      optimize: 'Optimized',
    };
    return labels[type] || type;
  };

  const PlatformIcon = getPlatformIcon(post.platform);
  const platformColor = getPlatformColor(post.platform);

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-purple-100"
      onMouseEnter={() => setShowImprovement(true)}
      onMouseLeave={() => setShowImprovement(false)}
    >
      <div className="relative">
        {/* Platform Badge - Higher z-index to stay above */}
        <div className={`absolute top-2 left-2 z-30 px-2 py-1 bg-gradient-to-r ${platformColor} text-white text-xs rounded-full flex items-center gap-1 shadow-lg`}>
          <PlatformIcon className="h-3 w-3" />
          <span>{post.platform}</span>
        </div>
        
        {/* Enhancement Type Badge - Higher z-index to stay above */}
        <div className="absolute top-2 right-2 z-30 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
          <Wand2 className="h-3 w-3" />
          <span>{getEnhancementLabel(post.enhancementType)}</span>
        </div>

        {/* Image with Loading State */}
        <div className="relative aspect-square bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <Image 
            src={post.enhancedImageUrl} 
            alt={post.userInput || 'Enhanced image'}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Quick Action Buttons - Highest z-index to ensure clickability */}
        <div className="absolute bottom-2 right-2 z-40 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={onViewComparison}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            title="Compare before/after"
          >
            <Split className="h-4 w-4 text-purple-600" />
          </button>
          <button 
            onClick={() => downloadImage(post.enhancedImageUrl, 'enhanced')}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            title="Download enhanced image"
            disabled={downloading !== null}
          >
            {downloading === 'enhanced' ? (
              <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-green-600" />
            )}
          </button>
        </div>

        {/* Improvement Overlay - Lower z-index so buttons are above */}
        {showImprovement && (
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4 pointer-events-none">
            <div className="text-white pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium bg-green-500 px-2 py-1 rounded-full">IMPROVED</span>
                <span className="text-xs opacity-75">{new Date(post.createdOn).toLocaleDateString()}</span>
              </div>
              <p className="text-sm line-clamp-2 mb-2">
                {post.userInput || 'Enhanced with AI tools'}
              </p>
              {/* Note: The View Comparison button here is removed since we have it in the action buttons */}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-3 bg-gradient-to-r from-white to-purple-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(post.createdOn).toLocaleDateString()}
          </span>
          <span className={`text-xs bg-gradient-to-r ${platformColor} text-white px-2 py-0.5 rounded-full`}>
            {post.enhancementType}
          </span>
        </div>
      </div>
    </div>
  );
};

function EnhancedPostList({ refreshTrigger, selectedPlatform }: { refreshTrigger?: number; selectedPlatform?: string }) {
  const [postList, setPostList] = useState<EnhancedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'instagram' | 'facebook'>('all');
  const [selectedPost, setSelectedPost] = useState<EnhancedPost | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [stats, setStats] = useState({ total: 0, instagram: 0, facebook: 0 });
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const getPostList = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      const result = await axios.get('/api/enhance-post');
      setPostList(result.data);
      
      // Calculate stats
      const insta = result.data.filter((p: EnhancedPost) => p.platform === 'instagram').length;
      const fb = result.data.filter((p: EnhancedPost) => p.platform === 'facebook').length;
      setStats({
        total: result.data.length,
        instagram: insta,
        facebook: fb
      });
      
      console.log('📋 Loaded enhanced posts:', result.data.length);
    } catch (error) {
      console.error('Error fetching enhanced posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download all images function
  const downloadAllImages = async () => {
    setDownloadingAll(true);
    try {
      const postsToDownload = filter === 'all' ? postList : postList.filter(p => p.platform === filter);
      
      for (let i = 0; i < postsToDownload.length; i++) {
        const post = postsToDownload[i];
        // Download enhanced version
        const response = await fetch(post.enhancedImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-${post.id}-${post.platform}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setDownloadingAll(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getPostList();
    }
  }, [isLoggedIn, refreshTrigger]);

  useEffect(() => {
    if (selectedPlatform && selectedPlatform !== filter) {
      setFilter(selectedPlatform as 'all' | 'instagram' | 'facebook');
    }
  }, [selectedPlatform]);

  const filteredPosts = filter === 'all' 
    ? postList 
    : postList.filter(post => post.platform === filter);

  if (!isLoggedIn) {
    return (
      <div className='mt-10 px-4'>
        <div className='text-center py-12 bg-white rounded-2xl shadow-lg border border-purple-100'>
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Login to view your enhanced posts</h3>
          <p className="text-gray-500 mt-1">Please login to see your previously enhanced images.</p>
          <Link href="/auth">
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 px-4'>
      {/* Comparison Modal */}
      {showComparison && selectedPost && (
        <ComparisonModal 
          post={selectedPost} 
          onClose={() => setShowComparison(false)} 
        />
      )}

      {/* Header with Stats and Download Options */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border border-purple-100'>
        <div className='flex items-center gap-2'>
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <Wand2 className='h-5 w-5 text-purple-600' />
          </div>
          <h2 className='font-bold text-xl text-gray-800'>
            Your Enhanced Posts
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Badge */}
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
            <span className="text-sm text-purple-700">
              📸 {stats.instagram} IG
            </span>
            <span className="text-sm text-blue-700">
              👍 {stats.facebook} FB
            </span>
          </div>

          {/* Download All Button */}
          {filteredPosts.length > 0 && (
            <div className="relative group">
              <button
                onClick={downloadAllImages}
                disabled={downloadingAll}
                className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download all images"
              >
                {downloadingAll ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-4 w-4" />
                    <span>Download All ({filteredPosts.length})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('instagram')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'instagram' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Instagram className="h-3 w-3" />
              IG ({stats.instagram})
            </button>
            <button
              onClick={() => setFilter('facebook')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'facebook' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Facebook className="h-3 w-3" />
              FB ({stats.facebook})
            </button>
          </div>
          
          <button 
            onClick={getPostList}
            className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {loading ? 
          [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col space-y-3 bg-white p-3 rounded-xl shadow-lg border border-purple-100">
              <Skeleton className="h-40 w-full rounded-lg bg-purple-100" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-purple-100" />
                <Skeleton className="h-4 w-3/4 bg-purple-100" />
              </div>
            </div>
          )) : 
          filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <EnhancedImageCard
                key={post.id}
                post={post}
                onViewComparison={() => {
                  setSelectedPost(post);
                  setShowComparison(true);
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg border border-purple-100">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                <Wand2 className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No enhanced posts yet</h3>
              <p className="text-gray-500">Upload and enhance your first image to see it here!</p>
            </div>
          )
        }
      </div>

      {/* Quick Stats Summary */}
      {filteredPosts.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Enhancement Summary</h4>
            <button
              onClick={downloadAllImages}
              disabled={downloadingAll}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Archive className="h-3 w-3" />
              Download All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredPosts.length}</div>
              <div className="text-xs text-gray-500">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {filteredPosts.filter(p => p.enhancementType === 'basic').length}
              </div>
              <div className="text-xs text-gray-500">Basic Adjustments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredPosts.filter(p => p.enhancementType === 'filters').length}
              </div>
              <div className="text-xs text-gray-500">Filters Applied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredPosts.filter(p => p.enhancementType === 'optimize').length}
              </div>
              <div className="text-xs text-gray-500">Optimized</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPostList;