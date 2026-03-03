'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Hash, Music, Film, Globe, User, Camera, Gamepad2, Coffee, Dumbbell, BookOpen, Newspaper, Heart, Laugh, Star } from 'lucide-react';

interface RecommendationInputProps {
  onSelect: (query: string) => void;
  platform: string;
}

const recommendations = {
  youtube: [
    { icon: TrendingUp, text: 'trending', color: 'red' },
    { icon: Music, text: 'music videos', color: 'red' },
    { icon: Film, text: 'movie trailers', color: 'red' },
    { icon: Gamepad2, text: 'gaming', color: 'red' },
    { icon: Globe, text: 'travel vlogs', color: 'red' },
    { icon: Coffee, text: 'cooking recipes', color: 'red' },
    { icon: Dumbbell, text: 'workout', color: 'red' },
    { icon: BookOpen, text: 'tech reviews', color: 'red' },
  ],
  instagram: [
    { icon: User, text: 'natgeo', color: 'pink' },
    { icon: User, text: 'zuck', color: 'pink' },
    { icon: User, text: 'kimkardashian', color: 'pink' },
    { icon: User, text: 'cristiano', color: 'pink' },
    { icon: User, text: 'leomessi', color: 'pink' },
    { icon: Camera, text: 'natgeotravel', color: 'pink' },
    { icon: Coffee, text: 'food', color: 'pink' },
    { icon: Heart, text: 'fashion', color: 'pink' },
  ],
  facebook: [
    { icon: Star, text: 'rihanna', color: 'blue' },
    { icon: Star, text: 'therock', color: 'blue' },
    { icon: Star, text: 'selenagomez', color: 'blue' },
    { icon: Camera, text: 'natgeo', color: 'blue' },
    { icon: Newspaper, text: 'cnn', color: 'blue' },
    { icon: Gamepad2, text: 'gaming', color: 'blue' },
    { icon: Music, text: 'music', color: 'blue' },
    { icon: Laugh, text: 'funny', color: 'blue' },
    { icon: Dumbbell, text: 'fitness', color: 'blue' },
    { icon: Coffee, text: 'food', color: 'blue' },
  ],
};

export default function RecommendationInput({ onSelect, platform }: RecommendationInputProps) {
  const [showRecommendations, setShowRecommendations] = useState(true);
  const platformRecs = recommendations[platform as keyof typeof recommendations] || recommendations.youtube;

  const getGradient = (color: string) => {
    switch (color) {
      case 'red': 
        return 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-400 text-white shadow-lg hover:shadow-red-500/25';
      case 'pink': 
        return 'from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 border-pink-400 text-white shadow-lg hover:shadow-pink-500/25';
      case 'blue': 
        return 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-400 text-white shadow-lg hover:shadow-blue-500/25';
      default: 
        return 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-purple-400 text-white shadow-lg hover:shadow-purple-500/25';
    }
  };

  const getPlatformHint = () => {
    switch (platform) {
      case 'instagram':
        return '💡 Try: Enter Instagram username (e.g., natgeo, zuck, cristiano)';
      case 'youtube':
        return '💡 Try: Search for videos, channels, or topics (e.g., trending, music videos)';
      case 'facebook':
        return '💡 Try: Enter Facebook page name (e.g., rihanna, natgeo, cnn)';
      default:
        return 'Enter search query';
    }
  };

  if (!showRecommendations) return null;

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-gray-300 font-medium">
          {platform === 'instagram' ? '✨ Popular Instagram accounts' : 
           platform === 'facebook' ? '✨ Popular Facebook pages' : 
           '✨ Trending searches'}
        </span>
        <button
          onClick={() => setShowRecommendations(false)}
          className="ml-auto text-xs text-gray-400 hover:text-gray-300 transition-colors bg-gray-800/50 px-2 py-1 rounded-full hover:bg-gray-700/50"
        >
          Hide suggestions
        </button>
      </div>
      
      <div className="text-sm text-gray-300 mb-4 bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 shadow-inner">
        {getPlatformHint()}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {platformRecs.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <button
              key={index}
              onClick={() => onSelect(rec.text)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r ${getGradient(rec.color)} border transition-all duration-200 hover:scale-105 hover:shadow-xl font-medium`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{rec.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}