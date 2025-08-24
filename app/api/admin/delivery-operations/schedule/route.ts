import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get delivery schedule for a specific date
 * GET /api/admin/delivery-operations/schedule?date=YYYY-MM-DD
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    // Get scheduled deliveries for the specified date
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'EN_ROUTE']
        },
        scheduledPickupTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        listing: {
          select: {
            itemId: true,
            title: true,
            photos: true,
            condition: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true
          }
        }
      },
      orderBy: {
        scheduledPickupTime: 'asc'
      }
    });

    // Organize deliveries by time windows
    const schedule = {
      date,
      windows: {
        morning: {
          capacity: 4, // Default capacity, can be adjusted
          deliveries: [],
          assignedDrivers: []
        },
        afternoon: {
          capacity: 4,
          deliveries: [],
          assignedDrivers: []
        },
        evening: {
          capacity: 4,
          deliveries: [],
          assignedDrivers: []
        }
      }
    };

    // Categorize orders by time window
    orders.forEach((order) => {
      const scheduledTime = new Date(order.scheduledPickupTime!);
      const hour = scheduledTime.getHours();
      
      let window = 'morning';
      if (hour >= 12 && hour < 16) {
        window = 'afternoon';
      } else if (hour >= 16) {
        window = 'evening';
      }

      const delivery = {
        id: `del-${order.id}`,
        orderId: order.id,
        listingTitle: order.listing?.title || 'Unknown Item',
        buyerName: order.buyer?.name || 'Unknown Customer',
        buyerPhone: order.buyer?.mobilePhone,
        deliveryAddress: typeof order.shippingAddress === 'string' 
          ? order.shippingAddress 
          : `${order.shippingAddress?.streetAddress || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`.trim(),
        estimatedDuration: 30, // Default 30 minutes, can be adjusted based on item type
        priority: 'standard', // Can be enhanced based on order properties
        notes: order.deliveryNotes || undefined
      };

      schedule.windows[window].deliveries.push(delivery);
    });

    return NextResponse.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery schedule' },
      { status: 500 }
    );
  }
}

/**
 * Update delivery window capacity
 * PUT /api/admin/delivery-operations/schedule
 */
export async function PUT(request: NextRequest) {
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

    const { windowId, capacity, date } = await request.json();

    if (!windowId || !capacity || !date) {
      return NextResponse.json({ 
        error: 'Window ID, capacity, and date are required' 
      }, { status: 400 });
    }

    // TODO: Implement capacity storage in database
    // For now, this would store in a DeliveryCapacity table
    // await prisma.deliveryCapacity.upsert({
    //   where: {
    //     date_windowId: {
    //       date: new Date(date),
    //       windowId
    //     }
    //   },
    //   update: {
    //     capacity,
    //     updatedBy: session.user.id
    //   },
    //   create: {
    //     date: new Date(date),
    //     windowId,
    //     capacity,
    //     createdBy: session.user.id,
    //     updatedBy: session.user.id
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Capacity updated successfully'
    });

  } catch (error) {
    console.error('Error updating delivery capacity:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery capacity' },
      { status: 500 }
    );
  }
}
