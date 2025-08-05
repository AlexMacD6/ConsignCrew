import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, aspectRatio = "1:1", size = "1536x1536" } = body;

    if (!prompt) {
      return NextResponse.json({
        error: 'Missing required field: prompt'
      }, { status: 400 });
    }

    console.log("🎨 Generating image with prompt:", prompt);
    console.log("🎨 Image settings:", { aspectRatio, size });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log("✅ Image generated successfully:", imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      settings: { aspectRatio, size }
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 