import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Extend checkout time by 5 minutes (max 15 minutes total)
 * This can only be used once per order to prevent abuse
 * 
 * POST /api/checkout/extend-time
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

    console.log('Extend time: Processing order:', orderId, 'for user:', session.user.id);

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
      console.log('Extend time: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is still in pending status
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is no longer pending' },
        { status: 400 }
      );
    }

    // Verify the listing is still available and held
    if (order.listing.status !== 'processing' || !order.listing.isHeld) {
      return NextResponse.json(
        { error: 'Listing is no longer being held for checkout' },
        { status: 400 }
      );
    }

    // Calculate the original order creation time
    const orderCreatedAt = new Date(order.createdAt);
    const currentTime = new Date();
    const timeSinceCreation = currentTime.getTime() - orderCreatedAt.getTime();
    const maxAllowedTime = 15 * 60 * 1000; // 15 minutes in milliseconds

    // Check if we've already reached the maximum allowed time
    if (timeSinceCreation >= maxAllowedTime) {
      return NextResponse.json(
        { error: 'Maximum checkout time (15 minutes) already reached' },
        { status: 400 }
      );
    }

    // Calculate new expiry time (add 5 minutes to current expiry)
    const currentExpiry = new Date(order.checkoutExpiresAt);
    const newExpiry = new Date(currentExpiry.getTime() + (5 * 60 * 1000)); // Add 5 minutes

    // Check if adding 5 minutes would exceed the 15-minute limit
    const totalTimeWithExtension = timeSinceCreation + (5 * 60 * 1000);
    if (totalTimeWithExtension > maxAllowedTime) {
      // Calculate the maximum time we can add
      const maxTimeToAdd = maxAllowedTime - timeSinceCreation;
      const adjustedExpiry = new Date(currentExpiry.getTime() + maxTimeToAdd);
      
      console.log('Extend time: Adding maximum allowed time:', Math.round(maxTimeToAdd / 1000 / 60), 'minutes');
      
      // Update order with adjusted expiry
      await prisma.order.update({
        where: { id: orderId },
        data: {
          checkoutExpiresAt: adjustedExpiry,
          updatedAt: new Date(),
        },
      });

      // Update listing hold
      await prisma.listing.update({
        where: { id: order.listing.id },
        data: {
          heldUntil: adjustedExpiry,
        },
      });

      return NextResponse.json({
        success: true,
        newExpiryTime: adjustedExpiry.toISOString(),
        timeAdded: Math.round(maxTimeToAdd / 1000 / 60),
        message: `Added ${Math.round(maxTimeToAdd / 1000 / 60)} minutes (maximum allowed)`
      });
    }

    // Add exactly 5 minutes
    console.log('Extend time: Adding 5 minutes to order:', orderId);
    
    // Update order with new expiry
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        checkoutExpiresAt: newExpiry,
        updatedAt: new Date(),
      },
    });

    // Update listing hold
    await prisma.listing.update({
      where: { id: order.listing.id },
      data: {
        heldUntil: newExpiry,
      },
    });

    console.log('Extend time: Order updated successfully:', {
      id: updatedOrder.id,
      newExpiry: updatedOrder.checkoutExpiresAt,
      timeAdded: 5
    });

    return NextResponse.json({
      success: true,
      newExpiryTime: newExpiry.toISOString(),
      timeAdded: 5,
      message: 'Added 5 minutes to checkout time'
    });

  } catch (error) {
    console.error('Error extending checkout time:', error);
    return NextResponse.json(
      { error: 'Failed to extend checkout time' },
      { status: 500 }
    );
  }
}
