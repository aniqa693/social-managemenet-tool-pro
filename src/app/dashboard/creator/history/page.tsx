// app/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Calendar, Clock, Hash, Type, Video, 
  Filter, Search, Copy, Eye, Trash2, Download,
  Sparkles, MessageSquare, Film, ArrowLeft,
  Grid, List, ChevronDown, ChevronUp,
  Users, Target, Image, Megaphone, Link, Timer,
  Tag, Hash as HashIcon, Camera, Play, Zap,
  TrendingUp, BarChart, Eye as EyeIcon, Volume2,
  Lightbulb, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type HistoryItem = {
  id: number;
  type: 'caption' | 'title' | 'script';
  userInput: string | null;
  content: any;
  platform?: string | null;
  contentType?: string | null;
  videoType?: string | null;
  tone: string | null;
  duration?: number | null;
  userEmail: string | null;
  createdOn: string | null;
};

type CaptionItem = {
  caption: string;
  hashtags: string[];
  emojis: string[];
  engagementScore?: number;
  characterCount?: number;
  tone?: string;
};

type CaptionContent = {
  captions: CaptionItem[];
  settings?: {
    platform?: string;
    tone?: string;
    creativityLevel?: number;
    includeTrending?: boolean;
    generationTime?: number;
  };
  metadata?: {
    totalCaptions?: number;
    hasTrending?: boolean;
  };
};

type TitleItem = {
  title: string;
  description: string;
  tags?: string[];
  characterCount?: number;
  type?: string;
};

type TitleContent = {
  titles: TitleItem[];
  settings?: {
    topic?: string;
    tone?: string;
    contentType?: string;
    includeKeywords?: boolean;
    creativityLevel?: number;
    count?: number;
    generatedAt?: string;
  };
  metadata?: {
    totalTitles?: number;
    hasKeywords?: boolean;
  };
};

type ScriptSection = {
  title?: string;
  content?: string;
  visualCues?: string[];
  duration?: string;
  audioNotes?: string;
  time?: string;
};

type ScriptData = {
  title?: string;
  hook?: string;
  sections?: ScriptSection[];
  conclusion?: string;
  cta?: string;
  totalDuration?: string | number;
  targetAudience?: string;
  hashtags?: string[];
  thumbnailIdeas?: string[];
};

type ScriptContent = {
  script?: ScriptData;
  settings?: {
    topic?: string;
    tone?: string;
    videoType?: string;
    duration?: number;
    includeHook?: boolean;
    includeCTA?: boolean;
    creativityLevel?: number;
    generatedAt?: string;
  };
  metadata?: {
    sections?: number;
    hasCTA?: boolean;
    hasHook?: boolean;
  };
  [key: string]: any;
};

export default function HistoryPage() {
  // State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [userEmail, setUserEmail] = useState('');
  
  // Pagination states for captions and titles
  const [captionPage, setCaptionPage] = useState<Record<number, number>>({});
  const [titlePage, setTitlePage] = useState<Record<number, number>>({});
  
  // Items per page - Now showing 1 item per page
  const CAPTIONS_PER_PAGE = 1;
  const TITLES_PER_PAGE = 1;

  // Filtered history
  const filteredHistory = history.filter(item => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (item.userInput && item.userInput.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tone && item.tone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = filterType === 'all' || item.type === filterType;
    
    // Tab filter
    const matchesTab = selectedTab === 'all' || item.type === selectedTab;
    
    return matchesSearch && matchesType && matchesTab;
  });

  // Load history
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/history');
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch history');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.data);
          // Get email from first item if available
          if (data.data.length > 0 && data.data[0].userEmail) {
            setUserEmail(data.data[0].userEmail);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch history');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Helper functions
  const toggleExpand = (id: number) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Get current page for an item
  const getCurrentPage = (itemId: number, type: 'caption' | 'title'): number => {
    if (type === 'caption') {
      return captionPage[itemId] || 1;
    }
    return titlePage[itemId] || 1;
  };

  // Set page for an item
  const setCurrentPage = (itemId: number, type: 'caption' | 'title', page: number) => {
    if (type === 'caption') {
      setCaptionPage(prev => ({ ...prev, [itemId]: page }));
    } else {
      setTitlePage(prev => ({ ...prev, [itemId]: page }));
    }
  };

  // Get paginated items - Showing 1 item per page
  const getPaginatedItems = <T,>(
    items: T[], 
    itemId: number, 
    type: 'caption' | 'title'
  ): T[] => {
    const currentPage = getCurrentPage(itemId, type);
    const startIndex = (currentPage - 1) * (type === 'caption' ? CAPTIONS_PER_PAGE : TITLES_PER_PAGE);
    const endIndex = startIndex + (type === 'caption' ? CAPTIONS_PER_PAGE : TITLES_PER_PAGE);
    return items.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = (items: any[], type: 'caption' | 'title'): number => {
    const itemsPerPage = type === 'caption' ? CAPTIONS_PER_PAGE : TITLES_PER_PAGE;
    return Math.ceil(items.length / itemsPerPage);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard! 📋');
    } catch (err) {
      toast.error('Failed to copy 😢');
    }
  };

  const downloadContent = (item: HistoryItem) => {
    let content = '';
    
    if (item.type === 'caption') {
      const captionContent = item.content as CaptionContent;
      const captions = captionContent.captions || [];
      content = captions.map((cap, idx) => 
        `=== Caption ${idx + 1} ===\n\n${cap.caption}\n\nHashtags: ${cap.hashtags?.join(' ')}\n\nEmojis: ${cap.emojis?.join(' ')}\n\nEngagement Score: ${cap.engagementScore || 'N/A'}%\nCharacter Count: ${cap.characterCount || 'N/A'}\n`
      ).join('\n---\n\n');
      
      // Add settings info
      if (captionContent.settings) {
        content += `\n=== Settings ===\n`;
        content += `Platform: ${captionContent.settings.platform || 'N/A'}\n`;
        content += `Tone: ${captionContent.settings.tone || 'N/A'}\n`;
        content += `Creativity Level: ${captionContent.settings.creativityLevel || 'N/A'}\n`;
      }
      
    } else if (item.type === 'title') {
      const titleContent = item.content as TitleContent;
      const titles = titleContent.titles || [];
      content = titles.map((title, idx) => 
        `=== Title ${idx + 1} ===\n\nTitle: ${title.title}\n\nDescription: ${title.description}\n\nTags: ${title.tags?.join(', ') || 'None'}\n\nCharacter Count: ${title.characterCount || 'N/A'}\nType: ${title.type || 'N/A'}\n`
      ).join('\n---\n\n');
      
      // Add settings info
      if (titleContent.settings) {
        content += `\n=== Settings ===\n`;
        content += `Topic: ${titleContent.settings.topic || 'N/A'}\n`;
        content += `Tone: ${titleContent.settings.tone || 'N/A'}\n`;
        content += `Content Type: ${titleContent.settings.contentType || 'N/A'}\n`;
        content += `Creativity Level: ${titleContent.settings.creativityLevel || 'N/A'}\n`;
      }
      
    } else if (item.type === 'script') {
      const scriptContent = item.content as ScriptContent;
      const scriptData = scriptContent.script || scriptContent;
      content = `=== YouTube Video Script ===\n\n`;
      content += `🎬 TITLE: ${scriptData.title || 'Untitled'}\n\n`;
      content += `⏱️ TOTAL DURATION: ${scriptData.totalDuration || scriptContent.settings?.duration || 0} minutes\n\n`;
      content += `🎯 TARGET AUDIENCE: ${scriptData.targetAudience || 'General'}\n\n`;
      content += `🎭 TONE: ${scriptContent.settings?.tone || 'Engaging'}\n\n`;
      
      if (scriptData.hook) content += `🎣 HOOK:\n${scriptData.hook}\n\n`;
      
      if (scriptData.sections) {
        content += `📝 SCRIPT SECTIONS:\n\n`;
        scriptData.sections.forEach((section:any, idx:any) => {
          content += `${idx + 1}. ${section.title || `Section ${idx + 1}`}\n`;
          if (section.duration) content += `   Duration: ${section.duration}\n`;
          if (section.content) content += `   Content: ${section.content}\n`;
          if (section.visualCues && section.visualCues.length > 0) {
            content += `   Visual Cues: ${section.visualCues.join(', ')}\n`;
          }
          if (section.audioNotes) content += `   Audio Notes: ${section.audioNotes}\n`;
          content += '\n';
        });
      }
      
      if (scriptData.conclusion) content += `🏁 CONCLUSION:\n${scriptData.conclusion}\n\n`;
      if (scriptData.cta) content += `📢 CALL TO ACTION:\n${scriptData.cta}\n\n`;
      
      if (scriptData.hashtags?.length) {
        content += `🏷️ HASHTAGS:\n${scriptData.hashtags.join(' ')}\n\n`;
      }
      
      if (scriptData.thumbnailIdeas?.length) {
        content += `🖼️ THUMBNAIL IDEAS:\n`;
        scriptData.thumbnailIdeas.forEach((idea:any, idx:any) => {
          content += `${idx + 1}. ${idea}\n`;
        });
      }
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.type}_${(item.userInput || 'untitled').replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Content downloaded! 💾');
  };

  const deleteItem = async (id: number, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      toast.loading('Deleting...');
      setHistory(prev => prev.filter(item => !(item.id === id && item.type === type)));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'caption': return <MessageSquare className="h-4 w-4" />;
      case 'title': return <Type className="h-4 w-4" />;
      case 'script': return <Film className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'caption': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'title': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'script': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getToneColor = (tone: string | null) => {
    if (!tone) return 'bg-gray-100 text-gray-800 border-gray-300';
    
    switch (tone.toLowerCase()) {
      case 'friendly': return 'bg-green-100 text-green-800 border-green-300';
      case 'professional': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'funny': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'inspirational': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'engaging': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Safely get string value
  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Render captions with pagination - Showing 1 caption per card
  const renderCaptionContent = (content: CaptionContent, itemId: number, isExpanded: boolean) => {
    if (!content || !content.captions || !Array.isArray(content.captions)) {
      return <p className="text-gray-500">No caption content available</p>;
    }
    
    const captions = content.captions;
    const currentPage = getCurrentPage(itemId, 'caption');
    const totalPages = getTotalPages(captions, 'caption');
    const paginatedCaptions = getPaginatedItems(captions, itemId, 'caption');
    
    // Get current caption to display
    const currentCaption = paginatedCaptions[0];
    
    if (!currentCaption) {
      return <p className="text-gray-500">No caption found</p>;
    }
    
    return (
      <div className="space-y-4">
        {content.settings?.platform && (
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Platform: {content.settings.platform}</span>
          </div>
        )}
        
        {/* Single Caption Display */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 min-h-[200px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Caption {currentPage} of {captions.length}</span>
                {currentCaption.engagementScore && (
                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {currentCaption.engagementScore}% engagement
                  </Badge>
                )}
              </div>
              {currentCaption.characterCount && (
                <span className="text-xs text-gray-500">{currentCaption.characterCount} chars</span>
              )}
            </div>
            
            <p className="mb-3 text-gray-800 text-lg leading-relaxed">{getStringValue(currentCaption.caption)}</p>
            
            {currentCaption.hashtags && currentCaption.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {currentCaption.hashtags.map((tag, tagIdx) => (
                  <span key={tagIdx} className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full">
                    {getStringValue(tag)}
                  </span>
                ))}
              </div>
            )}
            
            {currentCaption.emojis && currentCaption.emojis.length > 0 && (
              <div className="flex gap-2 text-2xl">
                {currentCaption.emojis.map((emoji, emojiIdx) => (
                  <span key={emojiIdx} className="cursor-pointer hover:scale-110 transition-transform">
                    {getStringValue(emoji)}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination for Captions - Small compact version */}
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(itemId, 'caption', currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{currentPage}</span> / {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(itemId, 'caption', currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {totalPages > 2 && (
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 4) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 2) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNumber = totalPages - 3 + i;
                    } else {
                      pageNumber = currentPage - 1 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(itemId, 'caption', pageNumber)}
                        className={`w-8 h-8 text-sm rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="text-center text-xs text-gray-500 mt-2">
                Showing caption {currentPage} of {captions.length}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render titles with pagination - Showing 1 title per card
  const renderTitleContent = (content: TitleContent, itemId: number, isExpanded: boolean) => {
    if (!content || !content.titles || !Array.isArray(content.titles)) {
      return <p className="text-gray-500">No title content available</p>;
    }
    
    const titles = content.titles;
    const currentPage = getCurrentPage(itemId, 'title');
    const totalPages = getTotalPages(titles, 'title');
    const paginatedTitles = getPaginatedItems(titles, itemId, 'title');
    
    // Get current title to display
    const currentTitle = paginatedTitles[0];
    
    if (!currentTitle) {
      return <p className="text-gray-500">No title found</p>;
    }
    
    return (
      <div className="space-y-4">
        {content.settings?.topic && (
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Topic: {content.settings.topic}</span>
          </div>
        )}
        
        {/* Single Title Display */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200 hover:border-blue-300 transition-all min-h-[200px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Type className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-bold text-lg text-blue-900">{getStringValue(currentTitle.title)}</h4>
              </div>
              {currentTitle.characterCount && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                  {currentTitle.characterCount} chars
                </Badge>
              )}
            </div>
            
            <p className="mb-3 text-gray-600 leading-relaxed">{getStringValue(currentTitle.description)}</p>
            
            {currentTitle.tags && currentTitle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentTitle.tags.map((tag, tagIdx) => (
                  <span key={tagIdx} className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                    {getStringValue(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination for Titles - Small compact version */}
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(itemId, 'title', currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{currentPage}</span> / {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(itemId, 'title', currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {totalPages > 2 && (
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 4) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 2) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNumber = totalPages - 3 + i;
                    } else {
                      pageNumber = currentPage - 1 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(itemId, 'title', pageNumber)}
                        className={`w-8 h-8 text-sm rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="text-center text-xs text-gray-500 mt-2">
                Showing title {currentPage} of {titles.length}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render script content - Collapsible by default, expands on click
  const renderScriptContent = (content: ScriptContent, isExpanded: boolean) => {
    if (!content) return <p className="text-gray-500">No script content available</p>;
    
    const scriptData = content.script || content;
    const settings = content.settings || {};
    const metadata = content.metadata || {};
    
    // If not expanded, show only preview
    if (!isExpanded) {
      return (
        <div className="space-y-4">
          {/* Preview Card */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-5 rounded-xl border border-red-200 min-h-[200px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800">YouTube Script Preview</h4>
                    <p className="text-sm text-red-600">Click "Expand" to view full script</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <Film className="h-3 w-3 mr-1" />
                  Script
                </Badge>
              </div>
              
              <div className="space-y-2">
                {scriptData.title && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{scriptData.title}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  {settings.duration && (
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{settings.duration} min</span>
                    </div>
                  )}
                  
                  {scriptData.sections && (
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{scriptData.sections.length} sections</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                className="w-full"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand to View Full Script
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Expanded view with scrollable container
    return (
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
        {/* YouTube Header Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Play className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">YouTube Video Script</h3>
                <p className="text-red-100 text-sm">{settings.topic || 'Video Content'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {metadata.hasHook && (
                <Badge className="bg-white/20 text-white border-0">
                  <Megaphone className="h-3 w-3 mr-1" />
                  Hook
                </Badge>
              )}
              {metadata.hasCTA && (
                <Badge className="bg-white/20 text-white border-0">
                  <Volume2 className="h-3 w-3 mr-1" />
                  CTA
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {settings.duration && (
              <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
                <Timer className="h-4 w-4" />
                <div>
                  <p className="text-xs text-red-100">Duration</p>
                  <p className="font-semibold">{settings.duration} min</p>
                </div>
              </div>
            )}
            
            {settings.tone && (
              <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
                <Volume2 className="h-4 w-4" />
                <div>
                  <p className="text-xs text-red-100">Tone</p>
                  <p className="font-semibold capitalize">{settings.tone}</p>
                </div>
              </div>
            )}
            
            {settings.videoType && (
              <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
                <Film className="h-4 w-4" />
                <div>
                  <p className="text-xs text-red-100">Type</p>
                  <p className="font-semibold">{settings.videoType}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
              <BarChart className="h-4 w-4" />
              <div>
                <p className="text-xs text-red-100">Sections</p>
                <p className="font-semibold">{metadata.sections || scriptData.sections?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Title */}
        {scriptData.title && (
          <div className="bg-gradient-to-r from-gray-900 to-black text-white p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h4 className="text-lg font-bold">Video Title</h4>
            </div>
            <h2 className="text-2xl font-bold text-center py-3">{scriptData.title}</h2>
            {scriptData.targetAudience && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-300">
                <Users className="h-4 w-4" />
                <span>Target: {scriptData.targetAudience}</span>
              </div>
            )}
          </div>
        )}

        {/* Hook Section */}
        {scriptData.hook && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-5 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Megaphone className="h-5 w-5" />
              <h4 className="text-lg font-bold">Opening Hook</h4>
            </div>
            <p className="text-lg leading-relaxed">{scriptData.hook}</p>
          </div>
        )}

        {/* Script Sections - Limited height when collapsed */}
        {scriptData.sections && scriptData.sections.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <List className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-800">Script Sections</h4>
              <Badge variant="outline" className="ml-auto">
                {scriptData.sections.length} sections
              </Badge>
            </div>
            
            {scriptData.sections.map((section:any, idx:any) => (
              <div key={idx} className="bg-gradient-to-r from-white to-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <span className="text-white font-bold">{idx + 1}</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg text-gray-900">{section.title || `Section ${idx + 1}`}</h5>
                      {section.duration && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-sm text-gray-600">{section.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {section.audioNotes && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Audio Notes
                    </Badge>
                  )}
                </div>
                
                {section.content && (
                  <p className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {section.content}
                  </p>
                )}
                
                {section.visualCues && section.visualCues.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <EyeIcon className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-700">Visual Cues</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {section.visualCues.map((cue:any, cueIdx:any) => (
                        <div key={cueIdx} className="bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg border border-purple-100">
                          <span className="text-sm text-purple-800">{cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Conclusion */}
        {scriptData.conclusion && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5" />
              <h4 className="text-lg font-bold">Conclusion</h4>
            </div>
            <p className="text-lg leading-relaxed">{scriptData.conclusion}</p>
          </div>
        )}

        {/* Call to Action */}
        {scriptData.cta && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h4 className="text-lg font-bold">Call to Action</h4>
            </div>
            <p className="text-lg font-medium leading-relaxed">{scriptData.cta}</p>
          </div>
        )}

        {/* Hashtags */}
        {scriptData.hashtags && scriptData.hashtags.length > 0 && (
          <div className="bg-gray-50 p-5 rounded-xl border">
            <div className="flex items-center gap-3 mb-3">
              <HashIcon className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-bold text-gray-800">Hashtags</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {scriptData.hashtags.map((tag:any, idx:any) => (
                <span key={idx} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Thumbnail Ideas */}
        {scriptData.thumbnailIdeas && scriptData.thumbnailIdeas.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <Image className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-bold text-purple-800">Thumbnail Ideas</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scriptData.thumbnailIdeas.map((idea:any, idx:any) => (
                <div key={idx} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-gray-700">{idea}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render content based on type
  const renderContent = (item: HistoryItem) => {
    if (!item.content) return <p className="text-gray-500">No content available</p>;
    
    const isExpanded = expandedItems.includes(item.id);
    
    switch (item.type) {
      case 'caption':
        return renderCaptionContent(item.content as CaptionContent, item.id, isExpanded);
        
      case 'title':
        return renderTitleContent(item.content as TitleContent, item.id, isExpanded);
        
      case 'script':
        return renderScriptContent(item.content as ScriptContent, isExpanded);
        
      default:
        return (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="text-xs text-gray-500 mb-2">Raw Content:</div>
            <pre className="text-xs overflow-auto max-h-60">
              {JSON.stringify(item.content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">History</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
              Your Content History
            </span>
          </h1>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-gray-600">
              {userEmail ? `Viewing history for ${userEmail}` : 'Your generated content history'}
            </p>
            
            <div className="text-sm text-gray-500">
              {history.length} total items • {filteredHistory.length} filtered
            </div>
          </div>
        </header>

        {/* Filters */}
        <Card className="mb-8 shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="caption">Captions</SelectItem>
                    <SelectItem value="title">Titles</SelectItem>
                    <SelectItem value="script">Video Scripts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Filters</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTab === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTab('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedTab === 'caption' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTab('caption')}
                  >
                    Captions
                  </Button>
                  <Button
                    variant={selectedTab === 'title' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTab('title')}
                  >
                    Titles
                  </Button>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setSelectedTab('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {history.filter(h => h.type === 'caption').length}
              </div>
              <div className="text-sm text-gray-600">Captions</div>
            </Card>
            <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {history.filter(h => h.type === 'title').length}
              </div>
              <div className="text-sm text-gray-600">Titles</div>
            </Card>
            <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {history.filter(h => h.type === 'script').length}
              </div>
              <div className="text-sm text-gray-600">Scripts</div>
            </Card>
            <Card className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
              <div className="text-2xl font-bold text-gray-700">
                {filteredHistory.length}
              </div>
              <div className="text-sm text-gray-600">Filtered</div>
            </Card>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your history...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50/80">
            <CardContent className="py-20 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No History Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || selectedTab !== 'all' 
                  ? 'Try changing your search or filters'
                  : 'Start generating content to see your history here!'}
              </p>
              {!searchTerm && filterType === 'all' && selectedTab === 'all' && (
                <Button onClick={() => window.location.href = '/'}>
                  Generate Content
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div 
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" 
              : "space-y-6"
            }
          >
            <AnimatePresence>
              {filteredHistory.map((item, index) => {
                const isExpanded = expandedItems.includes(item.id);
                const isScriptExpanded = item.type === 'script' && isExpanded;
                
                return (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={isScriptExpanded ? "md:col-span-2 lg:col-span-3" : ""}
                  >
                    <Card className={`h-full border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg ${
                      isScriptExpanded ? "min-h-[400px] max-h-[800px] overflow-hidden flex flex-col" : ""
                    }`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Badge className={`${getTypeColor(item.type)} flex items-center gap-1`}>
                              {getTypeIcon(item.type)}
                              <span className="capitalize">{item.type}</span>
                            </Badge>
                            {item.tone && (
                              <Badge variant="outline" className={`${getToneColor(item.tone)} capitalize`}>
                                {item.tone}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(JSON.stringify(item.content, null, 2))}
                              className="h-8 w-8"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadContent(item)}
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <CardTitle className="text-lg mt-3 line-clamp-2">
                          {item.userInput || `Untitled ${item.type}`}
                        </CardTitle>
                        
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(item.createdOn)}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className={`flex-1 ${isScriptExpanded ? "overflow-auto" : ""}`}>
                        {renderContent(item)}
                      </CardContent>
                      
                      <CardFooter className="border-t pt-4 flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(item.id)}
                          className="flex items-center gap-2"
                        >
                          {expandedItems.includes(item.id) ? (
                            <>
                              <Minimize2 className="h-4 w-4" />
                              Collapse
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-4 w-4" />
                              Expand
                            </>
                          )}
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const baseUrl = item.type === 'caption' ? '/' : 
                                            item.type === 'title' ? '/generate-titles' : 
                                            '/generate-scripts';
                              window.location.href = baseUrl;
                            }}
                          >
                            Regenerate
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem(item.id, item.type)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {/* Pagination Note */}
        {filteredHistory.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            Showing {filteredHistory.length} of {history.length} items
            {filteredHistory.length < history.length && ' • Some items may be hidden by filters'}
          </div>
        )}
      </div>
    </div>
  );
}