/**
 * Automatic hold release utility
 * This should be called whenever listings are queried to ensure expired holds are released
 */

import { prisma } from '@/lib/prisma';

/**
 * Automatically release any expired holds
 * This runs as part of listing queries to ensure real-time hold expiration
 */
export async function autoReleaseExpiredHolds(): Promise<{ releasedCount: number }> {
  try {
    const now = new Date();
    
    // Find and release expired listing holds in a single operation
    const result = await prisma.listing.updateMany({
      where: {
        isHeld: true,
        heldUntil: {
          lt: now,
        },
      },
      data: {
        isHeld: false,
        heldUntil: null,
        status: 'active', // Reset status back to active when hold expires
      },
    });

    // Also cancel any expired pending orders
    await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        isHeld: true,
        checkoutExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'CANCELLED',
        isHeld: false,
      },
    });

    // Log if any holds were released
    if (result.count > 0) {
      console.log(`Auto-released ${result.count} expired holds at ${now.toISOString()}`);
    }

    return { releasedCount: result.count };
  } catch (error) {
    console.error('Error auto-releasing expired holds:', error);
    return { releasedCount: 0 };
  }
}

/**
 * Check if a specific listing's hold has expired and release it
 */
export async function checkAndReleaseListingHold(listingId: string): Promise<boolean> {
  try {
    const now = new Date();
    
    const result = await prisma.listing.updateMany({
      where: {
        id: listingId,
        isHeld: true,
        heldUntil: {
          lt: now,
        },
      },
      data: {
        isHeld: false,
        heldUntil: null,
        status: 'active',
      },
    });

    return result.count > 0;
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
