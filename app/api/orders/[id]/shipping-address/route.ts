import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update shipping address for an order during checkout
 * PUT /api/orders/[id]/shipping-address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { shippingAddress } = await request.json();

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Find the order and verify the user owns it
    const order = await prisma.order.findUnique({
      where: { id },
      select: { 
        id: true, 
        buyerId: true, 
        status: true, 
        checkoutExpiresAt: true 
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this order
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied - you can only update your own orders' },
        { status: 403 }
      );
    }

    // Only allow updating shipping address for pending orders that haven't expired
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot update shipping address for this order status' },
        { status: 400 }
      );
    }

    // Check if checkout session is still valid
    if (new Date() > new Date(order.checkoutExpiresAt)) {
      return NextResponse.json(
        { error: 'Checkout session has expired' },
        { status: 410 }
      );
    }

    // Update the order with the shipping address
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        shippingAddress: shippingAddress,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        shippingAddress: true,
        updatedAt: true,
      },
    });

    console.log(`Shipping address updated for order ${id}:`, shippingAddress);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Shipping address updated successfully',
    });

  } catch (error) {
    console.error('Error updating shipping address:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping address' },
      { status: 500 }
    );
  }
}
