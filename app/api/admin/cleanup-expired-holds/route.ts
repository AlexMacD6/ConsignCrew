import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cleanup expired holds and failed checkout sessions
 * 
 * This endpoint should be called periodically (e.g., via cron job) to:
 * - Release holds on listings where checkout has expired
 * - Cancel pending orders that weren't completed
 * 
 * GET /api/admin/cleanup-expired-holds
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Find all listings with expired holds
    const expiredHolds = await prisma.listing.findMany({
      where: {
        isHeld: true,
        heldUntil: {
          lt: now, // Hold expired
        },
      },
      include: {
        Order: {
          where: {
            status: 'PENDING',
            checkoutExpiresAt: {
              lt: now,
            },
          },
        },
      },
    });

    let releasedCount = 0;
    let cancelledOrdersCount = 0;

    for (const listing of expiredHolds) {
      // Release the hold on the listing
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          isHeld: false,
          heldUntil: null,
        },
      });
      releasedCount++;

      // Cancel any pending orders for this listing that have expired
      const expiredOrders = listing.Order.filter(order => 
        order.checkoutExpiresAt && order.checkoutExpiresAt < now
      );

      for (const order of expiredOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            isHeld: false,
          },
        });

        // Create listing history event
        await prisma.listingHistory.create({
          data: {
            listingId: listing.id,
            eventType: 'CHECKOUT_EXPIRED',
            eventTitle: 'Checkout Session Expired',
            description: `Checkout session expired for order ${order.id}`,
            metadata: {
              orderId: order.id,
              buyerId: order.buyerId,
              expiredAt: now.toISOString(),
            },
          },
        });

        cancelledOrdersCount++;
      }
    }

    console.log(`Cleanup completed: ${releasedCount} holds released, ${cancelledOrdersCount} orders cancelled`);

    return NextResponse.json({
      success: true,
      releasedHolds: releasedCount,
      cancelledOrders: cancelledOrdersCount,
      message: `Cleanup completed: ${releasedCount} holds released, ${cancelledOrdersCount} orders cancelled`,
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

/**
 * Manual cleanup trigger for admin
 * 
 * POST /api/admin/cleanup-expired-holds
 */
export async function POST(request: NextRequest) {
  // Same logic as GET, but can include additional admin verification
  return GET(request);
}
