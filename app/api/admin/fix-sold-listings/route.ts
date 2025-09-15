import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Emergency fix for sold listings that were incorrectly released
 * This endpoint finds listings that should be marked as sold but are currently active
 * 
 * POST /api/admin/fix-sold-listings
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    let fixedCount = 0;

    // Find listings that have PAID/FINALIZED orders but are not marked as sold
    const incorrectListings = await prisma.listing.findMany({
      where: {
        status: {
          in: ['active', 'processing']
        },
        orders: {
          some: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED']
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED']
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    console.log(`Found ${incorrectListings.length} listings that should be marked as sold`);

    // Fix each listing
    for (const listing of incorrectListings) {
      const paidOrder = listing.orders[0];
      
      if (paidOrder) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            status: 'sold',
            isHeld: true, // Keep hold for sold items
            // Don't change heldUntil for sold items
          },
        });

        // Create history event
        await prisma.listingHistory.create({
          data: {
            listingId: listing.id,
            eventType: 'STATUS_CORRECTED',
            eventTitle: 'Status Corrected to Sold',
            description: `Listing status corrected from ${listing.status} to sold due to paid order ${paidOrder.id}`,
            metadata: { 
              orderId: paidOrder.id,
              orderStatus: paidOrder.status,
              previousStatus: listing.status,
              correctedBy: 'admin-fix'
            },
          },
        });

        fixedCount++;
        console.log(`Fixed listing ${listing.id} - marked as sold due to order ${paidOrder.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} listings that should be marked as sold`,
      fixedCount,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Error fixing sold listings:', error);
    return NextResponse.json(
      { 
        error: 'Fix failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}

// Also allow GET for checking what would be fixed
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find listings that have PAID/FINALIZED orders but are not marked as sold
    const incorrectListings = await prisma.listing.findMany({
      where: {
        status: {
          in: ['active', 'processing']
        },
        orders: {
          some: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED']
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED']
            }
          },
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Found ${incorrectListings.length} listings that should be marked as sold`,
      listings: incorrectListings.map(listing => ({
        id: listing.id,
        itemId: listing.itemId,
        title: listing.title,
        currentStatus: listing.status,
        isHeld: listing.isHeld,
        heldUntil: listing.heldUntil,
        paidOrders: listing.orders
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking sold listings:', error);
    return NextResponse.json(
      { 
        error: 'Check failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}
