"use client";

import { useState, useEffect } from "react";
import { 
  Youtube, Instagram, Facebook, Search, TrendingUp, 
  Music, Hash, Flame, Heart, MessageCircle, Eye, Play,
  ChevronDown
} from "lucide-react";

interface Video {
  videoId: string;
  platform: string;
  title?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  author?: string;
  authorAvatar?: string;
  hashtags?: string[];
  audioId?: string;
  audioTitle?: string;
  duration?: number;
  engagementRate?: number;
  trendScore?: number;
  viralPotential?: number;
  likeRate?: number;
  commentRate?: number;
  shareRate?: number;
  viewsGrowth?: number;
  likesGrowth?: number;
  commentsGrowth?: number;
  viewsPerHour?: number;
}

interface Topic {
  id: number;
  name: string;
  type: string;
  videoCount: number;
  growthRate: number;
}

interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

export default function VideoFinder() {
  const [activePlatform, setActivePlatform] = useState<string>('youtube');
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof Video>('trendScore');

  const platforms: Platform[] = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'red' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'blue' },
  ];

  useEffect(() => {
    fetchVideos();
    fetchTopics();
  }, [activePlatform]);

  const fetchVideos = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trends/${activePlatform}?limit=50`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (): Promise<void> => {
    try {
      // For demo, use mock topics
      setTopics([
        { id: 1, name: 'AI Tools', type: 'trending', videoCount: 234, growthRate: 2.5 },
        { id: 2, name: 'Gym Transformation', type: 'trending', videoCount: 567, growthRate: 1.8 },
        { id: 3, name: 'Ramadan Recipes', type: 'trending', videoCount: 189, growthRate: 3.2 },
        { id: 4, name: 'Viral Sound #1', type: 'music', videoCount: 892, growthRate: 4.1 },
        { id: 5, name: 'Motivation', type: 'hashtag', videoCount: 445, growthRate: 1.2 },
        { id: 6, name: 'Tech Reviews', type: 'trending', videoCount: 167, growthRate: 0.9 },
      ]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatNumber = (num: number = 0): string => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const getScoreColor = (score: number = 0): string => {
    if (score >= 80) return 'text-purple-400';
    if (score >= 60) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getScoreBg = (score: number = 0): string => {
    if (score >= 80) return 'bg-purple-500/20';
    if (score >= 60) return 'bg-green-500/20';
    if (score >= 40) return 'bg-yellow-500/20';
    return 'bg-gray-500/20';
  };

  const filteredVideos = videos
    .filter(v => 
      selectedTopic ? 
        v.hashtags?.some(tag => tag.toLowerCase().includes(selectedTopic.toLowerCase())) :
        v.title?.toLowerCase().includes(search.toLowerCase()) ||
        v.author?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => ((b[sortBy] as number) || 0) - ((a[sortBy] as number) || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Flame className="text-orange-500" size={40} />
            Video Trend Finder
          </h1>
          <p className="text-xl text-gray-300">
            Discover trending videos with AI-powered engagement scores
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-700">
            <div className="flex gap-1">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setActivePlatform(platform.id)}
                    className={`
                      px-6 py-3 rounded-xl font-medium transition-all duration-200
                      flex items-center gap-2
                      ${activePlatform === platform.id 
                        ? `bg-${platform.color}-600 text-white shadow-lg` 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon size={20} />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search videos or creators..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedTopic(null);
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
            />
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as keyof Video)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
            >
              <option value="trendScore">Smart Score</option>
              <option value="engagementRate">Engagement Rate</option>
              <option value="views">Views</option>
              <option value="likes">Likes</option>
              <option value="viewsGrowth">Growth Rate</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Trending Topics */}
        {topics.length > 0 && (
          <div className="mb-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap
                    transition-all duration-200
                    ${selectedTopic === topic.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                    }
                  `}
                >
                  {topic.type === 'music' ? <Music size={16} /> : <Hash size={16} />}
                  <span>{topic.name}</span>
                  <span className="text-xs opacity-60">({topic.videoCount})</span>
                  {topic.growthRate > 1.5 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                      +{Math.round(topic.growthRate * 100)}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">Total Videos</div>
                <div className="text-2xl font-bold text-white">{filteredVideos.length}</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">Avg Engagement</div>
                <div className="text-2xl font-bold text-purple-400">
                  {(filteredVideos.reduce((acc, v) => acc + (v.engagementRate || 0), 0) / (filteredVideos.length || 1)).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">Avg Score</div>
                <div className="text-2xl font-bold text-green-400">
                  {(filteredVideos.reduce((acc, v) => acc + (v.trendScore || 0), 0) / (filteredVideos.length || 1)).toFixed(1)}
                </div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400">Total Views</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(filteredVideos.reduce((acc, v) => acc + (v.views || 0), 0))}
                </div>
              </div>
            </div>

            {/* Video Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.videoId}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-purple-500 transition-all group relative"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] bg-black">
                    <img
                      src={video.thumbnailUrl || `https://picsum.photos/400/700?random=${video.videoId}`}
                      alt={video.title || 'Video thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    
                    {/* Smart Score Badge */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-3 py-1.5 rounded-full ${getScoreBg(video.trendScore)} backdrop-blur-sm`}>
                      <div className={`w-2 h-2 rounded-full ${getScoreColor(video.trendScore).replace('text', 'bg')}`} />
                      <span className={`text-sm font-bold ${getScoreColor(video.trendScore)}`}>
                        Score: {Math.round(video.trendScore || 0)}
                      </span>
                    </div>

                    {/* Viral Badge */}
                    {video.viralPotential && video.viralPotential > 70 && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 rounded-full animate-pulse">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <Flame size={14} />
                          Viral {Math.round(video.viralPotential)}%
                        </span>
                      </div>
                    )}

                    {/* Platform Icon */}
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                      {activePlatform === 'youtube' && <Youtube size={16} className="text-red-500" />}
                      {activePlatform === 'instagram' && <Instagram size={16} className="text-pink-500" />}
                      {activePlatform === 'facebook' && <Facebook size={16} className="text-blue-500" />}
                    </div>

                    {/* Duration */}
                    {video.duration && video.duration > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-white line-clamp-2 text-sm">
                      {video.title || 'Untitled Video'}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2">
                      {video.authorAvatar ? (
                        <img src={video.authorAvatar} alt={video.author || 'Author'} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white">
                          {video.author?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="text-sm text-gray-300 truncate flex-1">{video.author || 'Unknown Creator'}</span>
                      
                      {/* Growth Indicator */}
                      {video.viewsGrowth && video.viewsGrowth > 50 && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp size={12} />
                          +{Math.round(video.viewsGrowth)}%
                        </span>
                      )}
                    </div>

                    {/* Engagement Stats Grid */}
                    <div className="grid grid-cols-4 gap-1 bg-gray-900/50 rounded-xl p-2">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Views</div>
                        <div className="text-sm font-bold text-white">{formatNumber(video.views)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Likes</div>
                        <div className="text-sm font-bold text-white">{formatNumber(video.likes)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Comments</div>
                        <div className="text-sm font-bold text-white">{formatNumber(video.comments)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Shares</div>
                        <div className="text-sm font-bold text-white">{formatNumber(video.shares || 0)}</div>
                      </div>
                    </div>

                    {/* Engagement Rate Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Engagement Rate</span>
                        <span className="text-purple-400 font-bold">{Math.round(video.engagementRate || 0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((video.engagementRate || 0), 20) * 5}%` }}
                        />
                      </div>
                    </div>

                    {/* Growth Rate */}
                    {video.viewsGrowth && video.viewsGrowth > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <TrendingUp size={12} />
                          Growth
                        </span>
                        <span className="text-green-400 font-bold">
                          +{Math.round(video.viewsGrowth)}%
                        </span>
                      </div>
                    )}

                    {/* Hashtags */}
                    {video.hashtags && video.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {video.hashtags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {video.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">+{video.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Audio */}
                    {video.audioTitle && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-700 pt-2">
                        <Music size={12} />
                        <span className="truncate">{video.audioTitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}