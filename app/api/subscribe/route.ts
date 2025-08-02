import { NextRequest, NextResponse } from 'next/server';
import { addEmailToMailchimp } from '@/lib/mailchimp';

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'website' } = await request.json();

    console.log('Subscribe API called with:', { email, source });

    // Validate email
    if (!email || !email.includes('@')) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check environment variables
    console.log('Environment check:', {
      hasMailchimpKey: !!process.env.MAILCHIMP_API_KEY,
      hasAudienceId: !!process.env.MAILCHIMP_AUDIENCE_ID,
      hasServerPrefix: !!process.env.MAILCHIMP_SERVER_PREFIX,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });

    // Add to Mailchimp and database
    console.log('Calling addEmailToMailchimp...');
    const result = await addEmailToMailchimp(email, source);
    console.log('addEmailToMailchimp result:', result);

    if (result.success) {

      return NextResponse.json(
        { 
          message: 'Successfully subscribed', 
          email,
          details: result.message || 'Added to mailing list',
          signupNumber: result.signupNumber
        },
        { status: 200 }
      );
    } else {
      console.error('Mailchimp operation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to subscribe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Subscription API error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 