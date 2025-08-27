import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * System endpoint to cleanup expired checkout sessions without requiring user auth
 * This is called automatically when checkout timers expire
 * 
 * POST /api/system/cleanup-expired-order
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('System cleanup: Processing expired order:', orderId);

    // Fetch the order (no user ownership verification for system cleanup)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          select: {
            id: true,
            itemId: true,
            status: true,
            isHeld: true,
            heldUntil: true,
          }
        }
      }
    });

    if (!order) {
      console.log('System cleanup: Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order is actually expired
    const now = new Date();
    const orderExpiry = new Date(order.checkoutExpiresAt);
    const isExpired = now > orderExpiry;
    
    // Only allow cleanup for expired orders or pending orders
    const canCleanup = isExpired || order.status === 'PENDING';
    
    if (!canCleanup) {
      console.log('System cleanup: Order cannot be cleaned up - not expired and not pending:', orderId);
      return NextResponse.json(
        { error: 'Order is not eligible for cleanup' },
        { status: 400 }
      );
    }

    if (order.status === 'CANCELLED') {
      console.log('System cleanup: Order already cancelled:', orderId);
      return NextResponse.json({
        success: true,
        message: 'Order was already cancelled',
        orderId,
      });
    }

    console.log('System cleanup: Order is expired or pending, cleaning up...');

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the order to cancelled status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Check if this is a multi-item order and update all listings
      const priceBreakdown = (updatedOrder as any).shippingAddress?.priceBreakdown;
      const isMultiItem = priceBreakdown?.isMultiItem;
      const items = priceBreakdown?.items || [];

      let updatedListing;
      if (isMultiItem && items.length > 1) {
        // Update all listings in multi-item order
        for (const item of items) {
          await tx.listing.update({
            where: { id: item.listingId },
            data: {
              status: 'active',
              isHeld: false,
              heldUntil: null,
              updatedAt: new Date(),
            },
          });
        }
        // For response, use the first listing
        updatedListing = await tx.listing.findUnique({
          where: { id: order.listing.id }
        });
      } else {
        // Update single listing
        updatedListing = await tx.listing.update({
          where: { id: order.listing.id },
          data: {
            status: 'active',
            isHeld: false,
            heldUntil: null,
            updatedAt: new Date(),
          },
        });
      }

      // Create listing history event
      await tx.listingHistory.create({
        data: {
          listingId: order.listing.id,
          eventType: 'CHECKOUT_EXPIRED',
          eventTitle: 'Checkout Session Expired',
          description: 'Checkout session expired automatically, item returned to active status',
          metadata: {
            orderId: order.id,
            expiredAt: now.toISOString(),
            cleanupMethod: 'automatic_timer',
          },
        },
      });

      return {
        order: updatedOrder,
        listing: updatedListing,
      };
    });

    console.log('System cleanup: Successfully cleaned up expired order:', orderId);

    return NextResponse.json({
      success: true,
      message: 'Expired order cleaned up successfully',
      orderId,
      listingId: order.listing.id,
      itemId: order.listing.itemId,
    });

  } catch (error) {
    console.error('System cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
