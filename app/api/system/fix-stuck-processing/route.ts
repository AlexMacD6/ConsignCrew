import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * System endpoint to fix listings stuck in PROCESSING status
 * This can be called without authentication for system maintenance
 * 
 * GET /api/system/fix-stuck-processing
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    let fixedCount = 0;

    console.log('System: Starting cleanup of stuck processing listings...');

    // Find listings stuck in PROCESSING status that should be active
    const stuckProcessingListings = await prisma.listing.findMany({
      where: {
        status: 'processing',
        OR: [
          { isHeld: false },
          { heldUntil: null },
          { heldUntil: { lt: now } }
        ]
      },
      include: {
        orders: {
          where: {
            status: 'PENDING',
            checkoutExpiresAt: { lt: now }
          }
        }
      }
    });

    console.log(`System: Found ${stuckProcessingListings.length} listings stuck in processing status`);

    for (const listing of stuckProcessingListings) {
      try {
        // Use a transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // Update listing back to active
          await tx.listing.update({
            where: { id: listing.id },
            data: {
              status: 'active',
              isHeld: false,
              heldUntil: null,
              updatedAt: new Date(),
            },
          });

          // Cancel any expired orders for this listing
          if (listing.orders.length > 0) {
            await tx.order.updateMany({
              where: {
                listingId: listing.id,
                status: 'PENDING',
                checkoutExpiresAt: { lt: now }
              },
              data: {
                status: 'CANCELLED',
                updatedAt: new Date(),
              },
            });
          }

          // Create listing history event
          await tx.listingHistory.create({
            data: {
              listingId: listing.id,
              eventType: 'STATUS_RESET',
              eventTitle: 'Processing Status Reset',
              description: 'Listing was stuck in processing status and has been automatically reset to active',
              metadata: {
                resetAt: now.toISOString(),
                reason: 'System cleanup of stuck processing status',
                expiredOrders: listing.orders.length,
              },
            },
          });
        });

        fixedCount++;
        console.log(`System: Fixed listing ${listing.id} stuck in processing status`);
      } catch (error) {
        console.error(`System: Error fixing listing ${listing.id}:`, error);
      }
    }

    console.log(`System: Fixed ${fixedCount} listings stuck in processing status`);

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${fixedCount} listings stuck in processing status`,
      fixedCount,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('System: Error fixing stuck processing listings:', error);
    return NextResponse.json(
      { error: 'Failed to fix stuck processing listings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also allow POST for consistency
export const POST = GET;
