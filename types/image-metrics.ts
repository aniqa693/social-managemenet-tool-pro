// types/image-metrics.ts
export type ImageMetrics = {
  brightness: number;
  contrast: number;
  sharpness: number;
  colorVibrancy: number;
  composition: number;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  entropy: number;
  noise: number;
  overall?: number; // Optional calculated overall score
};

export type Improvements = {
  brightness: number;
  contrast: number;
  sharpness: number;
  colorVibrancy: number;
  composition: number;
  fileSize: number;
  overall: number;
};

export type EnhancedPostWithMetrics = {
  id: number;
  originalImageUrl: string;
  enhancedImageUrl: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';
  enhancementType: string;
  userInput?: string;
  createdOn: string;
  metrics?: {
    original: ImageMetrics;
    enhanced: ImageMetrics;
    improvements: Improvements;
  };
};

// Platform types
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';

export type PlatformConfig = {
  name: string;
  icon: any;
  color: string;
  size: string;
  dimensions: {
    width: number;
    height: number;
  };
};

// Enhancement result type from API
export type EnhancementResult = {
  success: boolean;
  originalUrl: string;
  enhancedUrl: string;
  postId: number;
  platform: string;
  enhancementType: string;
  metrics: {
    original: ImageMetrics;
    enhanced: ImageMetrics;
    improvements: Improvements;
  };
};