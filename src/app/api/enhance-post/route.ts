// app/api/enhance-post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { enhancedPostsTable } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from '../../../../lib/auth-server';
import ImageKit from 'imagekit';
import sharp from 'sharp';
import moment from 'moment';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

const getFileBufferData = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const uploadToImageKit = async (buffer: Buffer, fileName: string) => {
  try {
    const res = await imagekit.upload({
      file: buffer.toString('base64'),
      fileName: fileName,
      isPublished: true,
      useUniqueFileName: false,
    });
    return res.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

// ============== IMAGE ANALYSIS FUNCTIONS ==============

// Calculate image metrics for performance comparison
const analyzeImageMetrics = async (imageBuffer: Buffer): Promise<{
  brightness: number;
  contrast: number;
  sharpness: number;
  colorVibrancy: number;
  composition: number;
  fileSize: number;
  dimensions: { width: number; height: number };
  entropy: number; // Image complexity/detail
  noise: number;   // Image noise level
}> => {
  const pipeline = sharp(imageBuffer);
  const metadata = await pipeline.metadata();
  const stats = await pipeline.stats();
  
  // Calculate brightness (average of all channels)
  const brightness = stats.channels.reduce((acc, ch) => acc + ch.mean, 0) / stats.channels.length / 255 * 100;
  
  // Calculate contrast (standard deviation of pixels)
  const contrast = stats.channels.reduce((acc, ch) => acc + ch.stdev, 0) / stats.channels.length / 255 * 100;
  
  // Estimate sharpness using gradient magnitude
  const sharpness = await estimateSharpness(imageBuffer);
  
  // Calculate color vibrancy (saturation)
  const colorVibrancy = await calculateColorVibrancy(imageBuffer);
  
  // Calculate composition score (rule of thirds, balance)
  const composition = await calculateCompositionScore(imageBuffer);
  
  // Calculate image entropy (detail level)
  const entropy = await calculateEntropy(imageBuffer);
  
  // Estimate noise level
  const noise = await estimateNoise(imageBuffer);
  
  return {
    brightness: Math.min(100, Math.max(0, brightness)),
    contrast: Math.min(100, Math.max(0, contrast)),
    sharpness: Math.min(100, Math.max(0, sharpness)),
    colorVibrancy: Math.min(100, Math.max(0, colorVibrancy)),
    composition: Math.min(100, Math.max(0, composition)),
    fileSize: imageBuffer.length,
    dimensions: {
      width: metadata.width || 0,
      height: metadata.height || 0
    },
    entropy,
    noise
  };
};

// Estimate image sharpness using Laplacian variance
const estimateSharpness = async (imageBuffer: Buffer): Promise<number> => {
  try {
    // Convert to grayscale and get raw pixel data
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    // Simple sharpness estimation using local variance
    let totalVariance = 0;
    let samples = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = data[idx];
        
        // Calculate local variance in 3x3 neighborhood
        let localMean = 0;
        let localVariance = 0;
        let neighborCount = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (nIdx >= 0 && nIdx < data.length) {
              localMean += data[nIdx];
              neighborCount++;
            }
          }
        }
        
        if (neighborCount > 0) {
          localMean /= neighborCount;
          localVariance = Math.pow(center - localMean, 2);
          totalVariance += localVariance;
          samples++;
        }
      }
    }
    
    const avgVariance = totalVariance / samples;
    // Normalize to 0-100 scale (typical variance ranges from 0-2500)
    return Math.min(100, (avgVariance / 25) * 100);
  } catch (error) {
    console.error('Sharpness estimation error:', error);
    return 50; // Default value
  }
};

// Calculate color vibrancy (saturation)
const calculateColorVibrancy = async (imageBuffer: Buffer): Promise<number> => {
  try {
    const stats = await sharp(imageBuffer).stats();
    
    // Calculate average saturation using RGB to HSV conversion approximation
    let totalSaturation = 0;
    let pixelCount = 0;
    
    // Sample pixels for efficiency
    const { data, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      // Saturation calculation
      const saturation = max === 0 ? 0 : delta / max;
      totalSaturation += saturation;
      pixelCount++;
      
      // Sample every 10th pixel for performance
      i += 9;
    }
    
    const avgSaturation = pixelCount > 0 ? (totalSaturation / pixelCount) * 100 : 50;
    return Math.min(100, Math.max(0, avgSaturation));
  } catch (error) {
    console.error('Color vibrancy calculation error:', error);
    return 50;
  }
};

// Calculate composition score based on rule of thirds and balance
const calculateCompositionScore = async (imageBuffer: Buffer): Promise<number> => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    // Rule of thirds: divide image into 3x3 grid
    const thirdW = width / 3;
    const thirdH = height / 3;
    
    // Calculate average brightness in each zone
    const zones: number[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        let zoneSum = 0;
        let zonePixels = 0;
        
        const startY = Math.floor(row * thirdH);
        const endY = Math.floor((row + 1) * thirdH);
        const startX = Math.floor(col * thirdW);
        const endX = Math.floor((col + 1) * thirdW);
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = y * width + x;
            zoneSum += data[idx];
            zonePixels++;
          }
        }
        
        zones.push(zonePixels > 0 ? zoneSum / zonePixels : 0);
      }
    }
    
    // Calculate variance between zones (good composition has balanced zones)
    const mean = zones.reduce((a, b) => a + b, 0) / zones.length;
    const variance = zones.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / zones.length;
    
    // Normalize to 0-100 (lower variance = better composition)
    const maxVariance = 65025; // 255^2
    const compositionScore = 100 - (variance / maxVariance) * 100;
    
    return Math.min(100, Math.max(0, compositionScore));
  } catch (error) {
    console.error('Composition score calculation error:', error);
    return 50;
  }
};

// Calculate image entropy (detail level)
const calculateEntropy = async (imageBuffer: Buffer): Promise<number> => {
  try {
    const { data } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i++) {
      histogram[data[i]]++;
    }
    
    // Calculate entropy
    const total = data.length;
    let entropy = 0;
    
    for (let i = 0; i < 256; i++) {
      if (histogram[i] > 0) {
        const p = histogram[i] / total;
        entropy -= p * Math.log2(p);
      }
    }
    
    // Normalize to 0-100 (max entropy for 8-bit image is 8)
    return (entropy / 8) * 100;
  } catch (error) {
    console.error('Entropy calculation error:', error);
    return 50;
  }
};

// Estimate image noise level
const estimateNoise = async (imageBuffer: Buffer): Promise<number> => {
  try {
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    // Use median of local variances as noise estimate
    let totalNoise = 0;
    let samples = 0;
    
    for (let y = 2; y < height - 2; y += 5) {
      for (let x = 2; x < width - 2; x += 5) {
        const idx = y * width + x;
        const center = data[idx];
        
        // Calculate local variance in 5x5 neighborhood
        let localVariance = 0;
        let neighborCount = 0;
        
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (nIdx >= 0 && nIdx < data.length) {
              localVariance += Math.pow(data[nIdx] - center, 2);
              neighborCount++;
            }
          }
        }
        
        if (neighborCount > 0) {
          totalNoise += Math.sqrt(localVariance / neighborCount);
          samples++;
        }
      }
    }
    
    const avgNoise = samples > 0 ? totalNoise / samples : 0;
    // Normalize to 0-100 (higher noise = lower score)
    return Math.min(100, Math.max(0, 100 - avgNoise * 2));
  } catch (error) {
    console.error('Noise estimation error:', error);
    return 50;
  }
};

// Calculate improvement percentages
const calculateImprovements = (
  original: Awaited<ReturnType<typeof analyzeImageMetrics>>,
  enhanced: Awaited<ReturnType<typeof analyzeImageMetrics>>
) => {
  return {
    brightness: Math.round(((enhanced.brightness - original.brightness) / original.brightness) * 100),
    contrast: Math.round(((enhanced.contrast - original.contrast) / original.contrast) * 100),
    sharpness: Math.round(((enhanced.sharpness - original.sharpness) / original.sharpness) * 100),
    colorVibrancy: Math.round(((enhanced.colorVibrancy - original.colorVibrancy) / original.colorVibrancy) * 100),
    composition: Math.round(((enhanced.composition - original.composition) / original.composition) * 100),
    fileSize: Math.round(((original.fileSize - enhanced.fileSize) / original.fileSize) * 100),
    overall: Math.round((
      (enhanced.brightness + enhanced.contrast + enhanced.sharpness + 
       enhanced.colorVibrancy + enhanced.composition) / 5 -
      (original.brightness + original.contrast + original.sharpness + 
       original.colorVibrancy + original.composition) / 5
    ))
  };
};

// ============== ENHANCEMENT FUNCTIONS ==============

const adjustBasic = async (
  imageBuffer: Buffer,
  settings: {
    brightness?: number;
    saturation?: number;
    sharpness?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
  }
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);

  if (settings.brightness !== undefined || settings.saturation !== undefined) {
    pipeline = pipeline.modulate({
      brightness: settings.brightness || 1,
      saturation: settings.saturation || 1,
    });
  }

  if (settings.sharpness && settings.sharpness !== 1) {
    pipeline = pipeline.sharpen(settings.sharpness);
  }

  if (settings.blur && settings.blur > 0) {
    pipeline = pipeline.blur(settings.blur);
  }

  if (settings.grayscale) {
    pipeline = pipeline.grayscale();
  } else if (settings.sepia) {
    pipeline = pipeline.recomb([
      [0.393, 0.769, 0.189],
      [0.349, 0.686, 0.168],
      [0.272, 0.534, 0.131]
    ]);
  } else if (settings.invert) {
    pipeline = pipeline.negate();
  }

  return pipeline.toBuffer();
};

const cropAndResize = async (
  imageBuffer: Buffer,
  settings: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  }
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);
  const metadata = await pipeline.metadata();

  if (settings.aspectRatio && metadata.width && metadata.height) {
    const [ratioW, ratioH] = settings.aspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const currentRatio = metadata.width / metadata.height;

    let cropWidth = metadata.width;
    let cropHeight = metadata.height;

    if (currentRatio > targetRatio) {
      cropWidth = Math.floor(metadata.height * targetRatio);
    } else {
      cropHeight = Math.floor(metadata.width / targetRatio);
    }

    const left = Math.floor((metadata.width - cropWidth) / 2);
    const top = Math.floor((metadata.height - cropHeight) / 2);

    pipeline = pipeline.extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.min(cropWidth, metadata.width),
      height: Math.min(cropHeight, metadata.height)
    });
  }

  if (settings.width || settings.height) {
    pipeline = pipeline.resize(settings.width, settings.height, {
      fit: settings.fit || 'cover',
      withoutEnlargement: true
    });
  }

  return pipeline.toBuffer();
};

const rotateAndFlip = async (
  imageBuffer: Buffer,
  settings: {
    rotate?: number;
    flip?: boolean;
    flop?: boolean;
  }
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);

  if (settings.rotate) {
    pipeline = pipeline.rotate(settings.rotate);
  }

  if (settings.flip) {
    pipeline = pipeline.flip();
  }

  if (settings.flop) {
    pipeline = pipeline.flop();
  }

  return pipeline.toBuffer();
};

const applyFilter = async (
  imageBuffer: Buffer,
  filterName: string
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);

  switch (filterName) {
    case 'vintage':
      pipeline = pipeline
        .modulate({ brightness: 1.1, saturation: 0.8 })
        .tint({ r: 255, g: 240, b: 200 })
        .gamma(1.2);
      break;

    case 'summer':
      pipeline = pipeline
        .modulate({ brightness: 1.1, saturation: 1.3 })
        .tint({ r: 255, g: 240, b: 220 });
      break;

    case 'cool':
      pipeline = pipeline
        .modulate({ brightness: 1, saturation: 0.9 })
        .tint({ r: 200, g: 220, b: 255 })
        .gamma(1.1);
      break;

    case 'warm':
      pipeline = pipeline
        .modulate({ brightness: 1.1, saturation: 1.1 })
        .tint({ r: 255, g: 220, b: 200 });
      break;

    case 'b&w':
    case 'black-and-white':
      pipeline = pipeline.grayscale();
      break;

    case 'sepia':
      pipeline = pipeline.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
      ]);
      break;

    case 'clarendon':
      pipeline = pipeline
        .modulate({ brightness: 1.15, saturation: 1.2 })
        .gamma(1.1);
      break;

    case 'gingham':
      pipeline = pipeline
        .modulate({ brightness: 1.05, saturation: 0.8 })
        .tint({ r: 250, g: 240, b: 230 });
      break;

    case 'moon':
      pipeline = pipeline
        .grayscale()
        .modulate({ brightness: 1.1 });
      break;

    case 'lark':
      pipeline = pipeline
        .modulate({ brightness: 1.1, saturation: 0.9 })
        .tint({ r: 230, g: 240, b: 255 });
      break;

    case 'reyes':
      pipeline = pipeline
        .modulate({ brightness: 1.1, saturation: 0.7 })
        .tint({ r: 250, g: 230, b: 220 });
      break;

    default:
      break;
  }

  return pipeline.toBuffer();
};

const addTextOverlay = async (
  imageBuffer: Buffer,
  text: string,
  settings: {
    position?: 'top' | 'bottom' | 'center';
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    shadow?: boolean;
  }
): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  
  const fontSize = settings.fontSize || 40;
  const padding = 20;
  const textColor = settings.fontColor || '#ffffff';
  const bgColor = settings.backgroundColor || 'rgba(0,0,0,0.6)';
  
  const svgText = `
    <svg width="${metadata.width}" height="${metadata.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
        </filter>
      </defs>
      <style>
        .text {
          fill: ${textColor};
          font-size: ${fontSize}px;
          font-family: ${settings.fontFamily || 'Arial, sans-serif'};
          font-weight: bold;
          ${settings.shadow ? 'filter: url(#shadow);' : ''}
        }
        .background {
          fill: ${bgColor};
        }
      </style>
      
      ${settings.position === 'top' ? `
        <rect x="${padding}" y="${padding}" width="${metadata.width! - padding * 2}" height="${fontSize * 2}" rx="10" class="background"/>
        <text x="${metadata.width! / 2}" y="${padding + fontSize}" text-anchor="middle" dominant-baseline="middle" class="text">${text}</text>
      ` : settings.position === 'center' ? `
        <rect x="${padding}" y="${metadata.height! / 2 - fontSize}" width="${metadata.width! - padding * 2}" height="${fontSize * 2}" rx="10" class="background"/>
        <text x="${metadata.width! / 2}" y="${metadata.height! / 2}" text-anchor="middle" dominant-baseline="middle" class="text">${text}</text>
      ` : `
        <rect x="${padding}" y="${metadata.height! - fontSize * 2 - padding}" width="${metadata.width! - padding * 2}" height="${fontSize * 2}" rx="10" class="background"/>
        <text x="${metadata.width! / 2}" y="${metadata.height! - fontSize - padding}" text-anchor="middle" dominant-baseline="middle" class="text">${text}</text>
      `}
    </svg>
  `;
  
  const svgBuffer = Buffer.from(svgText);
  
  return sharp(imageBuffer)
    .composite([{
      input: svgBuffer,
      top: 0,
      left: 0,
    }])
    .toBuffer();
};

const addBordersAndFrames = async (
  imageBuffer: Buffer,
  settings: {
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    shadow?: boolean;
    padding?: number;
  }
): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  
  const borderWidth = settings.borderWidth || 0;
  const borderRadius = settings.borderRadius || 0;
  const padding = settings.padding || 0;
  const borderColor = settings.borderColor || '#ffffff';
  
  let pipeline = sharp(imageBuffer);
  
  if (padding > 0 || borderWidth > 0) {
    const newWidth = metadata.width! + padding * 2 + borderWidth * 2;
    const newHeight = metadata.height! + padding * 2 + borderWidth * 2;
    
    const extendedBuffer = await sharp({
      create: {
        width: newWidth,
        height: newHeight,
        channels: 4,
        background: borderColor
      }
    })
    .png()
    .toBuffer();
    
    pipeline = sharp(extendedBuffer).composite([{
      input: imageBuffer,
      top: padding + borderWidth,
      left: padding + borderWidth,
    }]);
  }
  
  if (borderRadius > 0) {
    const roundedCorners = Buffer.from(`
      <svg>
        <rect 
          x="0" 
          y="0" 
          width="${metadata.width! + padding * 2 + borderWidth * 2}" 
          height="${metadata.height! + padding * 2 + borderWidth * 2}" 
          rx="${borderRadius}" 
          ry="${borderRadius}"
        />
      </svg>
    `);
    
    pipeline = pipeline.composite([{
      input: roundedCorners,
      blend: 'dest-in'
    }]);
  }
  
  return pipeline.toBuffer();
};

const optimizeForSocial = async (
  imageBuffer: Buffer,
  platform: string,
  quality: number = 80
): Promise<Buffer> => {
  const presets: Record<string, { width: number; height: number }> = {
    instagram: { width: 1080, height: 1080 },
    facebook: { width: 1200, height: 630 },
    twitter: { width: 1024, height: 512 },
    linkedin: { width: 1104, height: 736 },
    pinterest: { width: 1000, height: 1500 }
  };

  const preset = presets[platform];
  
  let pipeline = sharp(imageBuffer);

  if (preset) {
    pipeline = pipeline.resize(preset.width, preset.height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  return pipeline.jpeg({ quality }).toBuffer();
};

// ============== MAIN POST HANDLER ==============
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const email = session.user.email;
    const userId = session.user.id;

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const platform = formData.get('platform') as string;
    const enhancementType = formData.get('enhancementType') as string;
    const settings = JSON.parse(formData.get('settings') as string || '{}');

    if (!image) {
      return NextResponse.json({ 
        error: "Please upload an image to enhance" 
      }, { status: 400 });
    }

    console.log('🎨 Enhancing image:', { platform, enhancementType });

    // Get original image buffer
    const originalBuffer = await getFileBufferData(image);
    
    // Analyze original image metrics
    console.log('📊 Analyzing original image...');
    const originalMetrics = await analyzeImageMetrics(originalBuffer);
    
    // Upload original image
    const originalFileName = `original-${Date.now()}-${image.name}`;
    const originalImageUrl = await uploadToImageKit(originalBuffer, originalFileName);

    // Apply enhancements based on type
    console.log('🔧 Applying enhancements...');
    let enhancedBuffer: Buffer = originalBuffer;

    switch (enhancementType) {
      case 'basic':
        enhancedBuffer = await adjustBasic(enhancedBuffer, settings);
        break;

      case 'crop':
        enhancedBuffer = await cropAndResize(enhancedBuffer, settings);
        break;

      case 'rotate':
        enhancedBuffer = await rotateAndFlip(enhancedBuffer, settings);
        break;

      case 'filters':
        if (settings.filterName) {
          enhancedBuffer = await applyFilter(enhancedBuffer, settings.filterName);
        }
        break;

      case 'overlay':
        if (settings.text) {
          enhancedBuffer = await addTextOverlay(enhancedBuffer, settings.text, settings);
        }
        break;

      case 'borders':
        enhancedBuffer = await addBordersAndFrames(enhancedBuffer, settings);
        break;

      case 'optimize':
        enhancedBuffer = await optimizeForSocial(enhancedBuffer, platform, settings.quality || 80);
        break;

      default:
        // Auto enhance - apply smart adjustments based on image analysis
        enhancedBuffer = await adjustBasic(enhancedBuffer, {
          brightness: originalMetrics.brightness < 50 ? 1.2 : 1.0,
          saturation: originalMetrics.colorVibrancy < 40 ? 1.3 : 1.1,
          sharpness: originalMetrics.sharpness < 60 ? 1.0 : 0.5
        });
    }

    // Analyze enhanced image metrics
    console.log('📊 Analyzing enhanced image...');
    const enhancedMetrics = await analyzeImageMetrics(enhancedBuffer);
    
    // Calculate improvements
    const improvements = calculateImprovements(originalMetrics, enhancedMetrics);
    
    console.log('✅ Enhancement complete! Improvements:', improvements);

    // Upload enhanced image
    const enhancedFileName = `enhanced-${platform}-${enhancementType}-${Date.now()}.jpg`;
    const enhancedImageUrl = await uploadToImageKit(enhancedBuffer, enhancedFileName);

    // Save to database with metrics
    const savedPost = await db.insert(enhancedPostsTable).values({
      originalImageUrl,
      enhancedImageUrl,
      platform,
      enhancementType,
      enhancementSettings: {
        ...settings,
        originalMetrics,
        enhancedMetrics,
        improvements
      },
      userInput: settings.text || null,
      userEmail: email,
      userId: userId,
      createdOn: moment().format("YYYY-MM-DD"),
    }).returning();

    return NextResponse.json({ 
      success: true,
      originalUrl: originalImageUrl,
      enhancedUrl: enhancedImageUrl,
      postId: savedPost[0].id,
      platform,
      enhancementType,
      metrics: {
        original: originalMetrics,
        enhanced: enhancedMetrics,
        improvements
      }
    });

  } catch (error) {
    console.error('❌ Image Enhancement Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to enhance image. Please try again." 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const email = session.user.email;
    
    const result = await db.select().from(enhancedPostsTable)
      .where(eq(enhancedPostsTable.userEmail, email))
      .orderBy(desc(enhancedPostsTable.id));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching enhanced posts:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}