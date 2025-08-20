import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to manually cleanup expired holds and stuck processing listings
 * 
 * This endpoint will:
 * 1. Release expired holds on listings
 * 2. Reset stuck PROCESSING listings back to ACTIVE
 * 3. Cancel expired pending orders
 * 
 * GET /api/admin/cleanup-expired-holds
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can customize this logic)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: {
              select: { slug: true }
            }
          }
        }
      }
    });

    const isAdmin = user?.members?.some(member => 
      member.organization.slug === 'treasurehub-admin' || 
      member.role === 'ADMIN' || 
      member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    let releasedCount = 0;
    let cancelledOrdersCount = 0;
    let resetProcessingCount = 0;

    // Find and release expired listing holds
    const expiredHolds = await prisma.listing.findMany({
      where: {
        OR: [
          {
            isHeld: true,
            heldUntil: {
              lt: now,
            },
          },
          {
            status: 'processing',
            heldUntil: {
              lt: now,
            },
          }
        ]
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

    for (const listing of expiredHolds) {
      // Release the hold on the listing and reset status
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          isHeld: false,
          heldUntil: null,
          status: 'active', // Reset status back to active when hold expires
        },
      });
      releasedCount++;

      // If it was stuck in processing, count it
      if (listing.status === 'processing') {
        resetProcessingCount++;
      }

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

    // Also find any listings stuck in PROCESSING status without holds (fallback cleanup)
    const stuckProcessingListings = await prisma.listing.findMany({
      where: {
        status: 'processing',
        OR: [
          { isHeld: false },
          { heldUntil: null }
        ]
      }
    });

    for (const listing of stuckProcessingListings) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          status: 'active',
          isHeld: false,
          heldUntil: null,
        },
      });
      resetProcessingCount++;

      // Create listing history event
      await prisma.listingHistory.create({
        data: {
          listingId: listing.id,
          eventType: 'STATUS_RESET',
          eventTitle: 'Processing Status Reset',
          description: 'Listing was stuck in processing status and has been reset to active',
          metadata: {
            resetAt: now.toISOString(),
            reason: 'Manual cleanup of stuck processing status',
          },
        },
      });
    }

    console.log(`Cleanup completed: ${releasedCount} holds released, ${cancelledOrdersCount} orders cancelled, ${resetProcessingCount} processing listings reset`);

    return NextResponse.json({
      success: true,
      releasedHolds: releasedCount,
      cancelledOrders: cancelledOrdersCount,
      resetProcessingListings: resetProcessingCount,
      message: `Cleanup completed: ${releasedCount} holds released, ${cancelledOrdersCount} orders cancelled, ${resetProcessingCount} processing listings reset`,
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
export const POST = GET;
