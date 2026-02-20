// components/dashboard/enhanced-post-list.tsx
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { 
  Download, Eye, Sparkles, RefreshCw, Instagram, Facebook, Wand2, Clock, X, 
  Sparkle, Split, Image as ImageIcon, ArrowLeft, ArrowRight, Maximize2, 
  TrendingUp, Activity, BarChart3, Award, Target, Gauge, 
  Star, CheckCircle2, ArrowUp, ArrowDown, Minus, Sun, Contrast, 
  Palette, Crop, Zap, HardDrive, Sigma, Waves
} from 'lucide-react';
import { useSession } from '../../lib/auth-client';
import { EnhancedPostWithMetrics,ImageMetrics,Improvements } from '../../types/image-metrics';

// Metric Card Component with real data
const MetricCard = ({ 
  label, 
  value, 
  previousValue,
  icon: Icon, 
  improvement,
  color = 'purple',
  unit = ''
}: { 
  label: string; 
  value: number; 
  previousValue?: number;
  icon: any; 
  improvement?: number;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  unit?: string;
}) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  const getImprovementIcon = () => {
    if (!improvement) return <Minus className="h-3 w-3" />;
    if (improvement > 0) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (improvement < 0) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getImprovementColor = () => {
    if (!improvement) return 'text-gray-500';
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        {improvement !== undefined && (
          <div className="flex items-center gap-0.5">
            {getImprovementIcon()}
            <span className={`text-xs ${getImprovementColor()}`}>
              {improvement > 0 ? '+' : ''}{improvement}%
            </span>
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-bold">
          {Math.round(value)}{unit}
        </span>
        {previousValue && (
          <span className="text-xs text-gray-500">
            was {Math.round(previousValue)}{unit}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color].split(' ')[1]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
};

// Performance Gauge Component
const PerformanceGauge = ({ value, size = 'md', label }: { value: number; size?: 'sm' | 'md' | 'lg'; label?: string }) => {
  const radius = size === 'sm' ? 30 : size === 'md' ? 40 : 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (val: number) => {
    if (val >= 80) return '#10b981'; // green
    if (val >= 60) return '#f59e0b'; // orange
    if (val >= 40) return '#f97316'; // orange-red
    return '#ef4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2 + 20} height={radius * 2 + 20}>
        <circle
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={size === 'sm' ? 6 : 8}
        />
        <circle
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={size === 'sm' ? 6 : 8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + 10} ${radius + 10})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
          {Math.round(value)}
        </span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
};

// Before/After Slider Component with Real Metrics
const BeforeAfterSlider = ({ 
  before, 
  after,
  metrics,
  improvements
}: { 
  before: string; 
  after: string;
  metrics: {
    original: ImageMetrics;
    enhanced: ImageMetrics;
  };
  improvements: Improvements;
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLDivElement>(null);
  const afterImageRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
    
    if (beforeImageRef.current && afterImageRef.current) {
      beforeImageRef.current.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      afterImageRef.current.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', (e) => {
      if (isDragging) handleMove(e.clientX);
    });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', (e) => {
        if (isDragging) handleMove(e.clientX);
      });
    };
  }, [isDragging]);

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden rounded-lg cursor-ew-resize select-none group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onMouseEnter={() => setShowMetrics(true)}
        onMouseLeave={() => setShowMetrics(false)}
      >
        {/* After Image (Enhanced) */}
        <div ref={afterImageRef} className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
          <Image
            src={after}
            alt="After"
            fill
            className="object-cover pointer-events-none"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Zap className="h-3 w-3" />
            +{improvements.overall}% Better
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            {/* Score: {Math.round(metrics.enhanced.overall)} */}
          </div>
        </div>

        {/* Before Image (Original) */}
        <div ref={beforeImageRef} className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
          <Image
            src={before}
            alt="Before"
            fill
            className="object-cover pointer-events-none"
          />
          <div className="absolute top-2 left-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            Original
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            {/* Score: {Math.round(metrics.original.overall)} */}
          </div>
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex gap-1">
              <ArrowLeft className="w-3 h-3 text-gray-600" />
              <ArrowRight className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Hover Performance Summary */}
        {showMetrics && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm z-20 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-yellow-400" />
              <span>+{improvements.brightness}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Contrast className="h-3 w-3 text-blue-400" />
              <span>+{improvements.contrast}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-400" />
              <span>+{improvements.sharpness}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3 text-pink-400" />
              <span>+{improvements.colorVibrancy}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-5 gap-2">
        <div className="text-center">
          <div className="text-xs text-gray-500">Brightness</div>
          <div className="text-sm font-semibold text-purple-600">{Math.round(metrics.enhanced.brightness)}</div>
          <div className="text-xs text-green-600">↑{improvements.brightness}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Contrast</div>
          <div className="text-sm font-semibold text-blue-600">{Math.round(metrics.enhanced.contrast)}</div>
          <div className="text-xs text-green-600">↑{improvements.contrast}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Sharpness</div>
          <div className="text-sm font-semibold text-green-600">{Math.round(metrics.enhanced.sharpness)}</div>
          <div className="text-xs text-green-600">↑{improvements.sharpness}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Color</div>
          <div className="text-sm font-semibold text-orange-600">{Math.round(metrics.enhanced.colorVibrancy)}</div>
          <div className="text-xs text-green-600">↑{improvements.colorVibrancy}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Size</div>
          <div className="text-sm font-semibold text-gray-600">
            {(metrics.enhanced.fileSize / 1024).toFixed(1)}KB
          </div>
          <div className="text-xs text-green-600">↓{improvements.fileSize}%</div>
        </div>
      </div>
    </div>
  );
};

// Comparison Modal with Real Metrics
const ComparisonModal = ({ 
  post, 
  onClose 
}: { 
  post: EnhancedPostWithMetrics; 
  onClose: () => void;
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'metrics' | 'analysis'>('slider');
  
  if (!post.metrics) return null;

  const { original, enhanced, improvements } = post.metrics;
  const overallImprovement = improvements.overall;

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Performance Analysis</h3>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'slider' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <Split className="h-4 w-4" />
                Compare
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'side-by-side' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('metrics')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'metrics' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Metrics
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  viewMode === 'analysis' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                }`}
              >
                <Activity className="h-4 w-4" />
                Analysis
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Performance Header */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Overall Performance</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-bold text-gray-800">
                    {Math.round((enhanced.brightness + enhanced.contrast + enhanced.sharpness + enhanced.colorVibrancy + enhanced.composition) / 5)}
                  </span>
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+{overallImprovement}% improvement</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Original Size: {(original.fileSize / 1024).toFixed(1)}KB</span>
                  <span>Enhanced Size: {(enhanced.fileSize / 1024).toFixed(1)}KB</span>
                  <span className="text-green-600">↓{improvements.fileSize}% smaller</span>
                </div>
              </div>
              <PerformanceGauge 
                value={(enhanced.brightness + enhanced.contrast + enhanced.sharpness + enhanced.colorVibrancy + enhanced.composition) / 5} 
                size="md" 
              />
            </div>
          </div>

          {/* Main View */}
          {viewMode === 'slider' && (
            <BeforeAfterSlider 
              before={post.originalImageUrl} 
              after={post.enhancedImageUrl}
              metrics={{ original, enhanced }}
              improvements={improvements}
            />
          )}

          {viewMode === 'side-by-side' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Original Image
                </h4>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image 
                    src={post.originalImageUrl}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Quality Score</div>
                    <div className="text-sm font-semibold">
                      {Math.round((original.brightness + original.contrast + original.sharpness + original.colorVibrancy + original.composition) / 5)}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Size</div>
                    <div className="text-sm font-semibold">{(original.fileSize / 1024).toFixed(1)}KB</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Enhanced Image
                </h4>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-200">
                  <Image 
                    src={post.enhancedImageUrl}
                    alt="Enhanced"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-xs text-green-600">Quality Score</div>
                    <div className="text-sm font-semibold text-green-700">
                      {Math.round((enhanced.brightness + enhanced.contrast + enhanced.sharpness + enhanced.colorVibrancy + enhanced.composition) / 5)}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-xs text-green-600">Improvement</div>
                    <div className="text-sm font-semibold text-green-700">+{overallImprovement}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard 
                  label="Brightness"
                  value={enhanced.brightness}
                  previousValue={original.brightness}
                  icon={Sun}
                  improvement={improvements.brightness}
                  color="purple"
                  unit="%"
                />
                <MetricCard 
                  label="Contrast"
                  value={enhanced.contrast}
                  previousValue={original.contrast}
                  icon={Contrast}
                  improvement={improvements.contrast}
                  color="blue"
                  unit="%"
                />
                <MetricCard 
                  label="Sharpness"
                  value={enhanced.sharpness}
                  previousValue={original.sharpness}
                  icon={Target}
                  improvement={improvements.sharpness}
                  color="green"
                  unit="%"
                />
                <MetricCard 
                  label="Color Vibrancy"
                  value={enhanced.colorVibrancy}
                  previousValue={original.colorVibrancy}
                  icon={Palette}
                  improvement={improvements.colorVibrancy}
                  color="orange"
                  unit="%"
                />
                <MetricCard 
                  label="Composition"
                  value={enhanced.composition}
                  previousValue={original.composition}
                  icon={Crop}
                  improvement={improvements.composition}
                 // color="pink"
                  unit="%"
                />
                <MetricCard 
                  label="File Size"
                  value={enhanced.fileSize / 1024}
                  previousValue={original.fileSize / 1024}
                  icon={HardDrive}
                  improvement={improvements.fileSize}
                  color="red"
                  unit="KB"
                />
              </div>

              {/* Advanced Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Sigma className="h-4 w-4" />
                    <span>Image Entropy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">{Math.round(enhanced.entropy)}%</span>
                    <span className="text-xs text-gray-500">was {Math.round(original.entropy)}%</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Measures image complexity/detail</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Waves className="h-4 w-4" />
                    <span>Noise Level</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">{Math.round(100 - enhanced.noise)}%</span>
                    <span className="text-xs text-gray-500">was {Math.round(100 - original.noise)}%</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Lower is better</div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'analysis' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Performance Insights</h4>
              
              {/* Key Improvements */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(improvements)
                  .filter(([key]) => key !== 'overall' && key !== 'fileSize')
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-600 mb-1 capitalize">{key}</div>
                      <div className="text-xl font-bold text-green-700">+{value}%</div>
                      <div className="text-xs text-gray-500 mt-1">improvement</div>
                    </div>
                  ))}
              </div>

              {/* Detailed Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h5 className="text-sm font-medium text-gray-700">Image Quality Analysis</h5>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Brightness Level:</span>
                    <span className={enhanced.brightness > 70 ? 'text-green-600' : 'text-orange-600'}>
                      {enhanced.brightness > 70 ? 'Optimal' : 'Needs Adjustment'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Contrast Ratio:</span>
                    <span className={enhanced.contrast > 60 ? 'text-green-600' : 'text-orange-600'}>
                      {enhanced.contrast > 60 ? 'Good' : 'Low'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Sharpness:</span>
                    <span className={enhanced.sharpness > 65 ? 'text-green-600' : 'text-orange-600'}>
                      {enhanced.sharpness > 65 ? 'Sharp' : 'Soft'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Color Vibrancy:</span>
                    <span className={enhanced.colorVibrancy > 60 ? 'text-green-600' : 'text-orange-600'}>
                      {enhanced.colorVibrancy > 60 ? 'Vibrant' : 'Dull'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Composition:</span>
                    <span className={enhanced.composition > 65 ? 'text-green-600' : 'text-orange-600'}>
                      {enhanced.composition > 65 ? 'Well Balanced' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-purple-700 mb-2">Recommendations</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  {enhanced.brightness < 60 && (
                    <li className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-purple-500" />
                      Increase brightness for better visibility
                    </li>
                  )}
                  {enhanced.contrast < 55 && (
                    <li className="flex items-center gap-2">
                      <Contrast className="h-4 w-4 text-purple-500" />
                      Boost contrast to make details pop
                    </li>
                  )}
                  {enhanced.sharpness < 60 && (
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      Apply sharpening for clearer details
                    </li>
                  )}
                  {enhanced.colorVibrancy < 55 && (
                    <li className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-purple-500" />
                      Increase saturation for more vibrant colors
                    </li>
                  )}
                  {enhanced.composition < 60 && (
                    <li className="flex items-center gap-2">
                      <Crop className="h-4 w-4 text-purple-500" />
                      Consider cropping for better composition
                    </li>
                  )}
                  {enhanced.fileSize > original.fileSize && (
                    <li className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-purple-500" />
                      Compress image for faster loading
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Download Buttons */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => downloadImage(post.originalImageUrl, `original-${post.id}.jpg`)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Original ({(original.fileSize / 1024).toFixed(1)}KB)
          </button>
          <button
            onClick={() => downloadImage(post.enhancedImageUrl, `enhanced-${post.id}.jpg`)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Enhanced (+{overallImprovement}%) ({(enhanced.fileSize / 1024).toFixed(1)}KB)
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Image Card with Real Metrics
const EnhancedImageCard = ({ 
  post, 
  onViewComparison 
}: { 
  post: EnhancedPostWithMetrics; 
  onViewComparison: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Calculate overall score from metrics if available
  const overallScore = post.metrics 
    ? Math.round((post.metrics.enhanced.brightness + post.metrics.enhanced.contrast + 
                  post.metrics.enhanced.sharpness + post.metrics.enhanced.colorVibrancy + 
                  post.metrics.enhanced.composition) / 5)
    : 85; // Fallback
    
  const improvement = post.metrics?.improvements.overall || 15;

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? Instagram : Facebook;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'instagram' 
      ? 'from-purple-600 to-pink-600' 
      : 'from-blue-600 to-indigo-600';
  };

  const getEnhancementLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      basic: 'Basic Adjustments',
      crop: 'Cropped',
      rotate: 'Rotated',
      filters: 'Filter Applied',
      overlay: 'Text Added',
      borders: 'Borders Added',
      optimize: 'Optimized',
    };
    return labels[type] || type;
  };

  const PlatformIcon = getPlatformIcon(post.platform);
  const platformColor = getPlatformColor(post.platform);

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-purple-100"
      onMouseEnter={() => setShowMetrics(true)}
      onMouseLeave={() => setShowMetrics(false)}
    >
      <div className="relative">
        {/* Platform Badge */}
        <div className={`absolute top-2 left-2 z-10 px-2 py-1 bg-gradient-to-r ${platformColor} text-white text-xs rounded-full flex items-center gap-1 shadow-lg`}>
          <PlatformIcon className="h-3 w-3" />
          <span>{post.platform}</span>
        </div>
        
        {/* Performance Badge */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1 shadow-lg">
          <Zap className="h-3 w-3" />
          <span>+{improvement}%</span>
        </div>

        {/* Quality Score Badge */}
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
          <Award className="h-3 w-3 text-yellow-400" />
          <span>Score: {overallScore}</span>
        </div>

        {/* Enhancement Type Badge */}
        <div className="absolute bottom-2 right-2 z-10 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1 backdrop-blur-sm">
          <Wand2 className="h-3 w-3" />
          <span>{getEnhancementLabel(post.enhancementType)}</span>
        </div>

        {/* Metrics Overlay - Shows on Hover */}
        {showMetrics && post.metrics && (
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4">
            <div className="text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Quality Score</span>
                <span className="text-sm font-bold text-green-400">{overallScore}/100</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Brightness</span>
                  <span>{Math.round(post.metrics.enhanced.brightness)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${post.metrics.enhanced.brightness}%` }} />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span>Contrast</span>
                  <span>{Math.round(post.metrics.enhanced.contrast)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${post.metrics.enhanced.contrast}%` }} />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span>Sharpness</span>
                  <span>{Math.round(post.metrics.enhanced.sharpness)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${post.metrics.enhanced.sharpness}%` }} />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs mt-2">
                <span>File Size</span>
                <span>{(post.metrics.enhanced.fileSize / 1024).toFixed(1)}KB</span>
              </div>
              
              <button
                onClick={onViewComparison}
                className="mt-2 w-full bg-white/20 hover:bg-white/30 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                View Detailed Analysis
              </button>
            </div>
          </div>
        )}

        {/* Image with Loading State */}
        <div className="relative aspect-square bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <Image 
            src={post.enhancedImageUrl} 
            alt={post.userInput || 'Enhanced image'}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
      
      {/* Footer Info with Quick Stats */}
      <div className="p-3 bg-gradient-to-r from-white to-purple-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(post.createdOn).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">{overallScore}</span>
          </div>
        </div>
        {post.metrics && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Size: {(post.metrics.enhanced.fileSize / 1024).toFixed(1)}KB</span>
            <span className="text-green-600">↓{post.metrics.improvements.fileSize}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
function EnhancedPostList({ refreshTrigger, selectedPlatform }: { refreshTrigger?: number; selectedPlatform?: string }) {
  const [postList, setPostList] = useState<EnhancedPostWithMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'instagram' | 'facebook'>('all');
  const [selectedPost, setSelectedPost] = useState<EnhancedPostWithMetrics | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [stats, setStats] = useState({ 
    total: 0, 
    instagram: 0, 
    facebook: 0, 
    avgImprovement: 0,
    avgScore: 0,
    totalSizeSaved: 0 
  });
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const getPostList = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      const result = await axios.get('/api/enhance-post');
      const posts = result.data;
      setPostList(posts);
      
      // Calculate real stats from metrics
      let totalImprovement = 0;
      let totalScore = 0;
      let totalSizeSaved = 0;
      let postsWithMetrics = 0;
      
      posts.forEach((post: EnhancedPostWithMetrics) => {
        if (post.metrics) {
          totalImprovement += post.metrics.improvements.overall;
          totalScore += (post.metrics.enhanced.brightness + post.metrics.enhanced.contrast + 
                        post.metrics.enhanced.sharpness + post.metrics.enhanced.colorVibrancy + 
                        post.metrics.enhanced.composition) / 5;
          totalSizeSaved += (post.metrics.original.fileSize - post.metrics.enhanced.fileSize);
          postsWithMetrics++;
        }
      });
      
      const insta = posts.filter((p: EnhancedPostWithMetrics) => p.platform === 'instagram').length;
      const fb = posts.filter((p: EnhancedPostWithMetrics) => p.platform === 'facebook').length;
      
      setStats({
        total: posts.length,
        instagram: insta,
        facebook: fb,
        avgImprovement: postsWithMetrics > 0 ? Math.round(totalImprovement / postsWithMetrics) : 0,
        avgScore: postsWithMetrics > 0 ? Math.round(totalScore / postsWithMetrics) : 0,
        totalSizeSaved: Math.round(totalSizeSaved / 1024) // Convert to KB
      });
      
      console.log('📋 Loaded enhanced posts:', posts.length);
    } catch (error) {
      console.error('Error fetching enhanced posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getPostList();
    }
  }, [isLoggedIn, refreshTrigger]);

  const filteredPosts = filter === 'all' 
    ? postList 
    : postList.filter(post => post.platform === filter);

  if (!isLoggedIn) {
    return (
      <div className='mt-10 px-4'>
        <div className='text-center py-12 bg-white rounded-2xl shadow-lg border border-purple-100'>
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Login to view your enhanced posts</h3>
          <p className="text-gray-500 mt-1">Please login to see your previously enhanced images.</p>
          <Link href="/auth">
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 px-4'>
      {/* Comparison Modal */}
      {showComparison && selectedPost && (
        <ComparisonModal 
          post={selectedPost} 
          onClose={() => setShowComparison(false)} 
        />
      )}

      {/* Header with Performance Stats */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border border-purple-100'>
        <div className='flex items-center gap-2'>
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <Wand2 className='h-5 w-5 text-purple-600' />
          </div>
          <h2 className='font-bold text-xl text-gray-800'>
            Your Enhanced Posts
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Performance Stats */}
          <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-full">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+{stats.avgImprovement}% avg</span>
            </div>
            <div className="w-px h-4 bg-purple-200"></div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">{stats.avgScore} avg</span>
            </div>
            <div className="w-px h-4 bg-purple-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-purple-700">
                📸 {stats.instagram}
              </span>
              <span className="text-sm text-blue-700">
                👍 {stats.facebook}
              </span>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('instagram')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'instagram' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Instagram className="h-3 w-3" />
              IG ({stats.instagram})
            </button>
            <button
              onClick={() => setFilter('facebook')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'facebook' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Facebook className="h-3 w-3" />
              FB ({stats.facebook})
            </button>
          </div>
          
          <button 
            onClick={getPostList}
            className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {loading ? 
          [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col space-y-3 bg-white p-3 rounded-xl shadow-lg border border-purple-100">
              <Skeleton className="h-40 w-full rounded-lg bg-purple-100" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-purple-100" />
                <Skeleton className="h-4 w-3/4 bg-purple-100" />
              </div>
            </div>
          )) : 
          filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <EnhancedImageCard
                key={post.id}
                post={post}
                onViewComparison={() => {
                  setSelectedPost(post);
                  setShowComparison(true);
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg border border-purple-100">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                <Wand2 className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No enhanced posts yet</h3>
              <p className="text-gray-500">Upload and enhance your first image to see it here!</p>
            </div>
          )
        }
      </div>

      {/* Performance Summary Dashboard */}
      {filteredPosts.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            Performance Dashboard
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Enhancements</div>
              <div className="mt-2 text-xs text-green-600">
                ↑ {Math.round((stats.instagram + stats.facebook) / 7)}% this week
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">+{stats.avgImprovement}%</div>
              <div className="text-sm text-gray-500">Avg. Improvement</div>
              <div className="mt-2 text-xs text-gray-500">Quality score increase</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.avgScore}</div>
              <div className="text-sm text-gray-500">Avg. Quality Score</div>
              <div className="mt-2 text-xs text-purple-600">Out of 100</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalSizeSaved}KB
              </div>
              <div className="text-sm text-gray-500">Total Size Saved</div>
              <div className="mt-2 text-xs text-green-600">Bandwidth optimized</div>
            </div>
          </div>

          {/* Platform Performance */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Instagram Performance</span>
                <Instagram className="h-4 w-4 text-purple-600" />
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${stats.instagram > 0 ? 85 : 0}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Posts: {stats.instagram}</span>
                <span>Avg: 85%</span>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Facebook Performance</span>
                <Facebook className="h-4 w-4 text-blue-600" />
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.facebook > 0 ? 78 : 0}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Posts: {stats.facebook}</span>
                <span>Avg: 78%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPostList;