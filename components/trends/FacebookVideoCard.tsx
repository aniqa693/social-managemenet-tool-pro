'use client';

import { useState } from 'react';
import { Play, Eye, Clock, User, ExternalLink, CheckCircle, Download, Share2, TrendingUp, Activity, Star } from 'lucide-react';

interface FacebookVideoCardProps {
  video: any;
}

export default function FacebookVideoCard({ video }: FacebookVideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Facebook specific data extraction from your test results
  const title = video?.title || video?.trackTitle || 'Facebook Reel';
  const description = video?.description || `Posted by ${video?.author}`;
  const thumbnailUrl = video?.thumbnailUrl || video?.thumbnailImage;
  const videoUrl = video?.videoUrl || video?.videoHdUrl || video?.videoSdUrl || video?.shareableUrl || '#';
  const author = video?.author?.replace(' Verified account', '') || 'Facebook User';
  const authorVerified = video?.author?.includes('Verified') || video?.authorVerified || false;
  const viewCount = video?.viewCount || 0;
  const likeCount = video?.likeCount || 0;
  const commentCount = video?.commentCount || 0;
  const shareCount = video?.shareCount || 0;
  const duration = video?.duration;
  const publishedAt = video?.publishedAt;
  const shareableUrl = video?.shareableUrl;
  const videoHdUrl = video?.videoHdUrl;
  const videoSdUrl = video?.videoSdUrl;

  // Calculate engagement metrics
  const calculateEngagementRate = () => {
    if (viewCount === 0) return 0;
    
    // Total interactions (likes + comments + shares)
    const totalInteractions = (likeCount || 0) + (commentCount || 0) + (shareCount || 0);
    
    // Engagement rate formula: (total interactions / views) * 100
    const engagementRate = (totalInteractions / viewCount) * 100;
    
    // Round to 2 decimal places
    return Math.round(engagementRate * 100) / 100;
  };

  const calculateSmartScore = () => {
    // Smart score combines multiple factors:
    // 1. Engagement rate (40% weight)
    // 2. View count relative to average (20% weight)
    // 3. Like-to-view ratio (20% weight)
    // 4. Comment-to-view ratio (10% weight)
    // 5. Share-to-view ratio (10% weight)
    
    if (viewCount === 0) return 0;
    
    const engagementRate = calculateEngagementRate();
    
    // Like ratio (likes per 1000 views)
    const likeRatio = (likeCount / viewCount) * 1000;
    
    // Comment ratio (comments per 1000 views)
    const commentRatio = (commentCount / viewCount) * 1000;
    
    // Share ratio (shares per 1000 views)
    const shareRatio = (shareCount / viewCount) * 1000;
    
    // Normalize values to a 0-100 scale
    // These thresholds are based on typical Facebook engagement metrics
    const engagementScore = Math.min((engagementRate / 5) * 40, 40); // Max 40 points at 5% engagement
    
    const viewScore = Math.min((Math.log10(viewCount + 1) / 6) * 20, 20); // Log scale for views
    
    const likeScore = Math.min((likeRatio / 100) * 20, 20); // Max 20 points at 100 likes per 1k views
    
    const commentScore = Math.min((commentRatio / 20) * 10, 10); // Max 10 points at 20 comments per 1k views
    
    const shareScore = Math.min((shareRatio / 10) * 10, 10); // Max 10 points at 10 shares per 1k views
    
    // Calculate total smart score
    const totalScore = engagementScore + viewScore + likeScore + commentScore + shareScore;
    
    // Round to nearest integer
    return Math.round(totalScore);
  };

  const getEngagementRateColor = (rate: number) => {
    if (rate >= 3) return 'text-green-400';
    if (rate >= 1) return 'text-yellow-400';
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds === 0) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleWatchClick = () => {
    if (videoUrl && videoUrl !== '#') {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareClick = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownload = (url: string, quality: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="group bg-gradient-to-br from-blue-900/20 to-blue-950/20 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-blue-500/20">
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
              console.log('Image failed:', thumbnailUrl);
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950">
            <span className="text-blue-300 text-4xl">📱</span>
          </div>
        )}

        {/* Duration Badge */}
        {duration && duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(duration)}
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600">
          Facebook Reel
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
        {/* Title */}
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {title !== 'N/A' ? title : 'Facebook Reel'}
        </h3>
        
        {/* Description */}
        {description && description !== `Posted by ${author}` && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Author Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300 truncate">{author}</span>
            {authorVerified && (
              <CheckCircle className="w-3 h-3 text-blue-400" />
            )}
          </div>
          
          {publishedAt && (
            <div className="flex items-center space-x-1 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>{new Date(publishedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Engagement Metrics Grid */}
        {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-blue-500/10 rounded-lg p-2">
              <div className="text-xs text-blue-400 mb-1">👍 Likes</div>
              <div className="text-sm font-semibold text-white">{formatNumber(likeCount)}</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2">
              <div className="text-xs text-green-400 mb-1">💬 Comments</div>
              <div className="text-sm font-semibold text-white">{formatNumber(commentCount)}</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-2">
              <div className="text-xs text-purple-400 mb-1">🔄 Shares</div>
              <div className="text-sm font-semibold text-white">{formatNumber(shareCount)}</div>
            </div>
          </div>
        )}

        {/* Smart Score Details */}
        {smartScore > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-400">Smart Score Analysis</span>
              <span className={`text-lg font-bold ${getSmartScoreColor(smartScore)}`}>{smartScore}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
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

        {/* Video Quality Indicators */}
        {(videoHdUrl || videoSdUrl) && (
          <div className="flex gap-2 mb-3">
            {videoHdUrl && (
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                HD Available
              </span>
            )}
            {videoSdUrl && (
              <span className="text-xs bg-gray-600/20 text-gray-300 px-2 py-1 rounded">
                SD Available
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWatchClick}
            disabled={videoUrl === '#'}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            <Play className="w-4 h-4" />
            Watch Now
          </button>
          
          {shareableUrl && (
            <button
              onClick={handleShareClick}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>

        {/* Download Options */}
        {(videoHdUrl || videoSdUrl) && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {videoHdUrl && (
              <button
                onClick={() => handleDownload(videoHdUrl, 'HD')}
                className="bg-gray-800 hover:bg-gray-700 text-blue-400 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs border border-blue-500/30"
              >
                <Download className="w-3 h-3" />
                Download HD
              </button>
            )}
            {videoSdUrl && (
              <button
                onClick={() => handleDownload(videoSdUrl, 'SD')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <Download className="w-3 h-3" />
                Download SD
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}