import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 SES Test - Starting diagnostic...');
    
    // Check environment variables
    const requiredEnvVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY', 
      'AWS_REGION',
      'AWS_SES_DEFAULT_FROM_EMAIL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missingVars: missingEnvVars,
        diagnosis: {
          message: 'AWS SES is not properly configured',
          solution: 'Add the missing environment variables to your .env file'
        }
      }, { status: 400 });
    }
    
    console.log('✅ Environment variables check passed');
    
    // Get test email from request body
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json({
        success: false,
        error: 'Test email address is required',
        diagnosis: {
          message: 'No test email provided',
          solution: 'Provide a test email address in the request body'
        }
      }, { status: 400 });
    }
    
    // Test SES connection and email sending
    try {
      const { sendEmail } = await import('@/lib/ses-server');
      
      console.log('🧪 Testing SES email sending...');
      
      const result = await sendEmail(
        testEmail,
        'TreasureHub SES Test Email',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #D4AF3D;">TreasureHub SES Test</h1>
            <p>This is a test email to verify that AWS SES is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>From Email:</strong> ${process.env.AWS_SES_DEFAULT_FROM_EMAIL}</p>
            <p><strong>AWS Region:</strong> ${process.env.AWS_REGION}</p>
            <p>If you received this email, AWS SES is configured correctly!</p>
          </div>
        `,
        undefined,
        'This is a test email to verify that AWS SES is working correctly.'
      );
      
      console.log('✅ SES email sent successfully:', result);
      
      return NextResponse.json({
        success: true,
        message: 'SES test email sent successfully',
        data: {
          messageId: result.MessageId,
          testEmail,
          fromEmail: process.env.AWS_SES_DEFAULT_FROM_EMAIL,
          region: process.env.AWS_REGION,
          timestamp: new Date().toISOString()
        },
        diagnosis: {
          message: 'AWS SES is working correctly',
          solution: 'Check your email inbox (including spam folder) for the test email'
        }
      });
      
    } catch (sesError) {
      console.error('❌ SES Error:', sesError);
      
      let diagnosis = {
        message: 'AWS SES error occurred',
        solution: 'Check AWS SES configuration and credentials'
      };
      
      if (sesError instanceof Error) {
        if (sesError.message.includes('InvalidParameterValue')) {
          diagnosis = {
            message: 'Invalid email address or SES configuration',
            solution: 'Ensure your from email is verified in AWS SES and the test email is valid'
          };
        } else if (sesError.message.includes('MessageRejected')) {
          diagnosis = {
            message: 'Email rejected by SES',
            solution: 'Check if your account is in SES sandbox mode and verify email addresses'
          };
        } else if (sesError.message.includes('AccessDenied') || sesError.message.includes('SignatureDoesNotMatch')) {
          diagnosis = {
            message: 'AWS credentials are invalid or insufficient permissions',
            solution: 'Verify your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, and ensure SES permissions'
          };
        } else if (sesError.message.includes('AWS credentials not configured')) {
          diagnosis = {
            message: 'AWS credentials are missing',
            solution: 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
          };
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'SES email sending failed',
        details: sesError instanceof Error ? sesError.message : 'Unknown error',
        diagnosis
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('🧪 SES Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'SES test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      diagnosis: {
        message: 'Unexpected error during SES test',
        solution: 'Check server logs for detailed error information'
      }
    }, { status: 500 });
  }
}















