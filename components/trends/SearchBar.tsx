'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
//import Suggestions from './Suggestions';

interface SearchBarProps {
  onSearch: (query: string) => void;
  platform: string;
  loading: boolean;
}

export default function SearchBar({ onSearch, platform, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      await onSearch(query.trim());
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    await onSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getPlaceholder = () => {
    switch (platform) {
      case 'youtube':
        return 'Search YouTube videos...';
      case 'instagram':
        return 'Search Instagram reels...';
      case 'facebook':
        return 'Search Facebook videos...';
      default:
        return 'Search videos...';
    }
  };

  const getPlatformStyles = () => {
    switch (platform) {
      case 'youtube':
        return {
          focus: 'focus:border-red-500 focus:ring-red-200',
          button: 'bg-red-500 hover:bg-red-600',
          clear: 'text-gray-400 hover:text-red-600'
        };
      case 'instagram':
        return {
          focus: 'focus:border-pink-500 focus:ring-pink-200',
          button: 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600',
          clear: 'text-gray-400 hover:text-pink-600'
        };
      case 'facebook':
        return {
          focus: 'focus:border-blue-500 focus:ring-blue-200',
          button: 'bg-blue-500 hover:bg-blue-600',
          clear: 'text-gray-400 hover:text-blue-600'
        };
      default:
        return {
          focus: 'focus:border-purple-500 focus:ring-purple-200',
          button: 'bg-purple-500 hover:bg-purple-600',
          clear: 'text-gray-400 hover:text-purple-600'
        };
    }
  };

  const styles = getPlatformStyles();

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getPlaceholder()}
          className={`w-full px-6 py-4 pr-24 text-lg bg-white text-gray-900 rounded-2xl border-2 border-gray-200 ${styles.focus} focus:outline-none focus:ring-4 transition-all shadow-sm hover:shadow-md placeholder-gray-400`}
          disabled={loading}
          autoComplete="off"
        />
        
        {query && !loading && (
          <button
            type="button"
            onClick={clearSearch}
            className={`absolute right-16 top-1/2 transform -translate-y-1/2 transition-colors ${styles.clear}`}
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] shadow-md hover:shadow-lg ${styles.button}`}
          aria-label="Search"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Suggestions dropdown for light theme */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-gray-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}