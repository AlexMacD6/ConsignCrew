import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get all orders for delivery scheduling dashboard
 * GET /api/admin/orders/delivery-scheduler
 */
export async function GET(request: NextRequest) {
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

    // Get all orders that are in the delivery workflow
    const deliveryStatuses = [
      'PAID',
      'PENDING_SCHEDULING', 
      'SCHEDULED', 
      'EN_ROUTE', 
      'DELIVERED', 
      'FINALIZED',
      'DISPUTED'
    ];

    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: deliveryStatuses
        }
      },
      include: {
        listing: {
          select: {
            itemId: true,
            title: true,
            photos: true,
            facebookCondition: true,
            description: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true
          }
        },
        deliveryTimeSlots: {
          where: {
            status: "CONFIRMED",
            isActive: true
          },
          select: {
            date: true,
            windowId: true,
            windowLabel: true,
            startTime: true,
            endTime: true,
            selectedAt: true
          }
        }
      },
      orderBy: [
        { statusUpdatedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform the data for the frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      listingId: order.listingId,
      listing: {
        itemId: order.listing.itemId,
        title: order.listing.title,
        photos: order.listing.photos as string[],
        condition: order.listing.facebookCondition || 'Used',
        conditionNotes: order.listing.description
      },
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        email: order.buyer.email,
        mobilePhone: order.buyer.mobilePhone
      },
      seller: {
        id: order.seller.id,
        name: order.seller.name
      },
      amount: order.amount,
      status: order.status,
      shippingAddress: order.shippingAddress,
      scheduledPickupTime: order.scheduledPickupTime?.toISOString(),
      pickupTimeSlot: order.pickupTimeSlot,
      deliveryDriverId: order.deliveryDriverId,
      estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString(),
      deliveryNotes: order.deliveryNotes,
      deliveryAttempts: order.deliveryAttempts,
      lastDeliveryAttempt: order.lastDeliveryAttempt?.toISOString(),
      enRouteAt: order.enRouteAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      finalizedAt: order.finalizedAt?.toISOString(),
      deliveryPhotos: order.deliveryPhotos as string[] || null,
      contestPeriodExpiresAt: order.contestPeriodExpiresAt?.toISOString(),
      disputeReason: order.disputeReason,
      disputeCreatedAt: order.disputeCreatedAt?.toISOString(),
      disputeResolvedAt: order.disputeResolvedAt?.toISOString(),
      disputeResolution: order.disputeResolution,
      disputeAdminComments: order.disputeAdminComments,
      confirmedDeliverySlot: order.deliveryTimeSlots.length > 0 ? {
        date: order.deliveryTimeSlots[0].date.toISOString(),
        windowId: order.deliveryTimeSlots[0].windowId,
        windowLabel: order.deliveryTimeSlots[0].windowLabel,
        startTime: order.deliveryTimeSlots[0].startTime,
        endTime: order.deliveryTimeSlots[0].endTime,
        selectedAt: order.deliveryTimeSlots[0].selectedAt?.toISOString()
      } : null,
      createdAt: order.createdAt.toISOString(),
      statusUpdatedAt: order.statusUpdatedAt?.toISOString(),
      statusUpdatedBy: order.statusUpdatedBy
    }));

    return NextResponse.json({ 
      orders: transformedOrders,
      total: transformedOrders.length
    });

  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery orders' },
      { status: 500 }
    );
  }
}
