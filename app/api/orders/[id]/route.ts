import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Order Management API
 * 
 * GET /api/orders/[id] - Get order details
 * PUT /api/orders/[id] - Update order status
 * 
 * Admin only: Update order status (delivered, finalized, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Orders API: Fetching order with ID:', id);
    
    let session;
    try {
      console.log('Orders API: Attempting to get session...');
      session = await auth.api.getSession({ headers: request.headers });
      console.log('Orders API: Session retrieved successfully:', !!session);
    } catch (authError) {
      console.error('Orders API: Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }

    if (!session?.user?.id) {
      console.log('Orders API: No session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Orders API: Session found for user:', session.user.id);

    // Fetch order with related data
    console.log('Orders API: Attempting to find order...');
    const order = await prisma.order.findFirst({
      where: { 
        id,
        // Only allow access to orders where user is buyer or seller
        OR: [
          { buyerId: session.user.id },
          { listing: { userId: session.user.id } }
        ]
      },
      include: {
        listing: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('Orders API: Order query completed. Found order:', !!order);
    
    if (!order) {
      console.log('Orders API: Order not found for ID:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Orders API: Order found. Buyer ID:', order.buyerId, 'Current User:', session.user.id);

    // Check if user has access to this order
    const isAdmin = session.user.role === 'admin';
    const isBuyer = order.buyerId === session.user.id;
    const isSeller = order.sellerId === session.user.id;

    if (!isAdmin && !isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // For checkout page requests, add expiration check
    if (request.nextUrl.searchParams.get('checkout') === 'true') {
      if (new Date() > new Date(order.checkoutExpiresAt)) {
        return NextResponse.json({ 
          error: 'Checkout session has expired',
          code: 'EXPIRED'
        }, { status: 410 });
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

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

    // Only admins can update order status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { status, trackingNumber, shippingAddress } = await request.json();

    // Validate status transition
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'PAID': ['PROCESSING'],
      'PROCESSING': ['SHIPPED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': ['FINALIZED'],
      'DISPUTED': ['PAID', 'CANCELLED'],
    };

    if (status && !validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // Set timestamps for specific statuses
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'FINALIZED') {
        updateData.finalizedAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (shippingAddress !== undefined) {
      updateData.shippingAddress = shippingAddress;
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    // Create order history event
    if (status) {
      await prisma.listingHistory.create({
        data: {
          listingId: updatedOrder.listingId,
          eventType: 'ORDER_STATUS_CHANGED',
          eventTitle: `Order ${status.toLowerCase()}`,
          description: `Order ${updatedOrder.id} status changed to ${status}`,
          metadata: {
            orderId: updatedOrder.id,
            previousStatus: order.status,
            newStatus: status,
            adminId: session.user.id,
          },
        },
      });
    }

    // Future: Handle Stripe Connect transfers when order is finalized
    if (status === 'FINALIZED') {
      // TODO: Implement transfer to seller
      // await transferToSeller(updatedOrder.id, updatedOrder.amount);
      console.log('Order finalized, ready for seller transfer:', updatedOrder.id);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
