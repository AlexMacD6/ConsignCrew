/**
 * Utility functions for calculating sales prices based on discount schedules
 * This ensures consistent pricing across all components
 */

export interface DiscountSchedule {
  type: string;
  dropIntervals: number[];
  dropPercentages: number[];
  totalDuration: number;
}

export const DISCOUNT_SCHEDULES: Record<string, DiscountSchedule> = {
  "Turbo-30": {
    type: "Turbo-30",
    dropIntervals: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30],
    dropPercentages: [100, 95, 90, 85, 80, 75, 70, 65, 60, 0],
    totalDuration: 30,
  },
  "Classic-60": {
    type: "Classic-60",
    dropIntervals: [0, 7, 14, 21, 28, 35, 42, 49, 56, 60],
    dropPercentages: [100, 90, 80, 75, 70, 65, 60, 55, 50, 0],
    totalDuration: 60,
  },
};

/**
 * Calculate the current sales price based on discount schedule and listing duration
 * @param listing - The listing object containing price, discount schedule, and creation date
 * @returns The calculated sales price, or null if no discount applies
 */
export function calculateCurrentSalesPrice(listing: any): number | null {
  // Handle both 'price' and 'list_price' field names
  const listPrice = listing.list_price || listing.price;
  
  if (!listing.discount_schedule || !listing.created_at || !listPrice) {
    return null;
  }

  const scheduleType = listing.discount_schedule?.type || "Classic-60";
  const schedule = DISCOUNT_SCHEDULES[scheduleType];
  if (!schedule) return null;

  const now = new Date();
  const created = new Date(listing.created_at);
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If listing has expired, return reserve price or list price
  if (daysSinceCreation >= schedule.totalDuration) {
    return listing.reserve_price || listPrice;
  }

  // Find the current applicable discount percentage
  let currentPercentage = 100; // Start at 100% (full price)
  
  for (let i = 0; i < schedule.dropIntervals.length; i++) {
    if (daysSinceCreation >= schedule.dropIntervals[i]) {
      currentPercentage = schedule.dropPercentages[i];
    } else {
      break; // Found the current applicable percentage
    }
  }

  // Calculate current sales price based on list price and current percentage
  const currentSalesPrice = Math.round(listPrice * (currentPercentage / 100) * 100) / 100;
  
  // Don't go below reserve price
  if (listing.reserve_price && currentSalesPrice < listing.reserve_price) {
    return listing.reserve_price;
  }

  return currentSalesPrice;
}

/**
 * Get the display price for a listing (either sales price or list price)
 * @param listing - The listing object
 * @returns Object containing the display price and whether it's a discounted price
 */
export function getDisplayPrice(listing: any): { price: number; isDiscounted: boolean; originalPrice?: number } {
  // Handle both 'price' and 'list_price' field names
  const listPrice = listing.list_price || listing.price;
  
  if (!listPrice) {
    console.warn('Listing missing price field:', listing);
    return {
      price: 0,
      isDiscounted: false
    };
  }

  const salesPrice = calculateCurrentSalesPrice(listing);
  
  if (salesPrice && salesPrice < listPrice) {
    return {
      price: salesPrice,
      isDiscounted: true,
      originalPrice: listPrice
    };
  }
  
  return {
    price: listPrice,
    isDiscounted: false
  };
}

/**
 * Calculate the next drop price based on discount schedule
 * @param listing - The listing object
 * @returns The next drop price, or null if no more drops
 */
export function calculateNextDropPrice(listing: any): number | null {
  // Handle both 'price' and 'list_price' field names
  const listPrice = listing.list_price || listing.price;
  
  if (!listing.discount_schedule || !listing.created_at || !listPrice) {
    return null;
  }

  const scheduleType = listing.discount_schedule?.type || "Classic-60";
  const schedule = DISCOUNT_SCHEDULES[scheduleType];
  if (!schedule) return null;

  const now = new Date();
  const created = new Date(listing.created_at);
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If listing has expired, no more drops
  if (daysSinceCreation >= schedule.totalDuration) {
    return null;
  }

  // Find the next drop
  for (let i = 0; i < schedule.dropIntervals.length; i++) {
    if (schedule.dropIntervals[i] > daysSinceCreation) {
      const nextDropPercentage = schedule.dropPercentages[i];
      
      // Calculate actual dollar amount based on list price and schedule percentage
      const nextDropDollarAmount = Math.round(listPrice * (nextDropPercentage / 100) * 100) / 100;
      
      // Don't go below reserve price
      const finalPrice = listing.reserve_price
        ? Math.max(nextDropDollarAmount, listing.reserve_price)
        : nextDropDollarAmount;
      
      return finalPrice;
    }
  }

  return null;
}

/**
 * Get the time until next price drop
 * @param listing - The listing object
 * @returns Object containing time string and next drop time, or null if no more drops
 */
export function getTimeUntilNextDrop(listing: any): { timeString: string; nextDropTime: Date } | null {
  if (!listing.discount_schedule || !listing.created_at) {
    return null;
  }

  const scheduleType = listing.discount_schedule?.type || "Classic-60";
  const schedule = DISCOUNT_SCHEDULES[scheduleType];
  if (!schedule) return null;

  const now = new Date();
  const created = new Date(listing.created_at);
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If listing has expired, no more drops
  if (daysSinceCreation >= schedule.totalDuration) {
    return null;
  }

  // Find the next drop
  for (let i = 0; i < schedule.dropIntervals.length; i++) {
    if (schedule.dropIntervals[i] > daysSinceCreation) {
      const nextDropDay = schedule.dropIntervals[i];
      const nextDropTime = new Date(
        created.getTime() + nextDropDay * 24 * 60 * 60 * 1000
      );
      const timeUntilDrop = nextDropTime.getTime() - now.getTime();

      if (timeUntilDrop <= 0) {
        return { timeString: "Any moment now...", nextDropTime };
      }

      const days = Math.floor(timeUntilDrop / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeUntilDrop % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (timeUntilDrop % (1000 * 60 * 60)) / (1000 * 60)
      );

      let timeString = "";
      if (days > 0) {
        timeString += `${days}d `;
      }
      if (hours > 0 || days > 0) {
        timeString += `${hours.toString().padStart(2, "0")}h `;
      }
      timeString += `${minutes.toString().padStart(2, "0")}m`;

      return { timeString: timeString.trim(), nextDropTime };
    }
  }

  return null;
}
