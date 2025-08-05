import { NextRequest, NextResponse } from 'next/server';
import { generateStagedPhotoPhase2 } from '@/lib/ai-service';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    let imageUrl = null;
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
      imageUrl = dalleResponse.data?.[0]?.url || null;
      console.log("✅ DALL-E image generated successfully:", imageUrl);
    } catch (dalleError) {
      console.error("❌ DALL-E image generation failed:", dalleError);
      // Continue without the generated image - the staging prompt is still useful
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        generatedImageUrl: imageUrl,
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