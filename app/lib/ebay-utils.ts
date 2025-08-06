import crypto from 'crypto';

/**
 * eBay Platform Notifications Utilities
 * 
 * Handles webhook signature verification and eBay API interactions
 * for the Browse API integration.
 */

/**
 * Verify eBay webhook signature
 * 
 * eBay signs webhook payloads using their private key. We verify the signature
 * using their public key to ensure the notification is authentic.
 * 
 * @param payload - The raw webhook payload
 * @param signature - The signature from x-ebay-signature header
 * @param timestamp - The timestamp from x-ebay-timestamp header
 * @returns boolean indicating if signature is valid
 */
export function verifyEbaySignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    // TODO: Implement signature verification
    // This requires eBay's public key and specific verification logic
    // For now, return true to allow development
    console.warn('eBay signature verification not yet implemented');
    return true;
  } catch (error) {
    console.error('Error verifying eBay signature:', error);
    return false;
  }
}

/**
 * Generate eBay OAuth token for API calls
 * 
 * Used for making authenticated requests to eBay's Browse API
 * and other eBay services.
 */
export async function getEbayOAuthToken(): Promise<string | null> {
  try {
    const appId = process.env.EBAY_APP_ID;
    const certId = process.env.EBAY_CERT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    
    if (!appId || !certId || !clientSecret) {
      console.error('Missing eBay OAuth credentials');
      return null;
    }
    
    const isSandbox = process.env.EBAY_SANDBOX_MODE === 'true';
    const tokenUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';
    
    const credentials = Buffer.from(`${appId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });
    
    if (!response.ok) {
      console.error('Failed to get eBay OAuth token:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.access_token;
    
  } catch (error) {
    console.error('Error getting eBay OAuth token:', error);
    return null;
  }
}

/**
 * Search eBay items using Browse API
 * 
 * @param query - Search query (from AI service ebayQuery field)
 * @param filters - Optional filters for category, price range, etc.
 * @returns Search results from eBay
 */
export async function searchEbayItems(
  query: string,
  filters?: {
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
    condition?: string;
    limit?: number;
  }
) {
  try {
    const token = await getEbayOAuthToken();
    if (!token) {
      throw new Error('Failed to get eBay OAuth token');
    }
    
    const isSandbox = process.env.EBAY_SANDBOX_MODE === 'true';
    const baseUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search'
      : 'https://api.ebay.com/buy/browse/v1/item_summary/search';
    
    // Build query parameters
    const params = new URLSearchParams({
      q: query,
      limit: (filters?.limit || 10).toString()
    });
    
    if (filters?.categoryIds?.length) {
      params.append('category_ids', filters.categoryIds.join(','));
    }
    
    if (filters?.priceMin) {
      params.append('filter', `price:[${filters.priceMin}..]`);
    }
    
    if (filters?.priceMax) {
      params.append('filter', `price:[..${filters.priceMax}]`);
    }
    
    if (filters?.condition) {
      params.append('filter', `conditions:${filters.condition}`);
    }
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('eBay Browse API error:', response.statusText);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error searching eBay items:', error);
    return null;
  }
}

/**
 * Get detailed item information from eBay
 * 
 * @param itemId - eBay item ID
 * @returns Detailed item information
 */
export async function getEbayItemDetails(itemId: string) {
  try {
    const token = await getEbayOAuthToken();
    if (!token) {
      throw new Error('Failed to get eBay OAuth token');
    }
    
    const isSandbox = process.env.EBAY_SANDBOX_MODE === 'true';
    const baseUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com/buy/browse/v1/item/'
      : 'https://api.ebay.com/buy/browse/v1/item/';
    
    const response = await fetch(`${baseUrl}${itemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('eBay item details error:', response.statusText);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error getting eBay item details:', error);
    return null;
  }
}

/**
 * Subscribe to eBay notifications for specific topics
 * 
 * @param topics - Array of notification topics to subscribe to
 * @param webhookUrl - URL where eBay should send notifications
 * @returns Subscription details
 */
export async function subscribeToEbayNotifications(
  topics: string[],
  webhookUrl: string
) {
  try {
    const token = await getEbayOAuthToken();
    if (!token) {
      throw new Error('Failed to get eBay OAuth token');
    }
    
    const isSandbox = process.env.EBAY_SANDBOX_MODE === 'true';
    const baseUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com/commerce/notification/v1/subscription'
      : 'https://api.ebay.com/commerce/notification/v1/subscription';
    
    const subscriptionData = {
      topicId: topics.join(','),
      webhookUrl,
      status: 'ENABLED'
    };
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) {
      console.error('eBay notification subscription error:', response.statusText);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error subscribing to eBay notifications:', error);
    return null;
  }
}

/**
 * Validate eBay verification token for marketplace account deletion
 * 
 * eBay requires verification tokens to be between 32-80 characters
 * for marketplace account deletion endpoint validation.
 * 
 * @param token - The verification token to validate
 * @returns boolean indicating if token is valid
 */
export function validateEbayVerificationToken(token: string): boolean {
  try {
    // Check if token exists
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Validate token length (must be between 32-80 characters)
    if (token.length < 32 || token.length > 80) {
      return false;
    }
    
    // Check if token contains only valid characters (alphanumeric and common symbols)
    const validTokenPattern = /^[a-zA-Z0-9\-_\.]+$/;
    if (!validTokenPattern.test(token)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating eBay verification token:', error);
    return false;
  }
}

/**
 * Get eBay notification subscriptions
 * 
 * @returns List of current subscriptions
 */
export async function getEbaySubscriptions() {
  try {
    const token = await getEbayOAuthToken();
    if (!token) {
      throw new Error('Failed to get eBay OAuth token');
    }
    
    const isSandbox = process.env.EBAY_SANDBOX_MODE === 'true';
    const baseUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com/commerce/notification/v1/subscription'
      : 'https://api.ebay.com/commerce/notification/v1/subscription';
    
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('eBay subscriptions error:', response.statusText);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error getting eBay subscriptions:', error);
    return null;
  }
} 