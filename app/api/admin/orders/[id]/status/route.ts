import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update order status in delivery workflow
 * PATCH /api/admin/orders/[id]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
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

    const { status, scheduledPickupTime, pickupTimeSlot, deliveryDriverId, estimatedDeliveryTime, deliveryNotes } = await request.json();

    // Validate status
    const validStatuses = [
      'PAID', 'PENDING_SCHEDULING', 'SCHEDULED', 
      'EN_ROUTE', 'DELIVERED', 'FINALIZED', 'DISPUTED', 'CANCELLED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: session.user.id
    };

    // Add conditional fields based on status
    if (scheduledPickupTime) {
      updateData.scheduledPickupTime = new Date(scheduledPickupTime);
    }
    if (pickupTimeSlot) {
      updateData.pickupTimeSlot = pickupTimeSlot;
    }
    if (deliveryDriverId) {
      updateData.deliveryDriverId = deliveryDriverId;
    }
    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    }
    if (deliveryNotes) {
      updateData.deliveryNotes = deliveryNotes;
    }

    // Set specific timestamps based on status
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    
    if (status === 'FINALIZED') {
      updateData.finalizedAt = new Date();
      // Ensure deliveredAt is set if not already
      if (!order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    // Update delivery attempts if moving to EN_ROUTE
    if (status === 'EN_ROUTE') {
      updateData.deliveryAttempts = order.deliveryAttempts + 1;
      updateData.lastDeliveryAttempt = new Date();
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        listing: {
          select: {
            itemId: true,
            title: true
          }
        },
        buyer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the status change (could be expanded to create audit trail)
    console.log(`Order ${params.id} status updated from ${order.status} to ${status} by admin ${session.user.id}`);

    return NextResponse.json({ 
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
