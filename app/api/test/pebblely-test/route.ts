import { NextRequest, NextResponse } from 'next/server';
import { createPebblelyClient, urlToBase64 } from '@/lib/pebblely-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Pebblely Test - Starting diagnostic...');
    
    // Check if Pebblely API key exists
    if (!process.env.PEBBLELY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'PEBBLELY_API_KEY environment variable is missing',
        diagnosis: {
          message: 'Pebblely API key is not configured',
          solution: 'Add PEBBLELY_API_KEY to your .env file'
        }
      }, { status: 400 });
    }
    
    console.log('✅ Pebblely API key found');
    
    try {
      // Initialize Pebblely client
      const pebblelyClient = createPebblelyClient();
      
      // Test 1: Check credits
      console.log('🧪 Testing Pebblely credits...');
      const { credits } = await pebblelyClient.getCredits();
      console.log('✅ Credits available:', credits);
      
      if (credits < 1) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient Pebblely credits',
          data: { credits },
          diagnosis: {
            message: 'Your Pebblely account has no credits remaining',
            solution: 'Purchase more credits at https://pebblely.com/pricing'
          }
        }, { status: 400 });
      }
      
      // Test 2: Get themes
      console.log('🧪 Testing Pebblely themes...');
      const themes = await pebblelyClient.getThemes();
      console.log('✅ Themes available:', themes.length);
      
      // Test 3: Simple background creation (like Python sample)
      console.log('🧪 Testing Pebblely background creation with sample image...');
      
      // Use Pebblely's sample image (like in Python example)
      const sampleImageUrl = 'https://pebblely.com/sample.png';
      
      // Convert to Base64 (exactly like Python sample)
      const sampleBase64 = await urlToBase64(sampleImageUrl);
      console.log('✅ Sample image converted to Base64');
      
      // Create background (exactly like Python sample)
      const result = await pebblelyClient.createBackground({
        images: [sampleBase64],
        theme: "Surprise me"
      });
      
      console.log('✅ Pebblely background creation successful');
      
      return NextResponse.json({
        success: true,
        message: 'Pebblely test completed successfully',
        data: {
          creditsAvailable: credits,
          creditsUsed: credits - result.credits,
          creditsRemaining: result.credits,
          themesAvailable: themes.length,
          sampleThemes: themes.slice(0, 5).map(t => t.label),
          imageGenerated: true,
          outputSize: 'Base64 image data returned',
          timestamp: new Date().toISOString()
        },
        diagnosis: {
          message: 'Pebblely API is working correctly',
          solution: 'You can now use Pebblely for product photo staging'
        }
      });
      
    } catch (pebblelyError) {
      console.error('❌ Pebblely Error:', pebblelyError);
      
      let diagnosis = {
        message: 'Pebblely API error occurred',
        solution: 'Check Pebblely API key and account status'
      };
      
      if (pebblelyError instanceof Error) {
        if (pebblelyError.message.includes('401')) {
          diagnosis = {
            message: 'Invalid Pebblely API key',
            solution: 'Verify your PEBBLELY_API_KEY is correct'
          };
        } else if (pebblelyError.message.includes('429')) {
          diagnosis = {
            message: 'Rate limit exceeded',
            solution: 'Wait a moment before trying again'
          };
        } else if (pebblelyError.message.includes('402')) {
          diagnosis = {
            message: 'Insufficient credits',
            solution: 'Purchase more credits at https://pebblely.com/pricing'
          };
        } else if (pebblelyError.message.includes('400')) {
          diagnosis = {
            message: 'Invalid request format',
            solution: 'Check the image format and request parameters'
          };
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Pebblely API test failed',
        details: pebblelyError instanceof Error ? pebblelyError.message : 'Unknown error',
        diagnosis
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('🧪 Pebblely Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Pebblely test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      diagnosis: {
        message: 'Unexpected error during Pebblely test',
        solution: 'Check server logs for detailed error information'
      }
    }, { status: 500 });
  }
}


