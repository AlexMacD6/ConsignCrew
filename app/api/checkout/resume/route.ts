import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Find and resume active checkout sessions for the current user
 * 
 * GET /api/checkout/resume - Get active checkout sessions
 * POST /api/checkout/resume - Resume a specific checkout session with time extension
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find all pending orders for this user that haven't expired
    const now = new Date();
    
    const activeOrders = await prisma.order.findMany({
      where: {
        buyerId: session.user.id,
        status: 'PENDING',
        checkoutExpiresAt: {
          gt: now // Only non-expired orders
        }
      },
      include: {
        listing: {
          select: {
            id: true,
            itemId: true,
            title: true,
            photos: true,
            status: true,
            isHeld: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedOrders = activeOrders.map(order => ({
      id: order.id,
      amount: order.amount,
      createdAt: order.createdAt,
      expiresAt: order.checkoutExpiresAt,
      timeRemaining: Math.max(0, Math.floor((new Date(order.checkoutExpiresAt).getTime() - now.getTime()) / 1000)),
      listing: {
        itemId: order.listing.itemId,
        title: order.listing.title,
        photos: order.listing.photos,
        status: order.listing.status
      },
      resumeUrl: `/checkout/${order.id}`
    }));

    return NextResponse.json({
      success: true,
      activeOrders: formattedOrders,
      count: formattedOrders.length
    });

  } catch (error) {
    console.error('Error finding active checkout sessions:', error);
    return NextResponse.json(
      { error: 'Failed to find active checkout sessions' },
      { status: 500 }
    );
  }
}

/**
 * Resume a specific checkout session and extend the timer by 10 minutes
 * 
 * POST /api/checkout/resume
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

    console.log('Resume checkout: Processing order:', orderId, 'for user:', session.user.id);

    // Find the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        buyerId: session.user.id 
      },
      include: {
        listing: {
          select: {
            id: true,
            itemId: true,
            title: true,
            status: true,
            isHeld: true,
            heldUntil: true,
          }
        }
      }
    });

    if (!order) {
      console.log('Resume checkout: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is still pending
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is no longer pending' },
        { status: 400 }
      );
    }

    // Check if the order is expired
    const now = new Date();
    const orderExpiry = new Date(order.checkoutExpiresAt);
    const isExpired = now > orderExpiry;

    if (isExpired) {
      return NextResponse.json(
        { error: 'Order has expired and cannot be resumed' },
        { status: 400 }
      );
    }

    // Extend the checkout timer by 10 minutes from now
    const newExpiryTime = new Date(now.getTime() + 10 * 60 * 1000);

    // Update the order and listing
    const result = await prisma.$transaction(async (tx) => {
      // Update order expiry time
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          checkoutExpiresAt: newExpiryTime,
          updatedAt: new Date(),
        },
      });

      // Ensure listing is still held and extend hold time
      const updatedListing = await tx.listing.update({
        where: { id: order.listing.id },
        data: {
          isHeld: true,
          heldUntil: newExpiryTime,
          status: 'processing',
          updatedAt: new Date(),
        },
      });

      return { updatedOrder, updatedListing };
    });

    console.log('Resume checkout: Successfully extended checkout time:', {
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newExpiryTime: newExpiryTime.toISOString(),
      timeAdded: '10 minutes'
    });

    return NextResponse.json({
      success: true,
      message: 'Checkout session resumed with 10 minutes added',
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newExpiryTime: newExpiryTime.toISOString(),
      checkoutUrl: `/checkout/${orderId}?resumed=true`
    });

  } catch (error) {
    console.error('Error resuming checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to resume checkout session' },
      { status: 500 }
    );
  }
}
