import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { photoUrls, productDescription, department, category } = body;

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo URL is required' },
        { status: 400 }
      );
    }

    // First, analyze the product using Vision API to get detailed description
    const analysisPrompt = `
Please analyze the provided product photos and describe the product in detail for creating a professional staged photo.

Focus on:
1. Product type and category
2. Color, material, and finish
3. Key features and design elements
4. Current condition and any visible details
5. Brand if identifiable

Provide a detailed description that can be used to create a professional e-commerce product photo.
`;

    const analysisMessages = [
      {
        role: "system" as const,
        content: "You are an expert product analyst specializing in e-commerce photography. Analyze the product and provide detailed descriptions for professional photo staging."
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: analysisPrompt
          },
          // Add each photo as an image
          ...photoUrls.map(url => ({
            type: "image_url" as const,
            image_url: {
              url: url
            }
          }))
        ]
      }
    ];

    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: analysisMessages,
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysisResponse = analysisCompletion.choices[0]?.message?.content;
    
    if (!analysisResponse) {
      throw new Error('No analysis response from OpenAI');
    }

    // Create DALL-E prompt for staged photo generation
    const dallePrompt = createStagedPhotoPrompt(analysisResponse, productDescription, department, category);

    // Generate staged photo using DALL-E
    const imageGeneration = await openai.images.generate({
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    });

    const stagedPhotoUrl = imageGeneration.data[0]?.url;
    
    if (!stagedPhotoUrl) {
      throw new Error('Failed to generate staged photo');
    }

    return NextResponse.json({
      success: true,
      stagedPhotoUrl: stagedPhotoUrl,
      analysis: analysisResponse,
    });

  } catch (error) {
    console.error('Error in AI staged photo generation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate staged photo',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function createStagedPhotoPrompt(
  analysis: string,
  productDescription: string,
  department: string,
  category: string
): string {
  return `
Create a professional e-commerce product photo for a ${department} item in the ${category} category.

Product Analysis: ${analysis}

Additional Description: ${productDescription || 'No additional description provided'}

Requirements:
1. Clean, minimalist background (white or light neutral)
2. Professional lighting with soft shadows
3. Product should be the main focus, well-lit and clearly visible
4. High-quality, sharp image suitable for e-commerce
5. Natural, realistic representation of the product
6. No text, watermarks, or branding overlays
7. Product should appear in excellent condition
8. Use studio-style photography with proper depth of field

Style: Professional e-commerce product photography, similar to high-end furniture or electronics catalogs. The image should be clean, modern, and appealing to potential buyers.

Focus on creating a photo that would make customers want to purchase this item.
`;
} 