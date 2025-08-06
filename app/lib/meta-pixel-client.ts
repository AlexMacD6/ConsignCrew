/**
 * Client-side Meta Pixel utility for tracking events
 * This file provides a safe way to track Meta Pixel events from the frontend
 */

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

/**
 * Track a Meta Pixel event with server-side fallback
 * @param event_name - The name of the event to track
 * @param custom_data - Optional custom data for the event
 */
export async function trackMetaPixelEvent(event_name: string, custom_data?: any) {
  // Try client-side tracking first
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event_name, custom_data);
  }

  // Server-side fallback for when JavaScript is blocked or fails
  try {
    await fetch('/api/meta/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name,
        custom_data,
      }),
    });
  } catch (error) {
    console.warn('Meta Conversion API fallback failed:', error);
  }
}

/**
 * Track page view event
 * @param url - Optional URL to track (defaults to current page)
 */
export async function trackPageView(url?: string) {
  await trackMetaPixelEvent('PageView', url ? { page_url: url } : undefined);
}

/**
 * Track view content event for products
 * @param product - Product data
 */
export async function trackViewContent(product: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) {
  await trackMetaPixelEvent('ViewContent', product);
}

/**
 * Track add to cart event
 * @param product - Product data
 */
export async function trackAddToCart(product: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  quantity?: number;
}) {
  await trackMetaPixelEvent('AddToCart', product);
}

/**
 * Track purchase event
 * @param purchase - Purchase data
 */
export async function trackPurchase(purchase: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
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
  search_string?: string;
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
 * Initialize Meta Pixel (called automatically by the script)
 * This is mainly for debugging purposes
 */
export function initMetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    
  if (typeof window !== 'undefined' && window.fbq && pixelId) {
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
} 