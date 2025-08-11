import { NextRequest, NextResponse } from 'next/server';
import { generateStagedPhotoPhase2 } from '@/lib/ai-service';
import { createPebblelyClient, urlToBase64, base64ToBuffer } from '@/lib/pebblely-client';
import { getUploadUrl, getPublicUrl, ImagePrefix } from '@/lib/aws-image-store';

/**
 * Upload image buffer to S3 and return public URL
 */
async function uploadImageToS3(imageBuffer: Buffer, itemId: string, contentType: string = 'image/png'): Promise<string> {
  try {
    // Generate S3 upload URL
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.Staged,
      itemId,
      ext: contentType.includes('png') ? 'png' : 'jpg',
      contentType,
    });

    // Upload to S3
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: imageBuffer,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Return public URL
    return getPublicUrl(key);
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
}

/**
 * Generate product category-specific theme for Pebblely
 */
function getProductTheme(listingJSON: any): string {
  const department = listingJSON.department?.toLowerCase() || '';
  const category = listingJSON.category?.toLowerCase() || '';
  
  // Map product categories to Pebblely themes
  if (department.includes('beauty') || category.includes('skincare') || category.includes('makeup')) {
    return 'Bathroom';
  }
  if (department.includes('jewelry') || category.includes('watch')) {
    return 'Studio';
  }
  if (department.includes('food') || category.includes('beverage') || category.includes('kitchen')) {
    return 'Kitchen';
  }
  if (department.includes('home') || category.includes('furniture')) {
    return 'Furniture';
  }
  if (category.includes('candle') || category.includes('fragrance')) {
    return 'Flowers';
  }
  if (department.includes('outdoor') || category.includes('garden')) {
    return 'Nature';
  }
  if (category.includes('art') || category.includes('craft')) {
    return 'Studio';
  }
  
  // Default themes
  return 'Studio';
}

/**
 * Generate product description for Pebblely based on listing data
 */
function generateProductDescription(listingJSON: any): string {
  const { title, brand, condition, department, category } = listingJSON;
  
  let description = '';
  
  if (brand) {
    description += `${brand} `;
  }
  
  if (title) {
    description += `${title} `;
  }
  
  if (department && category) {
    description += `${category} from ${department} department `;
  }
  
  if (condition && condition !== 'new') {
    description += `in ${condition} condition `;
  }
  
  description += 'product photography, professional lighting, clean background, high quality';
  
  return description.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingJSON,
      photoURLs,
      videoFrames
    } = body;

    console.log("🎨 Pebblely API - Received request:", {
      hasListingJSON: !!listingJSON,
      listingJSONKeys: listingJSON ? Object.keys(listingJSON) : [],
      photoURLsCount: photoURLs?.length || 0,
      videoFramesCount: videoFrames?.length || 0
    });

    // Validate required fields
    if (!listingJSON || !photoURLs || !Array.isArray(photoURLs) || photoURLs.length === 0) {
      console.error("🎨 Pebblely API - Validation failed:", {
        hasListingJSON: !!listingJSON,
        hasPhotoURLs: !!photoURLs,
        isPhotoURLsArray: Array.isArray(photoURLs),
        photoURLsLength: photoURLs?.length || 0
      });
      return NextResponse.json({
        error: 'Missing required fields: listingJSON, photoURLs (must have at least one photo)'
      }, { status: 400 });
    }

    // Phase 1: Generate staging prompt using existing AI service
    console.log("🎨 Pebblely API - Generating staging prompt with AI...");
    const promptResult = await generateStagedPhotoPhase2({
      listingJSON,
      photoURLs,
      videoFrames: videoFrames || []
    });

    console.log("🎨 Pebblely API - AI prompt generated:", {
      hasReferenceImageUrl: !!promptResult.referenceImageUrl,
      hasStagingPrompt: !!promptResult.stagingPrompt,
      stagingPromptLength: promptResult.stagingPrompt?.length || 0
    });

    // Phase 2: Generate staged photo using Pebblely
    let s3ImageUrl = null;
    let creditsUsed = 0;
    
    try {
      console.log("🎨 Pebblely - Starting product photo staging...");
      
      // Initialize Pebblely client
      const pebblelyClient = createPebblelyClient();
      
      // Check credits before processing (simplified for single photo)
      const { credits: initialCredits } = await pebblelyClient.getCredits();
      console.log(`🎨 Pebblely - Available credits: ${initialCredits}`);
      
      // For now, we need 2 credits (1 for background removal + 1 for background creation)
      if (initialCredits < 2) {
        throw new Error('Insufficient Pebblely credits. Need at least 2 credits for background removal and creation.');
      }
      
      console.log("🎨 Pebblely - Processing single hero image for staging");
      
      // Use only the first (hero) image for simplicity
      const heroImageUrl = photoURLs[0];
      if (!heroImageUrl) {
        throw new Error('No hero image URL provided');
      }
      
      // Determine theme and description based on product data
      const theme = getProductTheme(listingJSON);
      const productDescription = generateProductDescription(listingJSON);
      
      console.log("🎨 Pebblely - Using theme:", theme);
      console.log("🎨 Pebblely - Product description:", productDescription);
      console.log("🎨 Pebblely - Hero image:", heroImageUrl);
      
      // Single photo staging workflow (remove background + create new background)
      const pebblelyResult = await pebblelyClient.generateStagedPhoto({
        imageUrl: heroImageUrl,
        theme: theme,
        description: productDescription,
        autoresize: true,
        width: 1024,
        height: 1024,
        addWatermark: true // Enable TreasureHub watermark
      });
      
      console.log("✅ Pebblely - Image generation successful");
      
      // Convert base64 to buffer and upload to S3
      console.log("📤 Uploading Pebblely image to S3...");
      const imageBuffer = base64ToBuffer(pebblelyResult.stagedImage);
      s3ImageUrl = await uploadImageToS3(imageBuffer, listingJSON.item_id || 'pebblely-generated', 'image/png');
      
      console.log("✅ Pebblely image uploaded to S3:", s3ImageUrl);
      
      // Calculate credits used
      const { credits: finalCredits } = await pebblelyClient.getCredits();
      creditsUsed = initialCredits - finalCredits;
      
    } catch (pebblelyError) {
      console.error("❌ Pebblely image generation or S3 upload failed:", pebblelyError);
      
      // Return detailed error information
      return NextResponse.json({
        error: 'Failed to generate staged photo with Pebblely',
        message: pebblelyError instanceof Error ? pebblelyError.message : 'Unknown error',
        details: {
          service: 'Pebblely',
          phase: 'image_generation'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...promptResult,
        generatedImageUrl: s3ImageUrl,
        service: 'Pebblely',
        creditsUsed,
        metadata: {
          theme: getProductTheme(listingJSON),
          description: generateProductDescription(listingJSON),
          originalImageUrl: photoURLs[0],
          outputSize: '1024x1024'
        }
      }
    });

  } catch (error) {
    console.error('Error generating staged photo with Pebblely:', error);
    return NextResponse.json({
      error: 'Failed to generate staged photo',
      message: error instanceof Error ? error.message : 'Unknown error',
      service: 'Pebblely'
    }, { status: 500 });
  }
}
