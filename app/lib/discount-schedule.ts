import { prisma } from '@/lib/prisma';
import { createHistoryEvent, HistoryEvents } from './listing-history';

export interface DiscountSchedule {
  type: 'Turbo-30' | 'Classic-60';
  dropIntervals: number[]; // Days when drops occur
  dropPercentages: number[]; // Percentage of original price at each drop
  totalDuration: number; // Total days
}

export const DISCOUNT_SCHEDULES: Record<string, DiscountSchedule> = {
  'Turbo-30': {
    type: 'Turbo-30',
    dropIntervals: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30], // Days
    dropPercentages: [100, 95, 90, 85, 80, 75, 70, 65, 60, 0], // Percentages (0 = expire)
    totalDuration: 30, // 30 days
  },
  'Classic-60': {
    type: 'Classic-60',
    dropIntervals: [0, 7, 14, 21, 28, 35, 42, 49, 56, 60], // Days
    dropPercentages: [100, 90, 80, 75, 70, 65, 60, 55, 50, 0], // Percentages (0 = expire)
    totalDuration: 60, // 60 days
  },
};

/**
 * Calculate the number of days since listing creation
 */
export function calculateDaysSinceCreation(createdAt: Date): number {
  const now = new Date();
  const elapsed = now.getTime() - createdAt.getTime();
  return Math.floor(elapsed / (1000 * 60 * 60 * 24)); // Convert to days
}

/**
 * Calculate the current drop index based on days since creation
 */
export function calculateCurrentDropIndex(
  createdAt: Date,
  discountSchedule: DiscountSchedule
): number {
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired, return the last index
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return discountSchedule.dropIntervals.length - 1;
  }
  
  // Find the current drop index
  for (let i = discountSchedule.dropIntervals.length - 1; i >= 0; i--) {
    if (daysSinceCreation >= discountSchedule.dropIntervals[i]) {
      return i;
    }
  }
  
  return 0; // Before first drop
}

/**
 * Calculate what the current price should be based on discount schedule
 * Reserve price is the absolute minimum - no discount can go below it
 */
export function calculateCurrentPrice(
  originalPrice: number,
  createdAt: Date,
  discountSchedule: DiscountSchedule,
  reservePrice: number = 0
): number {
  const currentDropIndex = calculateCurrentDropIndex(createdAt, discountSchedule);
  const currentPercentage = discountSchedule.dropPercentages[currentDropIndex];
  
  // If expired (0%), return reserve price instead of 0
  if (currentPercentage === 0) {
    return reservePrice > 0 ? reservePrice : 0;
  }
  
  const discountedPrice = Math.round(originalPrice * (currentPercentage / 100) * 100) / 100;
  
  // ENFORCE RESERVE PRICE - never go below it regardless of discount schedule
  return reservePrice > 0 ? Math.max(discountedPrice, reservePrice) : discountedPrice;
}

/**
 * Calculate the next drop price based on original list price and discount schedule
 * This ensures consistent pricing: $120 → $108 → $96 → $90 (not compound drops)
 * All percentages are based on the original list price, not retail price
 */
export function calculateNextDropPriceFromOriginal(
  originalPrice: number,
  createdAt: Date,
  discountSchedule: DiscountSchedule,
  reservePrice: number = 0
): number | null {
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired, no more drops
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return null;
  }
  
  // Find the next drop interval
  for (let i = 0; i < discountSchedule.dropIntervals.length; i++) {
    if (discountSchedule.dropIntervals[i] > daysSinceCreation) {
      // Use the percentage from the discount schedule (percentage of ORIGINAL LIST PRICE)
      const nextDropPercentage = discountSchedule.dropPercentages[i];
      
      // If this percentage is 0, listing expires
      if (nextDropPercentage === 0) {
        return null;
      }
      
      // Calculate price as percentage of ORIGINAL LIST PRICE
      const nextPrice = Math.round(originalPrice * (nextDropPercentage / 100) * 100) / 100;
      
      // Don't go below reserve price
      return Math.max(nextPrice, reservePrice);
    }
  }
  
  return null;
}

/**
 * Calculate the next drop information
 */
export function calculateNextDropInfo(
  createdAt: Date,
  discountSchedule: DiscountSchedule
): {
  daysUntilNextDrop: number;
  nextDropPercentage: number;
  nextDropPrice: number;
  originalPrice: number;
} | null {
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired, no more drops
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return null;
  }
  
  // Find the next drop
  for (let i = 0; i < discountSchedule.dropIntervals.length; i++) {
    if (discountSchedule.dropIntervals[i] > daysSinceCreation) {
      const daysUntilNextDrop = discountSchedule.dropIntervals[i] - daysSinceCreation;
      const nextDropPercentage = discountSchedule.dropPercentages[i];
      
      return {
        daysUntilNextDrop,
        nextDropPercentage,
        nextDropPrice: 0, // Will be calculated with original price
        originalPrice: 0, // Will be set by caller
      };
    }
  }
  
  return null;
}

/**
 * Check if a listing needs a price drop and execute it
 */
export async function processPriceDrop(listingId: string): Promise<boolean> {
  try {
    // Get the listing with price history
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!listing || listing.status !== 'active') {
      return false;
    }

    const discountScheduleData = listing.discountSchedule as any;
    const scheduleType = discountScheduleData?.type || 'Classic-60';
    const discountSchedule = DISCOUNT_SCHEDULES[scheduleType];

    if (!discountSchedule) {
      console.error(`Invalid discount schedule: ${scheduleType}`);
      return false;
    }

    // Get the original price (first price in history or current price)
    const originalPrice = listing.priceHistory[0]?.price || listing.price;
    const currentPrice = listing.price;
    const expectedPrice = calculateCurrentPrice(originalPrice, listing.createdAt, discountSchedule, listing.reservePrice || 0);

    // Use the original-price-based drop calculation for consistent drops
    const newDropPrice = calculateNextDropPriceFromOriginal(
      originalPrice,
      listing.createdAt,
      discountSchedule,
      listing.reservePrice || 0
    );

    // Check if price drop is needed (only if we have a valid next drop price)
    if (newDropPrice !== null && newDropPrice < currentPrice) {
      const newPrice = newDropPrice;
      
      // Update the listing price
      await prisma.listing.update({
        where: { id: listingId },
        data: { price: newPrice },
      });

      // Add to price history
      await prisma.priceHistory.create({
        data: {
          listingId: listingId,
          price: newPrice,
        },
      });

      // Create history event
      await createHistoryEvent(listing.itemId, HistoryEvents.PRICE_DROP(currentPrice, newPrice));

      console.log(`Price drop executed for listing ${listing.itemId}: $${currentPrice} → $${newPrice}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing price drop for listing ${listingId}:`, error);
    return false;
  }
}

/**
 * Process price drops for all active listings
 */
export async function processAllPriceDrops(): Promise<{
  processed: number;
  dropped: number;
  errors: number;
}> {
  let processed = 0;
  let dropped = 0;
  let errors = 0;

  try {
    // Get all active listings
    const activeListings = await prisma.listing.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        itemId: true,
        createdAt: true,
        discountSchedule: true,
      },
    });

    // Filter to only those with discount schedules
    const listingsWithDiscountSchedules = activeListings.filter(
      listing => listing.discountSchedule !== null
    );

    console.log(`Processing price drops for ${listingsWithDiscountSchedules.length} active listings...`);

    for (const listing of listingsWithDiscountSchedules) {
      try {
        processed++;
        const wasDropped = await processPriceDrop(listing.id);
        if (wasDropped) {
          dropped++;
        }
      } catch (error) {
        errors++;
        console.error(`Error processing listing ${listing.itemId}:`, error);
      }
    }

    console.log(`Price drop processing complete: ${processed} processed, ${dropped} dropped, ${errors} errors`);
    return { processed, dropped, errors };
  } catch (error) {
    console.error('Error in processAllPriceDrops:', error);
    return { processed, dropped, errors };
  }
}

/**
 * Get time until next price drop for a listing
 */
export function getTimeUntilNextDrop(
  createdAt: Date,
  discountSchedule: DiscountSchedule
): string | null {
  const nextDropInfo = calculateNextDropInfo(createdAt, discountSchedule);
  
  if (!nextDropInfo) {
    return null; // No more drops
  }
  
  const { daysUntilNextDrop } = nextDropInfo;
  
  if (daysUntilNextDrop === 0) {
    return "Any moment now...";
  }
  
  if (daysUntilNextDrop === 1) {
    return "1 day";
  }
  
  return `${daysUntilNextDrop} days`;
}

/**
 * Get the next drop percentage for a listing
 */
export function getNextDropPercentage(
  createdAt: Date,
  discountSchedule: DiscountSchedule
): number {
  const nextDropInfo = calculateNextDropInfo(createdAt, discountSchedule);
  
  if (!nextDropInfo) {
    return 0; // No more drops
  }
  
  return nextDropInfo.nextDropPercentage;
} 

/**
 * Calculate the sale price for Facebook catalog integration
 * This determines when to use Facebook's sale_price field vs the main price field
 * Sale price is only active after the first discount interval (not at 100% original price)
 */
export function calculateFacebookSalePrice(
  originalPrice: number,
  createdAt: Date,
  discountSchedule: DiscountSchedule,
  reservePrice: number = 0
): {
  shouldUseSalePrice: boolean;
  salePrice: number | null;
  mainPrice: number;
} {
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired, keep at reserve price instead of 0%
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return {
      shouldUseSalePrice: false,
      salePrice: null,
      mainPrice: Math.max(originalPrice, reservePrice) // Keep at reserve price, not 0%
    };
  }
  
  // Find the current drop index
  const currentDropIndex = calculateCurrentDropIndex(createdAt, discountSchedule);
  const currentPercentage = discountSchedule.dropPercentages[currentDropIndex];
  
  // If we're still at the first interval (100% original price), no sale price
  if (currentDropIndex === 0) {
    return {
      shouldUseSalePrice: false,
      salePrice: null,
      mainPrice: originalPrice
    };
  }
  
  // Calculate the current discounted price
  const currentDiscountedPrice = Math.round(originalPrice * (currentPercentage / 100) * 100) / 100;
  
  // Don't go below reserve price
  const finalSalePrice = Math.max(currentDiscountedPrice, reservePrice);
  
  return {
    shouldUseSalePrice: true,
    salePrice: finalSalePrice,
    mainPrice: originalPrice
  };
}

/**
 * Check if a listing should be considered "active" for Facebook sync
 * This determines whether the listing should be pushed to Facebook catalog
 */
export function isListingActiveForFacebook(
  createdAt: Date,
  discountSchedule: DiscountSchedule,
  currentStatus: string = 'active'
): boolean {
  // If listing status is not active, don't sync to Facebook
  if (currentStatus !== 'active') {
    return false;
  }
  
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired (past total duration), don't sync to Facebook
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return false;
  }
  
  // If listing is still within the active period, sync to Facebook
  return true;
}

/**
 * Get the effective price for Facebook sync (handles expiration gracefully)
 * This ensures expired listings show reserve price instead of 0%
 */
export function getEffectiveFacebookPrice(
  originalPrice: number,
  createdAt: Date,
  discountSchedule: DiscountSchedule,
  reservePrice: number = 0
): number {
  const daysSinceCreation = calculateDaysSinceCreation(createdAt);
  
  // If listing has expired, return reserve price instead of 0%
  if (daysSinceCreation >= discountSchedule.totalDuration) {
    return Math.max(originalPrice, reservePrice); // Keep at reserve price, not 0%
  }
  
  // If listing is still active, return original price
  return originalPrice;
}

/**
 * Check if a listing should be synced to Facebook based on its status and discount schedule
 * This is a simpler helper function for individual listing checks
 */
export function shouldSyncListingToFacebook(
  createdAt: Date,
  discountSchedule: DiscountSchedule | null,
  currentStatus: string = 'active'
): boolean {
  // If no discount schedule, don't sync
  if (!discountSchedule) {
    return false;
  }
  
  // Use the existing function to check if active
  return isListingActiveForFacebook(createdAt, discountSchedule, currentStatus);
} 