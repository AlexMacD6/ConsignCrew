/**
 * Reusable Purchase Service
 * Handles Buy It Now functionality for listings across different components
 */

export interface PurchaseOptions {
  listingId: string;
  currentUserId?: string;
  isOwner?: boolean;
  overrideOwnPurchase?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  requiresOwnerConfirmation?: boolean;
  checkoutUrl?: string;
  orderId?: string;
}

/**
 * Initiate a purchase for a listing
 * @param options - Purchase configuration options
 * @returns Promise<PurchaseResult>
 */
export async function initiatePurchase(options: PurchaseOptions): Promise<PurchaseResult> {
  const { listingId, currentUserId, isOwner, overrideOwnPurchase } = options;

  if (!listingId) {
    return {
      success: false,
      error: "Unable to identify listing. Please refresh the page and try again."
    };
  }

  // If user is trying to buy their own listing and hasn't confirmed, require confirmation
  if (isOwner && !overrideOwnPurchase) {
    return {
      success: false,
      requiresOwnerConfirmation: true
    };
  }

  try {
    const response = await fetch("/api/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId: listingId,
        overrideOwnPurchase: overrideOwnPurchase || false,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        checkoutUrl: data.url,
        orderId: data.orderId
      };
    } else {
      return {
        success: false,
        error: data.error || "Failed to create checkout session"
      };
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: "Failed to create checkout session. Please try again."
    };
  }
}

/**
 * Redirect user to custom checkout page (with timer) or Stripe checkout
 * @param checkoutUrl - The Stripe checkout URL (for backwards compatibility)
 * @param orderId - The order ID (preferred - redirects to custom checkout page)
 */
export function redirectToCheckout(checkoutUrl?: string, orderId?: string): void {
  if (orderId) {
    // Redirect to our custom checkout page with timer
    window.location.href = `/checkout/${orderId}`;
  } else if (checkoutUrl) {
    // Fallback to direct Stripe redirect
    window.location.href = checkoutUrl;
  } else {
    throw new Error('Either orderId or checkoutUrl must be provided');
  }
}

/**
 * Complete purchase flow - combines initiatePurchase and redirectToCheckout
 * @param options - Purchase configuration options
 * @returns Promise<PurchaseResult> - If successful, will redirect to checkout
 */
export async function completePurchaseFlow(options: PurchaseOptions): Promise<PurchaseResult> {
  const result = await initiatePurchase(options);
  
  if (result.success && (result.orderId || result.checkoutUrl)) {
    redirectToCheckout(result.checkoutUrl, result.orderId);
  }
  
  return result;
}

/**
 * Hook for React components to use purchase functionality
 * @param currentUserId - The current user's ID for ownership checking
 * @returns Object with purchase functions and utilities
 */
export function usePurchaseService(currentUserId?: string | null) {
  /**
   * Handle buy now action for a listing
   * @param listing - The listing object with id and user information
   * @param onOwnerConfirmationRequired - Callback when owner confirmation is needed
   * @param onError - Callback for handling errors
   * @param onSuccess - Optional callback for successful purchase initiation
   */
  const handleBuyNow = async (
    listing: { itemId?: string; item_id?: string; user?: { id: string } },
    onOwnerConfirmationRequired: () => void,
    onError: (error: string) => void,
    onSuccess?: () => void
  ) => {
    // Get listing ID from either itemId or item_id property
    const listingId = listing.itemId || listing.item_id;
    const isOwner = listing?.user?.id === currentUserId;

    const result = await initiatePurchase({
      listingId: listingId || '',
      currentUserId: currentUserId || undefined,
      isOwner,
    });

    if (result.requiresOwnerConfirmation) {
      onOwnerConfirmationRequired();
    } else if (result.success && (result.orderId || result.checkoutUrl)) {
      onSuccess?.();
      redirectToCheckout(result.checkoutUrl, result.orderId);
    } else if (result.error) {
      onError(result.error);
    }
  };

  /**
   * Confirm purchase of own listing (after user confirmation)
   * @param listing - The listing object
   * @param onError - Callback for handling errors
   * @param onSuccess - Optional callback for successful purchase initiation
   */
  const confirmOwnPurchase = async (
    listing: { itemId?: string; item_id?: string },
    onError: (error: string) => void,
    onSuccess?: () => void
  ) => {
    const listingId = listing.itemId || listing.item_id;

    const result = await initiatePurchase({
      listingId: listingId || '',
      currentUserId: currentUserId || undefined,
      isOwner: true,
      overrideOwnPurchase: true,
    });

    if (result.success && (result.orderId || result.checkoutUrl)) {
      onSuccess?.();
      redirectToCheckout(result.checkoutUrl, result.orderId);
    } else if (result.error) {
      onError(result.error);
    }
  };

  return {
    handleBuyNow,
    confirmOwnPurchase,
    initiatePurchase,
    completePurchaseFlow,
  };
}
