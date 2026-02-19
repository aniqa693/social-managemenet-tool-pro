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

// ============== BASIC ENHANCEMENTS ==============
const adjustBasic = async (
  imageBuffer: Buffer,
  settings: {
    brightness?: number;  // 0-2
    contrast?: number;    // 0-2
    saturation?: number;  // 0-2
    sharpness?: number;   // 0-2
    blur?: number;        // 0-10
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
  }
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);

  // Apply brightness, contrast, saturation
  if (settings.brightness !== undefined || settings.saturation !== undefined) {
    pipeline = pipeline.modulate({
      brightness: settings.brightness || 1,
      saturation: settings.saturation || 1,
    });
  }

  // Apply sharpness
  if (settings.sharpness && settings.sharpness !== 1) {
    pipeline = pipeline.sharpen(settings.sharpness);
  }

  // Apply blur
  if (settings.blur && settings.blur > 0) {
    pipeline = pipeline.blur(settings.blur);
  }

  // Apply color effects
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

// ============== CROP & RESIZE ==============
const cropAndResize = async (
  imageBuffer: Buffer,
  settings: {
    width?: number;
    height?: number;
    aspectRatio?: string;  // e.g., "1:1", "16:9"
    crop?: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  }
): Promise<Buffer> => {
  let pipeline = sharp(imageBuffer);
  const metadata = await pipeline.metadata();

  // Handle aspect ratio crop
  if (settings.aspectRatio && metadata.width && metadata.height) {
    const [ratioW, ratioH] = settings.aspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const currentRatio = metadata.width / metadata.height;

    let cropWidth = metadata.width;
    let cropHeight = metadata.height;

    if (currentRatio > targetRatio) {
      // Image is wider than target ratio
      cropWidth = Math.floor(metadata.height * targetRatio);
    } else {
      // Image is taller than target ratio
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

  // Handle manual crop
  if (settings.crop) {
    pipeline = pipeline.extract(settings.crop);
  }

  // Handle resize
  if (settings.width || settings.height) {
    pipeline = pipeline.resize(settings.width, settings.height, {
      fit: settings.fit || 'cover',
      withoutEnlargement: true
    });
  }

  return pipeline.toBuffer();
};

// ============== ROTATE & FLIP ==============
const rotateAndFlip = async (
  imageBuffer: Buffer,
  settings: {
    rotate?: number;  // degrees
    flip?: boolean;   // vertical flip
    flop?: boolean;   // horizontal flip
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

// ============== FILTERS & PRESETS ==============
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
      // No filter
      break;
  }

  return pipeline.toBuffer();
};

// ============== TEXT OVERLAY ==============
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
  
  // Create SVG with text
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

// ============== BORDERS & FRAMES ==============
const addBordersAndFrames = async (
  imageBuffer: Buffer,
  settings: {
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    shadow?: boolean;
    shadowColor?: string;
    padding?: number;
  }
): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  
  const borderWidth = settings.borderWidth || 0;
  const borderRadius = settings.borderRadius || 0;
  const padding = settings.padding || 0;
  const borderColor = settings.borderColor || '#ffffff';
  
  // First, add padding if needed
  let pipeline = sharp(imageBuffer);
  
  if (padding > 0 || borderWidth > 0) {
    const newWidth = metadata.width! + padding * 2 + borderWidth * 2;
    const newHeight = metadata.height! + padding * 2 + borderWidth * 2;
    
    // Create extended canvas with background
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
    
    // Composite original image on top with padding
    pipeline = sharp(extendedBuffer).composite([{
      input: imageBuffer,
      top: padding + borderWidth,
      left: padding + borderWidth,
    }]);
  }
  
  // Apply rounded corners
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

// ============== OPTIMIZE FOR SOCIAL ==============
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
    // Resize to platform dimensions
    pipeline = pipeline.resize(preset.width, preset.height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Compress image
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

    // Upload original image
    const originalBuffer = await getFileBufferData(image);
    const originalFileName = `original-${Date.now()}-${image.name}`;
    const originalImageUrl = await uploadToImageKit(originalBuffer, originalFileName);

    // Apply enhancements based on type
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
        // Auto enhance - apply basic adjustments
        enhancedBuffer = await adjustBasic(enhancedBuffer, {
          brightness: 1.05,
          saturation: 1.05,
          sharpness: 0.5
        });
    }

    // Upload enhanced image
    const enhancedFileName = `enhanced-${platform}-${enhancementType}-${Date.now()}.jpg`;
    const enhancedImageUrl = await uploadToImageKit(enhancedBuffer, enhancedFileName);

    // Save to database
    const savedPost = await db.insert(enhancedPostsTable).values({
      originalImageUrl,
      enhancedImageUrl,
      platform,
      enhancementType,
      enhancementSettings: settings,
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
      enhancementType
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