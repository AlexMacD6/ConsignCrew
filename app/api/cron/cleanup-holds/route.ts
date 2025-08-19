import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job endpoint to cleanup expired holds
 * 
 * This should be called every 5 minutes by a cron service like Vercel Cron
 * to release expired holds and cancel abandoned checkout sessions
 * 
 * GET /api/cron/cleanup-holds
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    let totalReleased = 0;
    let totalCancelled = 0;

    // Find and release expired listing holds
    const expiredListings = await prisma.listing.updateMany({
      where: {
        isHeld: true,
        heldUntil: {
          lt: now,
        },
      },
      data: {
        isHeld: false,
        heldUntil: null,
        status: 'active', // Reset status back to active when hold expires
      },
    });

    totalReleased = expiredListings.count;

    // Find and cancel expired pending orders
    const expiredOrders = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        isHeld: true,
        checkoutExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'CANCELLED',
        isHeld: false,
      },
    });

    totalCancelled = expiredOrders.count;

    // Log cleanup activity
    if (totalReleased > 0 || totalCancelled > 0) {
      console.log(`Cron cleanup: Released ${totalReleased} holds, cancelled ${totalCancelled} orders`);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      releasedHolds: totalReleased,
      cancelledOrders: totalCancelled,
    });

  } catch (error) {
    console.error('Cron cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export const POST = GET;
