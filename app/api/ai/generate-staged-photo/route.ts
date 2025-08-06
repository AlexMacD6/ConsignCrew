import { NextRequest, NextResponse } from 'next/server';
import { generateStagedPhotoPhase2 } from '@/lib/ai-service';
import OpenAI from 'openai';
import { getUploadUrl, getPublicUrl, ImagePrefix } from '../../../../src/aws/imageStore';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload image to S3 and return public URL
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingJSON,
      photoURLs,
      videoFrames
    } = body;

    console.log("🎨 API - Received request:", {
      hasListingJSON: !!listingJSON,
      listingJSONKeys: listingJSON ? Object.keys(listingJSON) : [],
      photoURLsCount: photoURLs?.length || 0,
      videoFramesCount: videoFrames?.length || 0
    });

    // Validate required fields
    if (!listingJSON || !photoURLs || !Array.isArray(photoURLs)) {
      console.error("🎨 API - Validation failed:", {
        hasListingJSON: !!listingJSON,
        hasPhotoURLs: !!photoURLs,
        isPhotoURLsArray: Array.isArray(photoURLs)
      });
      return NextResponse.json({
        error: 'Missing required fields: listingJSON, photoURLs'
      }, { status: 400 });
    }

    // Phase 2: Generate staged photo prompt
    const result = await generateStagedPhotoPhase2({
      listingJSON,
      photoURLs,
      videoFrames: videoFrames || []
    });

    console.log("🎨 API - Successfully generated result:", {
      hasReferenceImageUrl: !!result.referenceImageUrl,
      hasStagingPrompt: !!result.stagingPrompt,
      stagingPromptLength: result.stagingPrompt?.length || 0
    });

    // Phase 3: Generate the actual image from the staging prompt using DALL-E
    let s3ImageUrl = null;
    
    try {
      console.log("🎨 DALL-E - Generating image with size: 1024x1024");
      
      const dalleResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: result.stagingPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      });
      
      const imageUrl = dalleResponse.data?.[0]?.url || null;
      console.log("✅ DALL-E image generated successfully:", imageUrl);

      // Download and upload to S3 for permanent storage
      if (imageUrl) {
        console.log("📥 Downloading DALL-E image from Azure Blob Storage...");
        const imageBuffer = await downloadImage(imageUrl);
        
        console.log("📤 Uploading DALL-E image to S3...");
        s3ImageUrl = await uploadImageToS3(imageBuffer, listingJSON.item_id || 'dalle-generated');
        
        console.log("✅ DALL-E image uploaded to S3:", s3ImageUrl);
      }
    } catch (dalleError) {
      console.error("❌ DALL-E image generation or S3 upload failed:", dalleError);
      // No fallback - if S3 upload fails, image won't be available
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        generatedImageUrl: s3ImageUrl, // Only S3 URL, no fallback
      }
    });

  } catch (error) {
    console.error('Error generating staged photo prompt and image:', error);
    return NextResponse.json({
      error: 'Failed to generate staged photo and image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 