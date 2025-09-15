/**
 * Automatic hold release utility
 * This should be called whenever listings are queried to ensure expired holds are released
 */

import { prisma } from '@/lib/prisma';

/**
 * Automatically release any expired holds
 * This runs as part of listing queries to ensure real-time hold expiration
 * CRITICAL: Only releases holds for listings with PENDING orders, not sold items
 */
export async function autoReleaseExpiredHolds(): Promise<{ releasedCount: number }> {
  try {
    const now = new Date();
    
    // Find listings with expired holds that have only PENDING orders (not sold)
    const expiredHoldListings = await prisma.listing.findMany({
      where: {
        isHeld: true,
        heldUntil: {
          lt: now,
        },
        // Only process listings that are NOT sold
        status: {
          in: ['active', 'processing']
        }
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING'] // Only check pending orders
            }
          }
        }
      }
    });

    let releasedCount = 0;

    // Process each listing individually to ensure we don't release sold items
    for (const listing of expiredHoldListings) {
      // Only release if all orders are PENDING, CANCELLED, or REFUNDED (no sold orders)
      const hasSoldOrders = await prisma.order.findFirst({
        where: {
          listingId: listing.id,
          status: {
            in: [
              'PAID', 
              'PROCESSING', 
              'SHIPPED', 
              'DELIVERED', 
              'FINALIZED', 
              'DISPUTED',
              'PENDING_SCHEDULING',
              'AWAITING_DELIVERY_SCHEDULING',
              'SCHEDULED',
              'EN_ROUTE'
            ]
          }
        }
      });

      // If there are no paid orders, it's safe to release the hold
      if (!hasPaidOrders) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            isHeld: false,
            heldUntil: null,
            status: 'active', // Reset status back to active when hold expires
          },
        });
        releasedCount++;

        // Cancel any expired pending orders for this listing
        await prisma.order.updateMany({
          where: {
            listingId: listing.id,
            status: 'PENDING',
            checkoutExpiresAt: {
              lt: now,
            },
          },
          data: {
            status: 'CANCELLED',
            isHeld: false,
          },
        });
      } else {
        console.log(`Skipping hold release for listing ${listing.id} - has paid orders`);
      }
    }

    // Log if any holds were released
    if (releasedCount > 0) {
      console.log(`Auto-released ${releasedCount} expired holds at ${now.toISOString()}`);
    }

    return { releasedCount };
  } catch (error) {
    console.error('Error auto-releasing expired holds:', error);
    return { releasedCount: 0 };
  }
}

/**
 * Check if a specific listing's hold has expired and release it
 * CRITICAL: Only releases holds for listings with PENDING orders, not sold items
 */
export async function checkAndReleaseListingHold(listingId: string): Promise<boolean> {
  try {
    const now = new Date();
    
    // First check if the listing has expired hold and is not sold
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        orders: {
          where: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FINALIZED']
            }
          }
        }
      }
    });

    if (!listing || !listing.isHeld || !listing.heldUntil || listing.heldUntil >= now) {
      return false; // No expired hold to release
    }

    // Don't release hold if listing has paid orders (it's sold)
    if (listing.orders.length > 0) {
      console.log(`Skipping hold release for listing ${listingId} - has paid orders`);
      return false;
    }

    // Safe to release the hold
    const result = await prisma.listing.update({
      where: { id: listingId },
      data: {
        isHeld: false,
        heldUntil: null,
        status: 'active',
      },
    });

    // Cancel any expired pending orders for this listing
    await prisma.order.updateMany({
      where: {
        listingId: listingId,
        status: 'PENDING',
        checkoutExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'CANCELLED',
        isHeld: false,
      },
    });

    return true;
  } catch (error) {
    console.error('Error checking listing hold:', error);
    return false;
  }
}

/**
 * Middleware function to be called before listing queries
 * This ensures expired holds are released before returning data
 */
export async function withAutoHoldRelease<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Release expired holds first
  await autoReleaseExpiredHolds();
  
  // Then execute the original operation
  return await operation();
}
