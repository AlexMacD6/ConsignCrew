import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Immediately cleanup expired checkout sessions and push listings back to active
 * This is called when the frontend detects an expired session
 * 
 * POST /api/checkout/cleanup-expired
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('Cleanup expired: Processing order:', orderId, 'for user:', session.user.id);

    // Fetch the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        buyerId: session.user.id 
      },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            isHeld: true,
            heldUntil: true,
          }
        }
      }
    });

    if (!order) {
      console.log('Cleanup expired: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order is actually expired
    const now = new Date();
    const orderExpiry = new Date(order.checkoutExpiresAt);
    const isExpired = now > orderExpiry;

    if (!isExpired) {
      return NextResponse.json(
        { error: 'Order is not expired yet' },
        { status: 400 }
      );
    }

    // Check if order is still in pending status
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is no longer pending' },
        { status: 400 }
      );
    }

    console.log('Cleanup expired: Order is expired, cleaning up...');

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

      // Update the listing to active status and remove hold
      const updatedListing = await tx.listing.update({
        where: { id: order.listing.id },
        data: {
          status: 'active',
          isHeld: false,
          heldUntil: null,
          updatedAt: new Date(),
        },
      });

      return { updatedOrder, updatedListing };
    });

    console.log('Cleanup expired: Successfully cleaned up expired session:', {
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newOrderStatus: result.updatedOrder.status,
      newListingStatus: result.updatedListing.status
    });

    return NextResponse.json({
      success: true,
      message: 'Expired session cleaned up successfully',
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newOrderStatus: result.updatedOrder.status,
      newListingStatus: result.updatedListing.status
    });

  } catch (error) {
    console.error('Error cleaning up expired session:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired session' },
      { status: 500 }
    );
  }
}
