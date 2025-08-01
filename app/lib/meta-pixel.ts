/**
 * Meta Pixel utility functions for TreasureHub
 * Handles both client-side pixel events and server-side Conversions API
 */

// Types for Meta Pixel events
export interface MetaPixelEvent {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_source_url?: string;
  user_data?: {
    em?: string; // hashed email
    ph?: string; // hashed phone
    external_id?: string; // hashed user ID
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    num_items?: number;
    search_string?: string;
    status?: string;
    [key: string]: any;
  };
}

// Global variable to track if Meta Pixel is initialized
let isMetaPixelInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Client-side Meta Pixel functions
export const initMetaPixel = (pixelId: string): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // If already initialized, return existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // If already initialized and successful, return resolved promise
  if (isMetaPixelInitialized) {
    return Promise.resolve();
  }

  initializationPromise = new Promise((resolve, reject) => {
    try {
      // Check if fbq already exists
      if ((window as any).fbq) {
        isMetaPixelInitialized = true;
        resolve();
        return;
      }

      // Initialize Meta Pixel with proper error handling
      !(function (f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        t.onload = () => {
          isMetaPixelInitialized = true;
          resolve();
        };
        t.onerror = () => {
          console.error('Failed to load Meta Pixel script');
          reject(new Error('Failed to load Meta Pixel script'));
        };
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );

      // Set pixel ID and track initial pageview after a short delay to ensure script is loaded
      setTimeout(() => {
        if ((window as any).fbq) {
          (window as any).fbq('init', pixelId);
          (window as any).fbq('track', 'PageView');
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing Meta Pixel:', error);
      reject(error);
    }
  });

  return initializationPromise;
};

// Client-side event tracking with proper checks
export const trackEvent = async (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Wait for Meta Pixel to be initialized
    if (!isMetaPixelInitialized && initializationPromise) {
      await initializationPromise;
    }
    
    // Check if fbq is available
    if (!(window as any).fbq) {
      console.warn('Meta Pixel not initialized, skipping event:', eventName);
      return;
    }
    
    (window as any).fbq('track', eventName, parameters);
  } catch (error) {
    console.error('Error tracking Meta Pixel event:', error);
  }
};

// Server-side Conversions API functions
export const sendServerEvent = async (event: MetaPixelEvent) => {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || 'v18.0';

  if (!pixelId || !accessToken) {
    console.error('Meta Pixel configuration missing');
    return { success: false, error: 'Configuration missing' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [event],
          access_token: accessToken,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta Conversions API error:', result);
      return { success: false, error: result.error?.message || 'API error' };
    }

    return { success: true, result };
  } catch (error) {
    console.error('Meta Conversions API request failed:', error);
    return { success: false, error: 'Request failed' };
  }
};

// Utility function to hash data for privacy
export const hashData = async (data: string): Promise<string> => {
  if (typeof window === 'undefined') {
    // Server-side hashing
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  } else {
    // Client-side hashing
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

// Predefined event builders
export const createLeadEvent = async (
  email?: string,
  source: string = 'website',
  value?: number
): Promise<MetaPixelEvent> => {
  const userData: any = {};
  
  if (email) {
    userData.em = await hashData(email);
  }

  return {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      content_name: 'TreasureHub Lead',
      content_category: 'consignment_service',
      value: value,
      currency: 'USD',
      status: 'new_lead',
    },
  };
};

export const createViewContentEvent = async (
  contentName: string,
  contentIds?: string[],
  value?: number
): Promise<MetaPixelEvent> => {
  return {
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    custom_data: {
      content_name: contentName,
      content_category: 'consignment_service',
      content_ids: contentIds,
      content_type: 'product',
      value: value,
      currency: 'USD',
    },
  };
};

export const createAddToCartEvent = async (
  contentName: string,
  contentIds?: string[],
  value?: number
): Promise<MetaPixelEvent> => {
  return {
    event_name: 'AddToCart',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    custom_data: {
      content_name: contentName,
      content_category: 'consignment_service',
      content_ids: contentIds,
      content_type: 'product',
      value: value,
      currency: 'USD',
      num_items: 1,
    },
  };
};

export const createInitiateCheckoutEvent = async (
  contentName: string,
  contentIds?: string[],
  value?: number
): Promise<MetaPixelEvent> => {
  return {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    custom_data: {
      content_name: contentName,
      content_category: 'consignment_service',
      content_ids: contentIds,
      content_type: 'product',
      value: value,
      currency: 'USD',
      num_items: 1,
    },
  };
};

export const createPurchaseEvent = async (
  contentName: string,
  contentIds?: string[],
  value: number,
  currency: string = 'USD'
): Promise<MetaPixelEvent> => {
  return {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    custom_data: {
      content_name: contentName,
      content_category: 'consignment_service',
      content_ids: contentIds,
      content_type: 'product',
      value: value,
      currency: currency,
      num_items: 1,
      status: 'completed',
    },
  };
};

export const createContactEvent = async (
  email?: string,
  value?: number
): Promise<MetaPixelEvent> => {
  const userData: any = {};
  
  if (email) {
    userData.em = await hashData(email);
  }

  return {
    event_name: 'Contact',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      content_name: 'TreasureHub Contact',
      content_category: 'consignment_service',
      value: value,
      currency: 'USD',
      status: 'contact_form_submitted',
    },
  };
}; 