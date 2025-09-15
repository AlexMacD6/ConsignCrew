import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * System endpoint to fix sold listings that were incorrectly released
 * This is a system-level endpoint for emergency fixes
 * 
 * GET /api/system/fix-sold-listings - Check what needs fixing
 * POST /api/system/fix-sold-listings - Apply fixes
 */
export async function GET(request: NextRequest) {
  try {
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
            createdAt: true,
            amount: true
          }
        }
      }
    });

    console.log(`System check: Found ${incorrectListings.length} listings that should be marked as sold`);

    return NextResponse.json({
      success: true,
      message: `Found ${incorrectListings.length} listings that should be marked as sold`,
      count: incorrectListings.length,
      listings: incorrectListings.map(listing => ({
        id: listing.id,
        itemId: listing.itemId,
        title: listing.title,
        currentStatus: listing.status,
        isHeld: listing.isHeld,
        heldUntil: listing.heldUntil,
        paidOrders: listing.orders.map(order => ({
          id: order.id,
          status: order.status,
          amount: order.amount,
          createdAt: order.createdAt
        }))
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('System check error:', error);
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

export async function POST(request: NextRequest) {
  try {
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

    console.log(`System fix: Found ${incorrectListings.length} listings that should be marked as sold`);

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
              correctedBy: 'system-fix',
              fixedAt: now.toISOString()
            },
          },
        });

        fixedCount++;
        console.log(`System fix: Fixed listing ${listing.id} (${listing.itemId}) - marked as sold due to order ${paidOrder.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} listings that should be marked as sold`,
      fixedCount,
      fixedListings: incorrectListings.slice(0, fixedCount).map(listing => ({
        id: listing.id,
        itemId: listing.itemId,
        title: listing.title,
        orderId: listing.orders[0]?.id
      })),
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('System fix error:', error);
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
