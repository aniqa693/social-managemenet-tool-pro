// app/dashboard/enhance-post/page.tsx (updated)
'use client';

import { Upload, ImagePlus, X, Loader2, Download, Sparkles, Instagram, Facebook, Settings, Wand2, Sun, Droplets, Crop, Image as ImageIcon, Type, Sparkle, RotateCw, FlipHorizontal, FlipVertical, Square, Frame, Sliders, Palette, Maximize2, Minimize2, Percent, Shield, Globe, Twitter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import EnhancedPostList from '../../../../../../components/dashboard/enhanced-post-list';
import Link from 'next/link';
import { useToast } from '../../../../../../hooks/use-toast';
import { useSession } from '../../../../../../lib/auth-client';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';

interface Enhancement {
  id: string;
  label: string;
  icon: any;
  description: string;
  category: 'basic' | 'creative' | 'social';
}

const ENHANCEMENTS: Enhancement[] = [
  // Basic Adjustments
  { id: 'basic', label: 'Basic Adjustments', icon: Sliders, description: 'Brightness, Contrast, Saturation', category: 'basic' },
  { id: 'crop', label: 'Crop & Resize', icon: Crop, description: 'Crop to any aspect ratio', category: 'basic' },
  { id: 'rotate', label: 'Rotate & Flip', icon: RotateCw, description: 'Rotate, flip horizontal/vertical', category: 'basic' },
  { id: 'filters', label: 'Filters', icon: Palette, description: 'Instagram-like filters', category: 'creative' },
  { id: 'overlay', label: 'Add Text', icon: Type, description: 'Add text overlays', category: 'creative' },
  { id: 'borders', label: 'Borders & Frames', icon: Square, description: 'Add borders, rounded corners', category: 'creative' },
  { id: 'optimize', label: 'Social Optimize', icon: Globe, description: 'Optimize for social platforms', category: 'social' },
];

const PLATFORMS = {
  instagram: { name: 'Instagram', icon: Instagram, color: 'from-purple-600 to-pink-600', size: '1080x1080' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-indigo-600', size: '1200x630' },
//   twitter: { name: 'Twitter', icon: Twitter, color: 'from-sky-400 to-blue-500', size: '1024x512' },
//   linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800', size: '1104x736' },
//   pinterest: { name: 'Pinterest', icon: Pinterest, color: 'from-red-600 to-red-700', size: '1000x1500' },
};

const FILTERS = [
  'vintage', 'summer', 'cool', 'warm', 'b&w', 'sepia',
  'clarendon', 'gingham', 'moon', 'lark', 'reyes'
];

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square 1:1' },
  { value: '4:5', label: 'Portrait 4:5' },
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '9:16', label: 'Story 9:16' },
  { value: '2:1', label: 'Twitter 2:1' },
  { value: '1.91:1', label: 'Facebook 1.91:1' },
];

export default function PostEnhancerPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [selectedEnhancement, setSelectedEnhancement] = useState<string>('basic');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string>();
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Enhancement settings
  const [settings, setSettings] = useState({
    // Basic adjustments
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sharpness: 0.5,
    blur: 0,
    grayscale: false,
    sepia: false,
    invert: false,
    
    // Crop & resize
    aspectRatio: '1:1',
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    
    // Rotate & flip
    rotate: 0,
    flip: false,
    flop: false,
    
    // Filters
    filterName: '',
    
    // Text overlay
    text: '',
    textPosition: 'bottom' as 'top' | 'center' | 'bottom',
    fontSize: 40,
    fontColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    textShadow: true,
    
    // Borders & frames
    borderWidth: 0,
    borderColor: '#ffffff',
    borderRadius: 0,
    shadow: false,
    padding: 0,
    
    // Optimization
    quality: 80,
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const userEmail = session?.user?.email;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    if (originalImagePreview) URL.revokeObjectURL(originalImagePreview);
    
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(file);
    setOriginalImagePreview(previewUrl);
    setEnhancedImageUrl('');
  };

  const clearImage = () => {
    if (originalImagePreview) URL.revokeObjectURL(originalImagePreview);
    setOriginalImagePreview(undefined);
    setOriginalImage(null);
    setEnhancedImageUrl('');
    setOriginalImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnhance = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please login to enhance images",
        variant: "destructive",
      });
      return;
    }

    if (!originalImage) {
      toast({
        title: "Image required",
        description: "Please upload an image to enhance",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', originalImage);
    formData.append('platform', selectedPlatform);
    formData.append('enhancementType', selectedEnhancement);
    formData.append('settings', JSON.stringify(settings));
    
    try {
      const result = await axios.post('/api/enhance-post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setEnhancedImageUrl(result.data.enhancedUrl);
      setOriginalImageUrl(result.data.originalUrl);
      
      toast({
        title: "Success",
        description: "Image enhanced successfully!",
      });
      
      setRefreshTrigger(prev => prev + 1);
      
    } catch (e: any) {
      console.error('Enhancement error:', e);
      toast({
        title: "Error",
        description: e.response?.data?.error || "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadEnhanced = async () => {
    if (!enhancedImageUrl) {
      toast({
        title: "Error",
        description: "No enhanced image to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(enhancedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-${selectedPlatform}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Post Enhancer
          </h1>
        </div>
        
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
          Enhance your images with professional tools - no AI models needed!
        </p>
        
        {!isLoggedIn && (
          <Link href="/auth">
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
              Login to Enhance
            </button>
          </Link>
        )}
      </div>

      {/* Platform Selector */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(PLATFORMS).map(([key, platform]) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPlatform(key as Platform)}
                disabled={!isLoggedIn || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-r ${platform.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className="h-4 w-4" />
                {platform.name}
                <span className="text-xs opacity-75 ml-1">{platform.size}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Image Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-purple-600" />
              Original Image
            </h3>
            
            {!originalImagePreview ? (
              <label 
                htmlFor="image-upload"
                className={`block border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 transition-all duration-200 cursor-pointer bg-white group ${!isLoggedIn || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="aspect-square flex flex-col items-center justify-center p-8">
                  <div className="p-4 bg-purple-100 rounded-full mb-4 group-hover:bg-purple-200 transition-colors">
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Click to upload</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </label>
            ) : (
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-300">
                <Image 
                  src={originalImagePreview} 
                  alt="Original"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              id="image-upload" 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*"
              disabled={!isLoggedIn || loading}
            />
          </div>

          {/* Enhanced Image Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-pink-600" />
              Enhanced Image
            </h3>
            
            {loading ? (
              <div className="aspect-square rounded-xl border-2 border-purple-200 flex flex-col items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-gray-600">Enhancing your image...</p>
              </div>
            ) : enhancedImageUrl ? (
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-400 group">
                <Image 
                  src={enhancedImageUrl} 
                  alt="Enhanced"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={downloadEnhanced}
                    className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-110"
                  >
                    <Download className="h-6 w-6 text-purple-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center bg-purple-50">
                <ImageIcon className="h-12 w-12 text-purple-300 mb-3" />
                <p className="text-gray-500">Enhanced image will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhancement Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Enhancement Tools
          </h3>

          {/* Enhancement Categories */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedEnhancement('basic')}
                className={`px-4 py-2 rounded-lg ${selectedEnhancement === 'basic' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Basic
              </button>
              <button
                onClick={() => setSelectedEnhancement('creative')}
                className={`px-4 py-2 rounded-lg ${selectedEnhancement === 'creative' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Creative
              </button>
              <button
                onClick={() => setSelectedEnhancement('social')}
                className={`px-4 py-2 rounded-lg ${selectedEnhancement === 'social' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Social
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ENHANCEMENTS.filter(e => e.category === selectedEnhancement).map((enhancement) => {
                const Icon = enhancement.icon;
                const isSelected = selectedEnhancement === enhancement.id;
                return (
                  <button
                    key={enhancement.id}
                    onClick={() => setSelectedEnhancement(enhancement.id)}
                    disabled={!originalImage || loading}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 bg-gradient-to-br from-white to-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`} />
                    <div className="font-medium text-xs text-center">{enhancement.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings based on selected enhancement */}
          <div className="space-y-4">
            {/* Basic Adjustments */}
            {selectedEnhancement === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brightness: {settings.brightness.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.brightness}
                    onChange={(e) => setSettings({...settings, brightness: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saturation: {settings.saturation.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.saturation}
                    onChange={(e) => setSettings({...settings, saturation: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sharpness: {settings.sharpness.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.sharpness}
                    onChange={(e) => setSettings({...settings, sharpness: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blur: {settings.blur}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={settings.blur}
                    onChange={(e) => setSettings({...settings, blur: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.grayscale}
                      onChange={(e) => setSettings({...settings, grayscale: e.target.checked})}
                    />
                    <span className="text-sm">Grayscale</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sepia}
                      onChange={(e) => setSettings({...settings, sepia: e.target.checked})}
                    />
                    <span className="text-sm">Sepia</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.invert}
                      onChange={(e) => setSettings({...settings, invert: e.target.checked})}
                    />
                    <span className="text-sm">Invert</span>
                  </label>
                </div>
              </div>
            )}

            {/* Crop & Resize */}
            {selectedEnhancement === 'crop' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setSettings({...settings, aspectRatio: ratio.value})}
                        className={`px-3 py-1 rounded-full border text-sm ${
                          settings.aspectRatio === ratio.value
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={settings.width || ''}
                      onChange={(e) => setSettings({...settings, width: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="Auto"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={settings.height || ''}
                      onChange={(e) => setSettings({...settings, height: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="Auto"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rotate & Flip */}
            {selectedEnhancement === 'rotate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rotate: {settings.rotate}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="90"
                    value={settings.rotate}
                    onChange={(e) => setSettings({...settings, rotate: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSettings({...settings, rotate: 0})}
                      className="px-3 py-1 bg-gray-100 rounded-lg text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.flip}
                      onChange={(e) => setSettings({...settings, flip: e.target.checked})}
                    />
                    <FlipVertical className="h-4 w-4" />
                    <span className="text-sm">Flip Vertical</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.flop}
                      onChange={(e) => setSettings({...settings, flop: e.target.checked})}
                    />
                    <FlipHorizontal className="h-4 w-4" />
                    <span className="text-sm">Flip Horizontal</span>
                  </label>
                </div>
              </div>
            )}

            {/* Filters */}
            {selectedEnhancement === 'filters' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSettings({...settings, filterName: ''})}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      !settings.filterName
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    None
                  </button>
                  {FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSettings({...settings, filterName: filter})}
                      className={`px-3 py-1 rounded-full border text-sm ${
                        settings.filterName === filter
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Overlay */}
            {selectedEnhancement === 'overlay' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text
                  </label>
                  <input
                    type="text"
                    value={settings.text}
                    onChange={(e) => setSettings({...settings, text: e.target.value})}
                    placeholder="Enter text to add..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={settings.textPosition}
                    onChange={(e) => setSettings({...settings, textPosition: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={settings.fontSize}
                      onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={settings.fontColor}
                      onChange={(e) => setSettings({...settings, fontColor: e.target.value})}
                      className="w-full h-10"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.textShadow}
                    onChange={(e) => setSettings({...settings, textShadow: e.target.checked})}
                  />
                  <span className="text-sm">Add text shadow</span>
                </label>
              </div>
            )}

            {/* Borders & Frames */}
            {selectedEnhancement === 'borders' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Width: {settings.borderWidth}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={settings.borderWidth}
                    onChange={(e) => setSettings({...settings, borderWidth: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => setSettings({...settings, borderColor: e.target.value})}
                    className="w-full h-10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius: {settings.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.borderRadius}
                    onChange={(e) => setSettings({...settings, borderRadius: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padding: {settings.padding}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.padding}
                    onChange={(e) => setSettings({...settings, padding: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.shadow}
                    onChange={(e) => setSettings({...settings, shadow: e.target.checked})}
                  />
                  <span className="text-sm">Add drop shadow</span>
                </label>
              </div>
            )}

            {/* Social Optimize */}
            {selectedEnhancement === 'optimize' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality: {settings.quality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.quality}
                    onChange={(e) => setSettings({...settings, quality: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher quality = larger file size
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Platform Presets:</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Instagram:</span> 1080x1080px</p>
                    <p><span className="font-semibold">Facebook:</span> 1200x630px</p>
                    <p><span className="font-semibold">Twitter:</span> 1024x512px</p>
                    <p><span className="font-semibold">LinkedIn:</span> 1104x736px</p>
                    <p><span className="font-semibold">Pinterest:</span> 1000x1500px</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={loading || !isLoggedIn || !originalImage}
            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Apply Enhancements
              </>
            )}
          </button>
        </div>

        {/* Post List */}
        <EnhancedPostList refreshTrigger={refreshTrigger} selectedPlatform={selectedPlatform} />
      </div>
    </div>
  );
}