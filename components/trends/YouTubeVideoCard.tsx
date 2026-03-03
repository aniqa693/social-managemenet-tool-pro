'use client';

import { useState } from 'react';
import { Play, Eye, Heart, MessageCircle, Clock, User, ExternalLink, ThumbsUp, TrendingUp, Activity, Star } from 'lucide-react';

interface YouTubeVideoCardProps {
  video: any;
}

export default function YouTubeVideoCard({ video }: YouTubeVideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // YouTube specific data extraction
  const title = video?.title || 'YouTube Video';
  const description = video?.description || '';
  const thumbnailUrl = video?.thumbnailUrl || video?.thumbnails?.high?.url || video?.thumbnails?.default?.url;
  const videoUrl = video?.videoUrl || `https://youtube.com/watch?v=${video?.videoId}`;
  const channelName = video?.author || video?.channelName || 'YouTube Creator';
  const channelSubscribers = video?.channelSubscribers || 0;
  const viewCount = video?.viewCount || 0;
  const likeCount = video?.likeCount || 0;
  const commentCount = video?.commentCount || 0;
  const duration = video?.duration;
  const publishedAt = video?.publishedAt;

  // Calculate engagement metrics
  const calculateEngagementRate = () => {
    if (viewCount === 0) return 0;
    
    // Total interactions (likes + comments)
    const totalInteractions = (likeCount || 0) + (commentCount || 0);
    
    // Engagement rate formula: (total interactions / views) * 100
    const engagementRate = (totalInteractions / viewCount) * 100;
    
    // Round to 2 decimal places
    return Math.round(engagementRate * 100) / 100;
  };

  const calculateSmartScore = () => {
    // Smart score combines multiple factors specific to YouTube:
    // 1. Engagement rate (35% weight)
    // 2. Like-to-view ratio (25% weight)
    // 3. Comment-to-view ratio (20% weight)
    // 4. View count relative to channel size (20% weight)
    
    if (viewCount === 0) return 0;
    
    const engagementRate = calculateEngagementRate();
    
    // Like ratio (likes per 1000 views)
    const likeRatio = (likeCount / viewCount) * 1000;
    
    // Comment ratio (comments per 1000 views)
    const commentRatio = (commentCount / viewCount) * 1000;
    
    // View-to-subscriber ratio (views per subscriber)
    const viewToSubRatio = channelSubscribers > 0 ? viewCount / channelSubscribers : viewCount / 1000;
    
    // Normalize values to a 0-100 scale
    // These thresholds are based on typical YouTube engagement metrics
    
    // Engagement score (max 35 points at 8% engagement)
    const engagementScore = Math.min((engagementRate / 8) * 35, 35);
    
    // Like ratio score (max 25 points at 200 likes per 1k views)
    const likeScore = Math.min((likeRatio / 200) * 25, 25);
    
    // Comment ratio score (max 20 points at 50 comments per 1k views)
    const commentScore = Math.min((commentRatio / 50) * 20, 20);
    
    // View popularity score (max 20 points)
    // For channels with subscribers, compare to subscriber count
    // For new channels, use log scale of views
    let viewScore;
    if (channelSubscribers > 0) {
      // If views are 10x subscribers, that's excellent
      viewScore = Math.min((viewToSubRatio / 10) * 20, 20);
    } else {
      // Log scale for channels without subscriber data
      viewScore = Math.min((Math.log10(viewCount + 1) / 6) * 20, 20);
    }
    
    // Calculate total smart score
    const totalScore = engagementScore + likeScore + commentScore + viewScore;
    
    // Round to nearest integer
    return Math.round(totalScore);
  };

  const getEngagementRateColor = (rate: number) => {
    if (rate >= 5) return 'text-green-400';
    if (rate >= 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSmartScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const engagementRate = calculateEngagementRate();
  const smartScore = calculateSmartScore();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (duration: string) => {
    // Handle YouTube duration format (PT1H2M3S)
    if (!duration) return null;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  const handleWatchClick = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-red-500/20">
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!imageError && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900 to-red-950">
            <span className="text-red-300 text-4xl">▶</span>
          </div>
        )}

        {/* Duration Badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(duration)}
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-red-600">
          YouTube
        </div>

        {/* Engagement Metrics Overlay */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* View Count Badge */}
          {viewCount > 0 && (
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(viewCount)}
            </div>
          )}
          
          {/* Smart Score Badge */}
          {smartScore > 0 && (
            <div className={`bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1 ${getSmartScoreColor(smartScore)}`}>
              <Star className="w-3 h-3" />
              Score: {smartScore}
            </div>
          )}
        </div>

        {/* Engagement Rate Badge */}
        {engagementRate > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
            <TrendingUp className={`w-3 h-3 ${getEngagementRateColor(engagementRate)}`} />
            <span className="text-white">Engagement:</span>
            <span className={getEngagementRateColor(engagementRate)}>{engagementRate}%</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Channel and Stats */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-red-400" />
            <span className="text-gray-300 truncate">{channelName}</span>
            {channelSubscribers > 0 && (
              <span className="text-xs text-gray-500">
                {formatNumber(channelSubscribers)} subs
              </span>
            )}
          </div>

          {/* Engagement Metrics Grid */}
          {(likeCount > 0 || commentCount > 0) && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-red-500/10 rounded-lg p-2">
                <div className="text-xs text-red-400 mb-1">👍 Likes</div>
                <div className="text-sm font-semibold text-white">{formatNumber(likeCount)}</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-2">
                <div className="text-xs text-blue-400 mb-1">💬 Comments</div>
                <div className="text-sm font-semibold text-white">{formatNumber(commentCount)}</div>
              </div>
            </div>
          )}

          {/* Smart Score Details */}
          {smartScore > 0 && (
            <div className="p-3 bg-gray-700/50 rounded-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-400">Smart Score Analysis</span>
                <span className={`text-lg font-bold ${getSmartScoreColor(smartScore)}`}>{smartScore}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-gray-600 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    smartScore >= 80 ? 'bg-green-500' :
                    smartScore >= 60 ? 'bg-blue-500' :
                    smartScore >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(smartScore, 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Engagement:</span>
                  <span className={getEngagementRateColor(engagementRate)}>{engagementRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Views:</span>
                  <span className="text-gray-300">{formatNumber(viewCount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Like Ratio:</span>
                  <span className="text-gray-300">{((likeCount / viewCount) * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Comment Ratio:</span>
                  <span className="text-gray-300">{((commentCount / viewCount) * 100 || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          {publishedAt && (
            <div className="flex items-center justify-end space-x-1 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>{new Date(publishedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Watch Button */}
        <button
          onClick={handleWatchClick}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Watch on YouTube
        </button>
      </div>
    </div>
  );
}