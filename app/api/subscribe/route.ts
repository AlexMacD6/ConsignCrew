import { NextRequest, NextResponse } from 'next/server';
import { addEmailToMailchimp } from '@/lib/mailchimp';

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'website' } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Add to Mailchimp and database
    const result = await addEmailToMailchimp(email, source);

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
      return NextResponse.json(
        { error: result.error || 'Failed to subscribe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 