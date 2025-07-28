import { NextResponse } from 'next/server';
import { getSignupStats } from '@/lib/mailchimp';

export async function GET() {
  try {
    const stats = await getSignupStats();
    
    if (stats.success) {
      return NextResponse.json(stats.data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: stats.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching early access stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 