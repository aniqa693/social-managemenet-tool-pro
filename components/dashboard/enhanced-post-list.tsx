// components/dashboard/enhanced-post-list.tsx
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, Eye, Sparkles, RefreshCw, Instagram, Facebook, Wand2, Clock, X, Sparkle } from 'lucide-react';
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

function EnhancedPostList({ refreshTrigger, selectedPlatform }: { refreshTrigger?: number; selectedPlatform?: string }) {
  const [postList, setPostList] = useState<EnhancedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'instagram' | 'facebook'>('all');
  const [selectedPost, setSelectedPost] = useState<EnhancedPost | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const getPostList = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      const result = await axios.get('/api/enhance-post');
      setPostList(result.data);
      console.log('📋 Loaded enhanced posts:', result.data.length);
    } catch (error) {
      console.error('Error fetching enhanced posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getPostList();
    }
  }, [isLoggedIn, refreshTrigger]);

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
      auto: 'Auto Enhanced',
      'ai-modify': 'AI Modified',
      brightness: 'Brightness Adjusted',
      color: 'Color Enhanced',
      composition: 'Composition Fixed',
      sharpen: 'Sharpened',
      background: 'BG Removed',
      filters: 'Filter Applied',
      'text-overlay': 'Text Added'
    };
    return labels[type] || type;
  };

  const getEnhancementIcon = (type: string) => {
    if (type === 'ai-modify') return Sparkle;
    return Wand2;
  };

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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Before & After</h3>
              <button 
                onClick={() => setShowComparison(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Original</h4>
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image 
                    src={selectedPost.originalImageUrl}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Enhanced</h4>
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image 
                    src={selectedPost.enhancedImageUrl}
                    alt="Enhanced"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            {selectedPost.userInput && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                  <span className="font-semibold">User request:</span> {selectedPost.userInput}
                </p>
              </div>
            )}
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => downloadImage(selectedPost.originalImageUrl, `original-${selectedPost.id}.jpg`)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Download Original
              </button>
              <button
                onClick={() => downloadImage(selectedPost.enhancedImageUrl, `enhanced-${selectedPost.id}.jpg`)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                Download Enhanced
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border border-purple-100'>
        <div className='flex items-center gap-2'>
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <Wand2 className='h-5 w-5 text-purple-600' />
          </div>
          <h2 className='font-bold text-xl text-gray-800'>
            Your Enhanced Posts
          </h2>
          <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full ml-2">
            {filteredPosts.length}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('instagram')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'instagram' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Instagram className="h-3 w-3" />
              IG
            </button>
            <button
              onClick={() => setFilter('facebook')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'facebook' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Facebook className="h-3 w-3" />
              FB
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
            filteredPosts.map((post) => {
              const PlatformIcon = getPlatformIcon(post.platform);
              const platformColor = getPlatformColor(post.platform);
              const EnhancementIcon = getEnhancementIcon(post.enhancementType);
              
              return (
                <div key={post.id} className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-purple-100">
                  <div className="relative">
                    <div className={`absolute top-2 left-2 z-10 px-2 py-1 bg-gradient-to-r ${platformColor} text-white text-xs rounded-full flex items-center gap-1 shadow-lg`}>
                      <PlatformIcon className="h-3 w-3" />
                      <span>{post.platform}</span>
                    </div>
                    
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1">
                      <EnhancementIcon className="h-3 w-3" />
                      <span>{getEnhancementLabel(post.enhancementType)}</span>
                    </div>
                    
                    <div className="relative aspect-square">
                      <Image 
                        src={post.enhancedImageUrl} 
                        alt={post.userInput || 'Enhanced image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <button 
                          onClick={() => {
                            setSelectedPost(post);
                            setShowComparison(true);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="View comparison"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </button>
                        <button 
                          onClick={() => downloadImage(post.enhancedImageUrl, `enhanced-${post.id}.jpg`)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="Download enhanced"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-white to-purple-50">
                    <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                      {post.userInput || `Enhanced ${post.platform} post`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
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
            })
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
    </div>
  );
}

export default EnhancedPostList;