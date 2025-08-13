import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for AI model configuration (in production, this would be in a database)
let aiModelConfig = {
  phase1Model: "gpt-4o", // Default to GPT-4o for better visual analysis
  phase2Model: "gpt-4o"  // Default to GPT-4o for Phase 2
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: aiModelConfig
    });
  } catch (error) {
    console.error('Error retrieving AI model config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI model configuration'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase1Model, phase2Model } = body;

    // Validate the models
    const validModels = ['gpt-4o', 'gpt-5'];
    
    if (!validModels.includes(phase1Model)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Phase 1 model. Must be gpt-4o or gpt-5'
      }, { status: 400 });
    }

    if (!validModels.includes(phase2Model)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Phase 2 model. Must be gpt-4o or gpt-5'
      }, { status: 400 });
    }

    // Update the configuration
    aiModelConfig = {
      phase1Model,
      phase2Model
    };

    console.log('AI Model Configuration updated:', aiModelConfig);

    return NextResponse.json({
      success: true,
      message: 'AI Model configuration saved successfully',
      config: aiModelConfig
    });

  } catch (error) {
    console.error('Error saving AI model config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save AI model configuration'
    }, { status: 500 });
  }
}

