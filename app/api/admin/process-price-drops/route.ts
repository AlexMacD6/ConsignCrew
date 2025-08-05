import { NextRequest, NextResponse } from 'next/server';
import { processAllPriceDrops } from '@/lib/discount-schedule';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin privileges
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your admin logic)
    const isAdmin = session.user.email === 'admin@treasurehub.com' || 
                   session.user.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Process all price drops
    const result = await processAllPriceDrops();

    return NextResponse.json({
      success: true,
      message: 'Price drops processed successfully',
      result,
    });
  } catch (error) {
    console.error('Error processing price drops:', error);
    return NextResponse.json(
      { error: 'Failed to process price drops' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin privileges
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = session.user.email === 'admin@treasurehub.com' || 
                   session.user.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Return status information
    return NextResponse.json({
      success: true,
      message: 'Price drop processing endpoint is active',
      endpoint: '/api/admin/process-price-drops',
      method: 'POST',
      description: 'Triggers automatic price drops for all active listings based on their discount schedules',
    });
  } catch (error) {
    console.error('Error in price drops endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get endpoint information' },
      { status: 500 }
    );
  }
} 