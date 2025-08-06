/**
 * Meta Pixel API Client for Facebook Shop Integration
 * Handles product catalog management, event tracking, and real-time sync
 */

interface MetaProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  availability: 'in stock' | 'out of stock';
  condition: 'new' | 'used' | 'refurbished';
  brand: string;
  category: string;
  image_url: string;
  url: string;
  gtin?: string;
  mpn?: string;
  shipping_weight?: {
    value: number;
    unit: string;
  };
  custom_data?: Record<string, any>;
}

interface MetaEvent {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string; // email hash
    ph?: string; // phone hash
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: Record<string, any>;
  event_source_url?: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

class MetaPixelAPI {
  private pixelId: string;
  private accessToken: string;
  private catalogId: string;
  private businessId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.pixelId = process.env.META_PIXEL_ID || '';
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.catalogId = process.env.META_CATALOG_ID || '';
    this.businessId = process.env.META_BUSINESS_ID || '';

    if (!this.pixelId || !this.accessToken || !this.catalogId) {
      console.warn('Meta Pixel API credentials not fully configured');
    }
  }

  /**
   * Create or update a product in Meta's catalog
   */
  async syncProduct(listing: any): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      const product: MetaProduct = {
        id: listing.itemId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: 'USD',
        availability: listing.status === 'active' ? 'in stock' : 'out of stock',
        condition: this.mapCondition(listing.condition),
        brand: listing.facebookBrand || listing.brand || 'TreasureHub',
        category: `${listing.department} > ${listing.category}`,
        image_url: this.getFirstImageUrl(listing.photos),
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/list-item/${listing.itemId}`,
        gtin: listing.facebookGtin,
        mpn: listing.modelNumber,
        shipping_weight: {
          value: 1,
          unit: 'lb'
        },
        custom_data: {
          neighborhood: listing.neighborhood,
          zip_code: listing.zipCode,
          seller_name: listing.user?.name,
          is_treasure: listing.isTreasure,
          treasure_reason: listing.treasureReason
        }
      };

      const response = await fetch(`${this.baseUrl}/${this.catalogId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(product)
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        productId: result.id
      };

    } catch (error) {
      console.error('Error syncing product to Meta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a product from Meta's catalog
   */
  async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting product from Meta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send event to Meta Pixel
   */
  async sendEvent(event: MetaEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.pixelId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          data: [event],
          test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
        })
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error sending event to Meta Pixel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get catalog status and product count
   */
  async getCatalogStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.catalogId}?fields=id,name,product_count,vertical`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error getting catalog status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Map condition to Meta's format
   */
  private mapCondition(condition: string): 'new' | 'used' | 'refurbished' {
    const conditionMap: { [key: string]: 'new' | 'used' | 'refurbished' } = {
      'new': 'new',
      'like-new': 'new',
      'excellent': 'used',
      'good': 'used',
      'fair': 'used',
      'poor': 'used',
      'refurbished': 'refurbished',
      'NEW': 'new',
      'EXCELLENT': 'used',
      'GOOD': 'used',
      'FAIR': 'used',
      'REFURBISHED': 'refurbished'
    };

    return conditionMap[condition.toLowerCase()] || 'used';
  }

  /**
   * Get first image URL from photos array
   */
  private getFirstImageUrl(photos: any): string {
    if (!photos) return '';

    // Handle different photo formats
    if (Array.isArray(photos)) {
      return photos[0] || '';
    }

    if (typeof photos === 'object') {
      // Try to get the first available photo
      return photos.proof?.url || 
             photos.hero?.url || 
             photos.back?.url || 
             (photos.additional && photos.additional[0]?.url) || '';
    }

    return '';
  }

  /**
   * Generate Meta Pixel script for frontend
   */
  getPixelScript(): string {
    if (!this.pixelId) return '';

    return `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${this.pixelId}');
      fbq('track', 'PageView');
    `;
  }
}

export const metaPixelAPI = new MetaPixelAPI();
export default MetaPixelAPI; 