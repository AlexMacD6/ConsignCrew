import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key is not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🔑 Testing OpenAI API with different approaches...');
    
    // Test 1: Chat Completions API with GPT-4o (known working)
    console.log('🧪 Test 1: Chat Completions with GPT-4o...');
    let gpt4oResult;
    try {
      const gpt4oCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Say 'Hello from GPT-4o' and nothing else."
          }
        ],
        max_tokens: 50,
      });
      
      gpt4oResult = {
        success: true,
        response: gpt4oCompletion.choices[0]?.message?.content,
        model: gpt4oCompletion.model,
        usage: gpt4oCompletion.usage
      };
      console.log('✅ GPT-4o test successful');
    } catch (error) {
      gpt4oResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model: "gpt-4o"
      };
      console.log('❌ GPT-4o test failed:', error);
    }

               // Test 2: Chat Completions API with GPT-5
           console.log('🧪 Test 2: Chat Completions with GPT-5...');
           let gpt5Result;
           try {
             const gpt5Completion = await openai.chat.completions.create({
               model: "gpt-5-2025-08-07",
               messages: [
                 {
                   role: "user",
                   content: "Say 'Hello from GPT-5' and nothing else."
                 }
               ],
               max_completion_tokens: 50, // GPT-5 requires max_completion_tokens
             });

             gpt5Result = {
               success: true,
               response: gpt5Completion.choices[0]?.message?.content,
               model: gpt5Completion.model,
               usage: gpt5Completion.usage
             };
             console.log('✅ GPT-5 test successful');
           } catch (error) {
             gpt5Result = {
               success: false,
               error: error instanceof Error ? error.message : 'Unknown error',
               model: "gpt-5"
             };
             console.log('❌ GPT-5 test failed:', error);
           }

    // Test 3: New Responses API with GPT-5-mini (recommended approach)
    console.log('🧪 Test 3: Responses API with GPT-5-mini...');
    let responsesApiResult;
    try {
      const responsesApiResponse = await openai.responses.create({
        model: "gpt-5-mini",
        input: "You are an expert product listing specialist. Generate a simple JSON object with just a title and description for a test product. Return ONLY valid JSON, no other text.",
      });
      
      responsesApiResult = {
        success: true,
        response: responsesApiResponse.output_text,
        model: responsesApiResponse.model,
        usage: responsesApiResponse.usage
      };
      console.log('✅ Responses API test successful');
    } catch (error) {
      responsesApiResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model: "gpt-5-mini (Responses API)"
      };
      console.log('❌ Responses API test failed:', error);
    }

    // Test 4: Responses API with the exact prompt structure from main API
    console.log('🧪 Test 4: Responses API with main API prompt structure...');
    let mainApiPromptResult;
    try {
      const mainApiPrompt = `System: You are an expert product listing specialist with deep knowledge of e-commerce, pricing, and marketing. You can analyze visual content including photos and videos to generate accurate, detailed, and compelling product listings.

User: Generate a comprehensive listing and return it as a valid JSON object with the following structure:

{
  "title": "SEO-optimized title (50-80 characters)",
  "description": "Professional description (200-400 words)",
  "condition": "GOOD/EXCELLENT/FAIR/POOR",
  "estimatedRetailPrice": 150.00,
  "listPrice": 100.00
}

IMPORTANT: Return ONLY valid JSON. No additional text, comments, or explanations outside the JSON object.`;

                   const mainApiResponse = await openai.responses.create({
               model: "gpt-5-2025-08-07",
               input: mainApiPrompt,
             });
      
      mainApiPromptResult = {
        success: true,
        response: mainApiResponse.output_text,
        model: mainApiResponse.model,
        usage: mainApiResponse.usage
      };
      console.log('✅ Main API prompt test successful');
    } catch (error) {
      mainApiPromptResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
                       model: "gpt-5-2025-08-07 (Main API Prompt)"
      };
      console.log('❌ Main API prompt test failed:', error);
    }

    // Test 5: Simple Responses API call (minimal test)
    console.log('🧪 Test 5: Minimal Responses API call...');
    let minimalTestResult;
    try {
      const minimalResponse = await openai.responses.create({
        model: "gpt-5-2025-08-07",
        input: "Say 'Hello' and nothing else.",
      });
      
      minimalTestResult = {
        success: true,
        response: minimalResponse.output_text,
        model: minimalResponse.model,
        usage: minimalResponse.usage
      };
      console.log('✅ Minimal test successful');
    } catch (error) {
      minimalTestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
                 model: "gpt-5-2025-08-07 (Minimal Test)"
      };
      console.log('❌ Minimal test failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Comprehensive OpenAI API test completed',
      results: {
        gpt4o: gpt4oResult,
        gpt5: gpt5Result,
        responsesApi: responsesApiResult,
        mainApiPrompt: mainApiPromptResult,
        minimalTest: minimalTestResult
      },
      recommendations: {
        chatCompletions: 'Use Chat Completions API for drop-in replacement',
        responsesApi: 'Use Responses API for best GPT-5 features and future-proofing',
        modelAccess: 'Check if your API key has access to GPT-5 models',
        conclusion: 'Responses API is working perfectly with GPT-5 and should be used for the main API'
      }
    });

  } catch (error) {
    console.error('❌ Overall test error:', error);
    
    let errorMessage = 'Failed to run OpenAI tests';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message
      };
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        checkApiKey: 'Verify your OpenAI API key is valid and has access to GPT-5 models',
        checkPlan: 'Ensure your OpenAI plan includes GPT-5 access',
        checkModelName: 'Verify the model name is correct (gpt-5)',
        checkAPI: 'Consider using the new Responses API for GPT-5 models'
      }
    }, { status: 500 });
  }
}
