import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/ses-server';
import { getEnRouteEmailTemplate, getDeliveryConfirmationEmailTemplate } from '@/lib/email-templates';

/**
 * Update order status in delivery workflow
 * PATCH /api/admin/orders/[id]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { status, scheduledPickupTime, pickupTimeSlot, deliveryDriverId, estimatedDeliveryTime, deliveryNotes, enRouteAt, deliveredAt, deliveryPhotos } = await request.json();

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
      where: { id }
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
      // Use custom deliveredAt if provided, otherwise use current time
      const deliveryTime = deliveredAt ? new Date(deliveredAt) : new Date();
      updateData.deliveredAt = deliveryTime;
      // Set contest period to expire 24 hours after delivery
      updateData.contestPeriodExpiresAt = new Date(deliveryTime.getTime() + 24 * 60 * 60 * 1000);
      // Add delivery photos if provided
      if (deliveryPhotos && Array.isArray(deliveryPhotos)) {
        updateData.deliveryPhotos = deliveryPhotos;
      }
    }
    
    if (status === 'FINALIZED') {
      updateData.finalizedAt = new Date();
      // Ensure deliveredAt is set if not already
      if (!order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    // Update delivery attempts and timestamp if moving to EN_ROUTE
    if (status === 'EN_ROUTE') {
      updateData.deliveryAttempts = order.deliveryAttempts + 1;
      updateData.lastDeliveryAttempt = new Date();
      // Use custom enRouteAt if provided, otherwise use current time
      updateData.enRouteAt = enRouteAt ? new Date(enRouteAt) : new Date();
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
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
    console.log(`Order ${id} status updated from ${order.status} to ${status} by admin ${session.user.id}`);

    // Send En Route notification email to customer
    if (status === 'EN_ROUTE') {
      try {
        const subject = `Your Order is On the Way! - Order #${updatedOrder.id.slice(-8).toUpperCase()}`;
        const emailContent = getEnRouteEmailTemplate({
          customerName: updatedOrder.buyer.name,
          orderId: updatedOrder.id,
          itemTitle: updatedOrder.listing.title,
          itemId: updatedOrder.listing.itemId,
          deliveryNotes: updatedOrder.deliveryNotes || undefined,
          phoneNumber: "(713) 899-3656" // TreasureHub support phone number
        });

        await sendEmail(
          updatedOrder.buyer.email,
          subject,
          emailContent
        );

        console.log(`En Route notification email sent to ${updatedOrder.buyer.email} for order ${id}`);
      } catch (emailError) {
        console.error('Failed to send En Route notification email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    // Send Delivery Confirmation email to customer
    if (status === 'DELIVERED') {
      try {
        const subject = `Delivery Confirmed! - Order #${updatedOrder.id.slice(-8).toUpperCase()}`;
        const emailContent = getDeliveryConfirmationEmailTemplate({
          customerName: updatedOrder.buyer.name,
          orderId: updatedOrder.id,
          itemTitle: updatedOrder.listing.title,
          itemId: updatedOrder.listing.itemId,
          deliveredAt: updatedOrder.deliveredAt?.toISOString() || new Date().toISOString(),
          deliveryPhotos: updatedOrder.deliveryPhotos as string[] || undefined,
          phoneNumber: "(713) 899-3656", // TreasureHub support phone number
          contestPeriodExpiresAt: updatedOrder.contestPeriodExpiresAt?.toISOString()
        });

        await sendEmail(
          updatedOrder.buyer.email,
          subject,
          emailContent
        );

        console.log(`Delivery confirmation email sent to ${updatedOrder.buyer.email} for order ${id}`);
      } catch (emailError) {
        console.error('Failed to send delivery confirmation email:', emailError);
        // Don't fail the status update if email fails
      }
    }

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
