/**
 * Centralized cart calculation utilities
 * Provides consistent pricing calculations across all screens
 */

export interface CartItem {
  id: string;
  quantity: number;
  listing: {
    price: number;
    bulkItem?: boolean;
  };
}

export interface CartCalculations {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  hasBulkItems: boolean;
  hasNormalItems: boolean;
}

/**
 * Calculate cart totals with granular breakdown
 * @param items - Array of cart items
 * @param deliveryMethod - 'delivery' or 'pickup'
 * @returns Detailed cost breakdown
 */
export function calculateCartTotals(
  items: CartItem[],
  deliveryMethod: 'delivery' | 'pickup' = 'delivery'
): CartCalculations {
  // Calculate subtotal from items
  const subtotal = items.reduce((total, item) => {
    return total + (item.listing.price * item.quantity);
  }, 0);

  // Determine item types
  const hasBulkItems = items.some(item => item.listing.bulkItem === true);
  const hasNormalItems = items.some(item => item.listing.bulkItem !== true);

  // Calculate delivery fee based on subtotal, item types, and delivery method
  let deliveryFee = 0;
  
  if (deliveryMethod === 'delivery') {
    if (subtotal < 150) {
      if (hasBulkItems) {
        deliveryFee = 100; // $100 for bulk orders under $150
      } else {
        deliveryFee = 50; // $50 for normal orders under $150
      }
    } else if (subtotal >= 150 && hasBulkItems) {
      deliveryFee = 50; // $50 for bulk orders over $150
    }
    // No delivery fee for normal orders over $150
  }
  // No delivery fee for pickup

  // Calculate tax (8.25% - typical Texas rate)
  const taxRate = 0.0825;
  const tax = subtotal * taxRate;
  
  // Calculate total
  const total = subtotal + deliveryFee + tax;

  return {
    subtotal,
    deliveryFee,
    tax,
    total,
    hasBulkItems,
    hasNormalItems,
  };
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Get delivery fee explanation text
 * @param calculations - Cart calculations
 * @param deliveryMethod - Current delivery method
 * @returns Human-readable explanation
 */
export function getDeliveryFeeExplanation(
  calculations: CartCalculations,
  deliveryMethod: 'delivery' | 'pickup'
): string {
  if (deliveryMethod === 'pickup') {
    return 'Pickup - No delivery fee';
  }

  const { subtotal, hasBulkItems, deliveryFee } = calculations;

  if (deliveryFee === 0) {
    return hasBulkItems 
      ? 'Free delivery for bulk orders over $150'
      : 'Free delivery for orders over $150';
  }

  if (deliveryFee === 100) {
    return 'Bulk item delivery fee for orders under $150';
  }

  if (deliveryFee === 50) {
    return hasBulkItems && subtotal >= 150
      ? 'Bulk item delivery fee'
      : 'Standard delivery fee for orders under $150';
  }

  return 'Delivery fee';
}
