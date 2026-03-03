'use client';

import { useState, useEffect } from 'react';
import { Play, Heart, MessageCircle, Clock, User, ExternalLink, Music, Film, RefreshCw, TrendingUp, Activity, Star } from 'lucide-react';

interface InstagramVideoCardProps {
  video: any;
}

export default function InstagramVideoCard({ video }: InstagramVideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when video changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setCurrentImageIndex(0);
    setRetryCount(0);
  }, [video]);

  // Extract data
  const caption = video?.caption || video?.title || 'Instagram Post';
  const shortCaption = caption.length > 100 ? `${caption.substring(0, 100)}...` : caption;
  
  // Get thumbnail URLs (now using proxy)
  const thumbnailUrl = video?.thumbnailUrl;
  const allImages = video?.allImages || [];
  const videoUrl = video?.videoUrl;
  
  const likesCount = video?.likesCount || 0;
  const commentsCount = video?.commentsCount || 0;
  const videoViewCount = video?.videoViewCount || 0;
  const playsCount = video?.playsCount || 0;
  const savesCount = video?.savesCount || 0;
  const sharesCount = video?.sharesCount || 0;
  const ownerUsername = video?.ownerUsername || 'instagram_user';
  const ownerFullName = video?.ownerFullName || ownerUsername;
  const followerCount = video?.followerCount || 0;
  const timestamp = video?.timestamp;
  const duration = video?.videoDuration;
  const hashtags = video?.hashtags || [];
  const musicInfo = video?.musicInfo;
  const firstComment = video?.firstComment;
  const latestComments = video?.latestComments || [];
  const isVideo = video?.isVideo || video?.type === 'Video' || !!videoUrl;

  // Calculate engagement metrics for Instagram
  const calculateEngagementRate = () => {
    const totalInteractions = (likesCount || 0) + (commentsCount || 0) + (savesCount || 0) + (sharesCount || 0);
    
    // Use video views for reels, likes count for posts, or follower count as fallback
    const baseMetric = videoViewCount > 0 ? videoViewCount : 
                      playsCount > 0 ? playsCount :
                      likesCount > 0 ? likesCount * 10 : // Estimate reach if no view data
                      followerCount > 0 ? followerCount * 0.1 : // Estimate 10% reach if follower count available
                      1000; // Fallback
    
    if (baseMetric === 0) return 0;
    
    const engagementRate = (totalInteractions / baseMetric) * 100;
    return Math.round(engagementRate * 100) / 100;
  };

  const calculateSmartScore = () => {
    // Instagram Smart Score combines:
    // 1. Engagement rate (30% weight)
    // 2. Like-to-view ratio (25% weight)
    // 3. Comment-to-view ratio (15% weight)
    // 4. Save-to-view ratio (15% weight)
    // 5. Share-to-view ratio (15% weight)
    
    const totalInteractions = (likesCount || 0) + (commentsCount || 0) + (savesCount || 0) + (sharesCount || 0);
    const baseMetric = videoViewCount > 0 ? videoViewCount : 
                      playsCount > 0 ? playsCount :
                      likesCount > 0 ? likesCount * 10 : 
                      1000;
    
    if (baseMetric === 0) return 0;
    
    // Calculate ratios per 1000 impressions
    const likeRatio = (likesCount / baseMetric) * 1000;
    const commentRatio = (commentsCount / baseMetric) * 1000;
    const saveRatio = (savesCount / baseMetric) * 1000;
    const shareRatio = (sharesCount / baseMetric) * 1000;
    const engagementRate = calculateEngagementRate();
    
    // Normalize values to 0-100 scale
    // Instagram benchmarks:
    // - Good engagement: 3-6%
    // - Good like ratio: 200-400 per 1k views
    // - Good comment ratio: 20-50 per 1k views
    // - Good save ratio: 10-30 per 1k views
    // - Good share ratio: 5-15 per 1k views
    
    const engagementScore = Math.min((engagementRate / 6) * 30, 30); // Max 30 points at 6% engagement
    
    const likeScore = Math.min((likeRatio / 400) * 25, 25); // Max 25 points at 400 likes per 1k
    
    const commentScore = Math.min((commentRatio / 50) * 15, 15); // Max 15 points at 50 comments per 1k
    
    const saveScore = Math.min((saveRatio / 30) * 15, 15); // Max 15 points at 30 saves per 1k
    
    const shareScore = Math.min((shareRatio / 15) * 15, 15); // Max 15 points at 15 shares per 1k
    
    // Calculate total smart score
    const totalScore = engagementScore + likeScore + commentScore + saveScore + shareScore;
    
    return Math.round(totalScore);
  };

  const getEngagementRateColor = (rate: number) => {
    if (rate >= 4) return 'text-green-400';
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWatchClick = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } else if (video?.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRetryImage = () => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Try next image if available
    if (allImages.length > 0 && currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return date.toLocaleDateString();
  };

  // Determine current image URL
  const currentImageUrl = !imageError && thumbnailUrl 
    ? thumbnailUrl 
    : allImages.length > 0 
      ? allImages[currentImageIndex] 
      : null;

  return (
    <div className="group bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-pink-500/20">
      {/* Thumbnail Section */}
      <div className="relative aspect-[9/16] bg-gray-900 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!imageError && currentImageUrl ? (
          <img
            key={`${currentImageUrl}-${retryCount}`}
            src={currentImageUrl}
            alt={caption}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'
            }`}
            onLoad={() => {
              console.log('✅ Image loaded successfully');
              setImageLoading(false);
              setImageError(false);
            }}
            onError={(e) => {
              console.log('❌ Image failed to load:', currentImageUrl);
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
            <span className="text-pink-300 text-4xl mb-2">📷</span>
            <p className="text-pink-200 text-sm mb-2">
              {imageError ? 'Failed to load image' : 'No thumbnail'}
            </p>
            {(imageError || allImages.length > 0) && (
              <button
                onClick={handleRetryImage}
                className="flex items-center gap-1 text-xs bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 px-3 py-1 rounded-full transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {allImages.length > 1 && currentImageIndex < allImages.length - 1 
                  ? 'Try next image' 
                  : 'Retry'}
              </button>
            )}
          </div>
        )}

        {/* Duration Badge */}
        {duration && duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium z-20">
            {formatDuration(duration)}
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 z-20">
          Instagram {isVideo ? 'Reel' : 'Post'}
        </div>

        {/* Engagement Metrics Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
          {/* Views/Plays Badge */}
          {(videoViewCount > 0 || playsCount > 0) && (
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Play className="w-3 h-3 fill-white" />
              {formatNumber(videoViewCount || playsCount)}
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
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1 z-20">
            <TrendingUp className={`w-3 h-3 ${getEngagementRateColor(engagementRate)}`} />
            <span className="text-white">Engagement:</span>
            <span className={getEngagementRateColor(engagementRate)}>{engagementRate}%</span>
          </div>
        )}

        {/* Music Info Badge */}
        {musicInfo?.song_name && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1 max-w-[60%] z-20" style={{ bottom: engagementRate > 0 ? '2.5rem' : '0.5rem' }}>
            <Music className="w-3 h-3 text-pink-400 flex-shrink-0" />
            <span className="truncate">{musicInfo.song_name}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handleWatchClick}
              disabled={!videoUrl}
              className="bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all transform hover:scale-110 disabled:opacity-50"
            >
              <Play className="w-8 h-8 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {ownerUsername[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{ownerFullName}</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">@{ownerUsername}</span>
                {followerCount > 0 && (
                  <span className="text-gray-500 text-xs">
                    {formatNumber(followerCount)} followers
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {timestamp && (
            <div className="flex items-center text-gray-500 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(timestamp)}
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="mb-3">
          <p className="text-gray-300 text-sm whitespace-pre-line">
            {showCaption ? caption : shortCaption}
          </p>
          {caption.length > 100 && (
            <button
              onClick={() => setShowCaption(!showCaption)}
              className="text-pink-400 text-xs mt-1 hover:text-pink-300"
            >
              {showCaption ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hashtags.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-blue-400 text-xs">#{tag}</span>
            ))}
            {hashtags.length > 3 && (
              <span className="text-gray-500 text-xs">+{hashtags.length - 3}</span>
            )}
          </div>
        )}

        {/* Engagement Metrics Grid */}
        <div className="grid grid-cols-4 gap-1 mb-4 text-center">
          <div className="bg-pink-500/10 rounded-lg p-2">
            <div className="text-xs text-pink-400 mb-1">❤️ Likes</div>
            <div className="text-sm font-semibold text-white">{formatNumber(likesCount)}</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2">
            <div className="text-xs text-blue-400 mb-1">💬 Comments</div>
            <div className="text-sm font-semibold text-white">{formatNumber(commentsCount)}</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2">
            <div className="text-xs text-green-400 mb-1">📌 Saves</div>
            <div className="text-sm font-semibold text-white">{formatNumber(savesCount)}</div>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-2">
            <div className="text-xs text-purple-400 mb-1">🔄 Shares</div>
            <div className="text-sm font-semibold text-white">{formatNumber(sharesCount)}</div>
          </div>
        </div>

        {/* Smart Score Details */}
        {smartScore > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-pink-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-pink-400">Smart Score Analysis</span>
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
                <span className="text-gray-300">{formatNumber(videoViewCount || playsCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Like Ratio:</span>
                <span className="text-gray-300">{((likesCount / (videoViewCount || playsCount || 1)) * 100 || 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Save Ratio:</span>
                <span className="text-gray-300">{((savesCount / (videoViewCount || playsCount || 1)) * 100 || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* First Comment */}
        {firstComment && (
          <div className="mb-3 text-sm bg-gray-800/50 p-2 rounded-lg">
            <span className="text-gray-400">💬 </span>
            <span className="text-gray-300">{firstComment}</span>
          </div>
        )}

        {/* Latest Comments */}
        {latestComments.length > 0 && (
          <div className="mb-3 space-y-1 max-h-20 overflow-y-auto">
            {latestComments.map((comment: any, i: number) => (
              <div key={i} className="text-xs text-gray-400 flex items-start gap-1">
                <span className="font-medium text-gray-300">@{comment.ownerUsername}:</span>
                <span className="line-clamp-1">{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleWatchClick}
            disabled={!videoUrl}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch
          </button>
          
          <a
            href={video?.url || `https://instagram.com/p/${video?.shortCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
        </div>

        {/* Image counter if multiple images */}
        {allImages.length > 1 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Image {currentImageIndex + 1} of {allImages.length}
          </div>
        )}
      </div>
    </div>
  );
}