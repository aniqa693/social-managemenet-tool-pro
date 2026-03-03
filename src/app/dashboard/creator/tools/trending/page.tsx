'use client';

import { useState } from 'react';
import VideoTabs from '../../../../../../components/trends/VideoTabs';
import SearchBar from '../../../../../../components/trends/SearchBar';
import YouTubeVideoCard from '../../../../../../components/trends/YouTubeVideoCard';
import InstagramVideoCard from '../../../../../../components/trends/InstagramVideoCard';
import FacebookVideoCard from '../../../../../../components/trends/FacebookVideoCard';
import RecommendationInput from '../../../../../../components/trends/RecommendationInput';

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('youtube');
  const [currentQuery, setCurrentQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setVideos([]);
    setCurrentQuery('');
    setError(null);
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(query);
    
    try {
      const response = await fetch(`/api/${activeTab}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }
      
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationClick = (query: string) => {
    handleSearch(query);
  };

  const renderVideoCard = (video: any, index: number) => {
    switch (activeTab) {
      case 'youtube':
        return <YouTubeVideoCard key={video.videoId || index} video={video} />;
      case 'instagram':
        return <InstagramVideoCard key={video.videoId || index} video={video} />;
      case 'facebook':
        return <FacebookVideoCard key={video.videoId || index} video={video} />;
      default:
        return null;
    }
  };

  const getPlatformColor = () => {
    switch (activeTab) {
      case 'youtube': return 'from-red-500 to-red-600';
      case 'instagram': return 'from-purple-500 via-pink-500 to-orange-500';
      case 'facebook': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-4">
          Trending Videos Finder
        </h1>
        <p className="text-gray-400 text-lg">
          Discover the hottest videos from YouTube, Instagram, and Facebook
        </p>
      </div>

      <VideoTabs activeTab={activeTab} onTabChange={handleTabChange}>
        <SearchBar 
          onSearch={handleSearch}
          platform={activeTab}
          loading={loading}
        />
        
        {videos.length === 0 && !loading && !currentQuery && (
          <RecommendationInput 
            onSelect={handleRecommendationClick}
            platform={activeTab}
          />
        )}
        
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin bg-gradient-to-r ${getPlatformColor()}`}></div>
          </div>
        ) : (
          <>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {videos.map((video, index) => renderVideoCard(video, index))}
              </div>
            ) : (
              !loading && currentQuery && (
                <div className="text-center text-gray-400 mt-12 p-8 bg-gray-800/50 rounded-lg">
                  <p className="text-xl mb-2">No videos found for &quot;{currentQuery}&quot;</p>
                  <p className="text-gray-500">Try a different search term or select from suggestions below</p>
                  {videos.length === 0 && (
                    <RecommendationInput 
                      onSelect={handleRecommendationClick}
                      platform={activeTab}
                    />
                  )}
                </div>
              )
            )}
          </>
        )}
      </VideoTabs>
    </div>
  );
}