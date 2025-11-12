/**
 * Client-side Meta Pixel utility for tracking events
 * This file provides a safe way to track Meta Pixel events from the frontend
 * with event_id deduplication and optimized fallback logic
 */

import { v4 as uuid } from 'uuid';

declare global {
  interface Window {
    fbq: any;
  }
}

export interface MetaPixelEvent {
  event_name: string;
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: {
    [key: string]: any;
  };
}

// Stricter types for product events
export interface ProductEvent {
  content_ids: string[];     // Required for product events
  content_type?: 'product';
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  brand?: string;
  condition?: string;
  availability?: string;
  price?: number;
  sale_price?: number;
  gtin?: string;
  // Enhanced Facebook Shop catalog fields
  gender?: string;
  color?: string;
  size?: string;
  age_group?: string;
  material?: string;
  pattern?: string;
  style?: string;
  // Product specifications
  quantity?: number;
  item_group_id?: string;
  // Sale information
  sale_price_effective_date?: string;
  // Video information
  video_url?: string;
  // Additional product details
  description?: string;
  image_url?: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  item_price: number;
  content_name?: string;
  content_category?: string;
  brand?: string;
  condition?: string;
  availability?: string;
}

/**
 * Track Meta Pixel events with browser and server-side fallback
 * Includes event_id for deduplication and optimized fallback logic
 * @param event_name - The event name to track
 * @param custom_data - Optional custom data for the event
 */
export async function trackMetaPixelEvent(
  event_name: string,
  custom_data: Record<string, any> = {}
) {
  const event_id = uuid();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  let browserSent = false;

  console.log(`Meta Pixel: Attempting to track ${event_name}`, { custom_data, event_id });

  // --- Browser Pixel ---
  if (typeof window !== 'undefined' && window.fbq && pixelId) {
    try {
      console.log(`Meta Pixel: Client-side tracking ${event_name}`);
      window.fbq('track', event_name, { ...custom_data, event_id });
      browserSent = true;
      console.log(`Meta Pixel: Client-side ${event_name} tracked successfully`);
    } catch (err) {
      console.error(`Meta Pixel: Client-side ${event_name} failed → falling back to CAPI`, err);
    }
  } else {
    console.warn(`Meta Pixel: Client-side tracking not available for ${event_name}`, {
      window: typeof window,
      fbq: typeof window !== 'undefined' ? !!window.fbq : false,
      pixelId: !!pixelId
    });
  }

  // --- Conversions API fallback ---
  if (!browserSent) {
    try {
      console.log(`Meta Pixel: Attempting server-side fallback for ${event_name}`);
      const response = await fetch('/api/meta/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name,
          event_id,
          action_source: 'website',
          custom_data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Meta Pixel: Server-side ${event_name} tracked successfully`, result);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Meta Pixel: Server-side ${event_name} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error(`Meta Pixel: Server-side fallback failed for ${event_name}:`, error);
    }
  }
}

/**
 * Track page view event
 * @param url - Optional URL to track (defaults to current page)
 */
export async function trackPageView(url?: string) {
  await trackMetaPixelEvent('PageView', url ? { page_url: url } : {});
}

/**
 * Track view content event for products
 * @param product - Product data with required content_ids
 */
export async function trackViewContent(product: ProductEvent) {
  await trackMetaPixelEvent('ViewContent', product);
}

/**
 * Track add to cart event
 * @param product - Product data with required content_ids
 */
export async function trackAddToCart(product: ProductEvent & { quantity?: number }) {
  await trackMetaPixelEvent('AddToCart', product);
}

/**
 * Track add to wishlist event
 * @param product - Product data with required content_ids
 */
export async function trackAddToWishlist(product: ProductEvent) {
  await trackMetaPixelEvent('AddToWishlist', product);
}

/**
 * Track complete registration event
 * @param registration - Registration data
 */
export async function trackCompleteRegistration(registration: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  source?: string;
  signup_number?: number;
}) {
  await trackMetaPixelEvent('CompleteRegistration', registration);
}

/**
 * Track purchase event with support for contents array
 * @param purchase - Purchase data with cart items
 */
export async function trackPurchase(purchase: {
  contents?: CartItem[];
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
}) {
  await trackMetaPixelEvent('Purchase', purchase);
}

/**
 * Track search event
 * @param search - Search data
 */
export async function trackSearch(search: {
  search_string: string;
  content_category?: string;
}) {
  await trackMetaPixelEvent('Search', search);
}

/**
 * Track lead event
 * @param lead - Lead data
 */
export async function trackLead(lead: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  await trackMetaPixelEvent('Lead', lead);
}

/**
 * Track contact event
 * @param contact - Contact data
 */
export async function trackContact(contact: {
  content_name?: string;
  content_category?: string;
}) {
  await trackMetaPixelEvent('Contact', contact);
}

/**
 * Helper function to create contents array for cart/purchase events
 * @param cartItems - Array of cart items
 * @returns Formatted contents array for Facebook
 */
export function createContentsArray(cartItems: CartItem[]) {
  return cartItems.map(item => ({
    id: item.id,
    quantity: item.quantity,
    item_price: item.item_price,
    content_name: item.content_name,
    content_category: item.content_category,
    brand: item.brand,
    condition: item.condition,
    availability: item.availability,
  }));
}

/**
 * Track product catalog update event
 * This ensures Meta receives real-time updates about product changes
 */
export async function trackCatalogUpdate(product: ProductEvent & {
  action: 'add' | 'update' | 'delete' | 'status_change';
  previous_status?: string;
  new_status?: string;
}) {
  await trackMetaPixelEvent('CustomEvent', {
    event_name: 'CatalogUpdate',
    content_ids: product.content_ids,
    content_type: 'product',
    content_name: product.content_name,
    content_category: product.content_category,
    value: product.value,
    currency: product.currency,
    brand: product.brand,
    condition: product.condition,
    availability: product.availability,
    price: product.price,
    sale_price: product.sale_price,
    // Catalog update specific fields
    catalog_action: product.action,
    previous_status: product.previous_status,
    new_status: product.new_status,
    update_timestamp: new Date().toISOString()
  });
}

/**
 * Track product status change event
 * Specifically for when products become available/unavailable
 */
export async function trackProductStatusChange(product: ProductEvent & {
  previous_status: string;
  new_status: string;
  reason?: string;
}) {
  await trackMetaPixelEvent('CustomEvent', {
    event_name: 'ProductStatusChange',
    content_ids: product.content_ids,
    content_type: 'product',
    content_name: product.content_name,
    content_category: product.content_category,
    value: product.value,
    currency: product.currency,
    brand: product.brand,
    condition: product.condition,
    availability: product.new_status === 'active' ? 'in stock' : 'out of stock',
    price: product.price,
    sale_price: product.sale_price,
    // Status change specific fields
    previous_status: product.previous_status,
    new_status: product.new_status,
    status_change_reason: product.reason,
    change_timestamp: new Date().toISOString()
  });
}

/**
 * Track product price change event
 * For when prices are updated or discounts are applied
 */
export async function trackProductPriceChange(product: ProductEvent & {
  previous_price: number;
  new_price: number;
  discount_percentage?: number;
  price_change_reason?: string;
}) {
  await trackMetaPixelEvent('CustomEvent', {
    event_name: 'ProductPriceChange',
    content_ids: product.content_ids,
    content_type: 'product',
    content_name: product.content_name,
    content_category: product.content_category,
    value: product.value,
    currency: product.currency,
    brand: product.brand,
    condition: product.condition,
    availability: product.availability,
    price: product.new_price,
    previous_price: product.previous_price,
    sale_price: product.sale_price,
    // Price change specific fields
    price_change_amount: product.previous_price - product.new_price,
    discount_percentage: product.discount_percentage,
    price_change_reason: product.price_change_reason,
    change_timestamp: new Date().toISOString()
  });
} 