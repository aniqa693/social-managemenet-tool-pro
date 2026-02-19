// components/social-post-list.tsx
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, Eye, Sparkles, RefreshCw, Instagram, Facebook } from 'lucide-react';
import { useSession } from '../../lib/auth-client';

type SocialPost = {
  id: number;
  postUrl: string;
  includeImage: string;
  userInput: string;
  platform: 'instagram' | 'facebook';
  aspectRatio: string;
  createdOn: string;
};

function SocialPostList({ refreshTrigger, selectedPlatform }: { refreshTrigger?: number; selectedPlatform?: string }) {
  const [postList, setPostList] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'instagram' | 'facebook'>('all');
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const getPostList = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      const result = await axios.get('/api/generate-social-post');
      setPostList(result.data);
      console.log('📋 Loaded social posts:', result.data.length);
    } catch (error) {
      console.error('Error fetching social posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getPostList();
    }
  }, [isLoggedIn, refreshTrigger]);

  const downloadPost = async (postUrl: string, id: number, platform: string) => {
    try {
      const response = await fetch(postUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${platform}-post-${id}.jpg`;
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

  const filteredPosts = filter === 'all' 
    ? postList 
    : postList.filter(post => post.platform === filter);

  if (!isLoggedIn) {
    return (
      <div className='mt-10 px-4'>
        <div className='text-center py-12 bg-white rounded-2xl shadow-lg border border-blue-100'>
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Login to view your posts</h3>
          <p className="text-gray-500 mt-1">Please login to see your previously generated social media posts.</p>
          <Link href="/auth">
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 px-4'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border border-blue-100'>
        <div className='flex items-center gap-2'>
          <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <Sparkles className='h-5 w-5 text-blue-600' />
          </div>
          <h2 className='font-bold text-xl text-gray-800'>
            Your Social Media Posts
          </h2>
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
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
            className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {loading ? 
          [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col space-y-3 bg-white p-3 rounded-xl shadow-lg border border-blue-100">
              <Skeleton className="h-40 w-full rounded-lg bg-blue-100" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-blue-100" />
                <Skeleton className="h-4 w-3/4 bg-blue-100" />
              </div>
            </div>
          )) : 
          filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const PlatformIcon = getPlatformIcon(post.platform);
              const platformColor = getPlatformColor(post.platform);
              
              return (
                <div key={post.id} className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-blue-100">
                  <div className="relative">
                    <div className={`absolute top-2 left-2 z-10 px-2 py-1 bg-gradient-to-r ${platformColor} text-white text-xs rounded-full flex items-center gap-1 shadow-lg`}>
                      <PlatformIcon className="h-3 w-3" />
                      <span>{post.platform}</span>
                      <span className="bg-white/20 px-1 rounded">{post.aspectRatio}</span>
                    </div>
                    
                    <div className={`relative ${
                      post.aspectRatio === '1:1' ? 'aspect-square' :
                      post.aspectRatio === '4:5' ? 'aspect-[4/5]' :
                      post.aspectRatio === '16:9' ? 'aspect-video' :
                      'aspect-[9/16]'
                    }`}>
                      <Image 
                        src={post.postUrl} 
                        alt={post.userInput || 'AI generated social post'}
                        fill
                        className='object-cover'
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          console.error('Image failed to load:', post.postUrl);
                        }}
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Link 
                          href={post.postUrl} 
                          target='_blank'
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="View full size"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </Link>
                        <button 
                          onClick={() => downloadPost(post.postUrl, post.id, post.platform)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="Download post"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-white to-blue-50">
                    <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                      {post.userInput || 'AI generated social post'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdOn).toLocaleDateString()}
                      </span>
                      <span className={`text-xs bg-gradient-to-r ${platformColor} text-white px-2 py-0.5 rounded-full`}>
                        {post.aspectRatio}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg border border-blue-100">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No posts yet</h3>
              <p className="text-gray-500">Generate your first social media post to see it here!</p>
            </div>
          )
        }
      </div>
    </div>
  );
}

export default SocialPostList;