/**
 * Utility functions for listing button states and styling
 * Used across both the listings modal and list-item detail page
 */

export interface ListingButtonState {
  disabled: boolean;
  className: string;
  text: string;
  loading?: boolean;
}

export interface ListingStatus {
  status?: string;
  isOwner?: boolean;
  loadingPurchase?: boolean;
}

/**
 * Get the button state based on listing status
 * @param listing - The listing object with status
 * @param isOwner - Whether the current user owns the listing
 * @param loadingPurchase - Whether a purchase is currently in progress
 * @returns ButtonState object with disabled, className, and text
 */
export function getBuyNowButtonState({
  status,
  isOwner,
  loadingPurchase = false,
}: ListingStatus): ListingButtonState {
  // Handle loading state first
  if (loadingPurchase) {
    return {
      disabled: true,
      className: "flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white",
      text: "Processing...",
      loading: true,
    };
  }

  // Handle different statuses
  switch (status) {
    case "processing":
      return {
        disabled: true,
        className: "flex-1 bg-gray-400 cursor-not-allowed text-white",
        text: "Currently Processing",
      };

    case "sold":
      return {
        disabled: true,
        className: "flex-1 bg-gray-400 cursor-not-allowed text-white",
        text: "Sold Out",
      };

    default:
      // Active status or other
      if (isOwner) {
        return {
          disabled: false,
          className: "flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white",
          text: "Buy Your Own Item",
        };
      }
      
      return {
        disabled: false,
        className: "flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white",
        text: "Buy it Now",
      };
  }
}

/**
 * Get the status display information for overlays
 * @param status - The listing status
 * @returns Object with overlay display information
 */
export function getStatusOverlay(status?: string) {
  switch (status) {
    case "sold":
      return {
        show: true,
        className: "absolute inset-0 bg-black/50 flex items-center justify-center",
        badgeClassName: "bg-red-600 text-white px-6 py-3 rounded-lg text-xl font-bold transform rotate-12 shadow-lg",
        text: "SOLD",
      };

    case "processing":
      return {
        show: true,
        className: "absolute inset-0 bg-black/50 flex items-center justify-center",
        badgeClassName: "bg-gradient-to-r from-[#D4AF3D] to-[#b8932f] text-white px-6 py-3 rounded-lg text-xl font-bold transform rotate-12 shadow-lg",
        text: "PROCESSING",
      };

    default:
      return {
        show: false,
        className: "",
        badgeClassName: "",
        text: "",
      };
  }
}

/**
 * Check if a listing should be clickable based on its status
 * @param status - The listing status
 * @returns boolean indicating if the listing should be clickable
 */
export function isListingClickable(status?: string): boolean {
  return status !== "processing" && status !== "sold";
}
