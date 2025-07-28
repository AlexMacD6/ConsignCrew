import { NextRequest, NextResponse } from 'next/server';
import { getTopSignups, getSignupStats } from '@/lib/mailchimp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200');
    const type = searchParams.get('type') || 'signups'; // 'signups' or 'stats'

    if (type === 'stats') {
      const stats = await getSignupStats();
      if (stats.success) {
        return NextResponse.json(stats.data, { status: 200 });
      } else {
        return NextResponse.json(
          { error: stats.error },
          { status: 500 }
        );
      }
    } else {
      const signups = await getTopSignups(limit);
      if (signups.success) {
        return NextResponse.json(signups.data, { status: 200 });
      } else {
        return NextResponse.json(
          { error: signups.error },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in early access signups API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 