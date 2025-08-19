/**
 * Meta Conversion API Client
 * Server-side mirror of client-side Meta Pixel events
 * Ensures tracking works even when JavaScript is blocked or fails
 */

import crypto from 'crypto';

export interface ConversionEvent {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_source_url?: string;
  user_data: {
    em?: string[]; // SHA256 hashed emails
    ph?: string[]; // SHA256 hashed phone numbers
    external_id?: string[]; // User IDs
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: {
    [key: string]: any;
  };
  event_id?: string;
}

export interface ConversionAPIResponse {
  events_received: number;
  messages: string[];
  fbtrace_id: string;
}

export class MetaConversionAPI {
  private accessToken: string;
  private pixelId: string;
  private apiVersion: string = 'v18.0';

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
    
    if (!this.accessToken) {
      console.warn('Meta Conversion API: META_ACCESS_TOKEN not configured');
    }
    if (!this.pixelId) {
      console.warn('Meta Conversion API: Meta Pixel ID not configured');
    }
  }

  /**
   * Hash data using SHA256 for privacy compliance
   */
  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  }

  /**
   * Hash email addresses for privacy compliance
   */
  private hashEmail(email: string): string {
    return this.hashData(email);
  }

  /**
   * Hash phone numbers for privacy compliance
   */
  private hashPhone(phone: string): string {
    // Remove all non-digit characters and hash
    const cleanPhone = phone.replace(/\D/g, '');
    return this.hashData(cleanPhone);
  }

  /**
   * Send event to Meta Conversion API
   */
  async sendEvent(event: ConversionEvent): Promise<ConversionAPIResponse | null> {
    if (!this.accessToken || !this.pixelId) {
      console.warn('Meta Conversion API: Missing required configuration');
      return null;
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [event],
          access_token: this.accessToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Meta Conversion API Error:', response.status, errorText);
        return null;
      }

      const result: ConversionAPIResponse = await response.json();
      console.log('Meta Conversion API Success:', result);
      return result;
    } catch (error) {
      console.error('Meta Conversion API Request Failed:', error);
      return null;
    }
  }

  /**
   * Track page view event
   */
  async trackPageView(data: {
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};

    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    const event: ConversionEvent = {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
    };

    return this.sendEvent(event);
  }

  /**
   * Track view content event
   */
  async trackViewContent(data: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    // Enhanced Facebook Shop catalog fields
    brand?: string;
    condition?: string;
    availability?: string;
    price?: number;
    sale_price?: number;
    gtin?: string;
    gender?: string;
    color?: string;
    size?: string;
    age_group?: string;
    material?: string;
    pattern?: string;
    style?: string;
    quantity?: number;
    item_group_id?: string;
    sale_price_effective_date?: string;
    video_url?: string;
    description?: string;
    image_url?: string;
    // User data fields
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
    event_id?: string;
    action_source?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};
    const customData: ConversionEvent['custom_data'] = {};

    // Hash user data
    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    // Add basic custom data
    if (data.content_name) {
      customData.content_name = data.content_name;
    }
    if (data.content_category) {
      customData.content_category = data.content_category;
    }
    if (data.content_ids) {
      customData.content_ids = data.content_ids;
    }
    if (data.value) {
      customData.value = data.value;
    }
    if (data.currency) {
      customData.currency = data.currency;
    }

    // Add enhanced Facebook Shop catalog fields
    if (data.brand) {
      customData.brand = data.brand;
    }
    if (data.facebookCondition) {
      customData.condition = data.facebookCondition;
    }
    if (data.availability) {
      customData.availability = data.availability;
    }
    if (data.price) {
      customData.price = data.price;
    }
    if (data.sale_price) {
      customData.sale_price = data.sale_price;
    }
    if (data.gtin) {
      customData.gtin = data.gtin;
    }
    if (data.gender) {
      customData.gender = data.gender;
    }
    if (data.color) {
      customData.color = data.color;
    }
    if (data.size) {
      customData.size = data.size;
    }
    if (data.age_group) {
      customData.age_group = data.age_group;
    }
    if (data.material) {
      customData.material = data.material;
    }
    if (data.pattern) {
      customData.pattern = data.pattern;
    }
    if (data.style) {
      customData.style = data.style;
    }
    if (data.quantity) {
      customData.quantity = data.quantity;
    }
    if (data.item_group_id) {
      customData.item_group_id = data.item_group_id;
    }
    if (data.sale_price_effective_date) {
      customData.sale_price_effective_date = data.sale_price_effective_date;
    }
    if (data.video_url) {
      customData.video_url = data.video_url;
    }
    if (data.description) {
      customData.description = data.description;
    }
    if (data.image_url) {
      customData.image_url = data.image_url;
    }

    const event: ConversionEvent = {
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      action_source: (data.action_source as any) || 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
      event_id: data.event_id,
    };

    return this.sendEvent(event);
  }

  /**
   * Track search event
   */
  async trackSearch(data: {
    search_string?: string;
    content_category?: string;
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};
    const customData: ConversionEvent['custom_data'] = {};

    // Hash user data
    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    // Add custom data
    if (data.search_string) {
      customData.search_string = data.search_string;
    }
    if (data.content_category) {
      customData.content_category = data.content_category;
    }

    const event: ConversionEvent = {
      event_name: 'Search',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    };

    return this.sendEvent(event);
  }

  /**
   * Track lead event
   */
  async trackLead(data: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};
    const customData: ConversionEvent['custom_data'] = {};

    // Hash user data
    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    // Add custom data
    if (data.content_name) {
      customData.content_name = data.content_name;
    }
    if (data.content_category) {
      customData.content_category = data.content_category;
    }
    if (data.value) {
      customData.value = data.value;
    }
    if (data.currency) {
      customData.currency = data.currency;
    }

    const event: ConversionEvent = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    };

    return this.sendEvent(event);
  }

  /**
   * Track contact event
   */
  async trackContact(data: {
    content_name?: string;
    content_category?: string;
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};
    const customData: ConversionEvent['custom_data'] = {};

    // Hash user data
    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    // Add custom data
    if (data.content_name) {
      customData.content_name = data.content_name;
    }
    if (data.content_category) {
      customData.content_category = data.content_category;
    }

    const event: ConversionEvent = {
      event_name: 'Contact',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
      custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    };

    return this.sendEvent(event);
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(data: {
    event_name: string;
    custom_data?: { [key: string]: any };
    user_email?: string;
    user_phone?: string;
    external_id?: string;
    client_ip?: string;
    user_agent?: string;
    fbc?: string;
    fbp?: string;
    event_source_url?: string;
  }): Promise<ConversionAPIResponse | null> {
    const userData: ConversionEvent['user_data'] = {};

    // Hash user data
    if (data.user_email) {
      userData.em = [this.hashEmail(data.user_email)];
    }
    if (data.user_phone) {
      userData.ph = [this.hashPhone(data.user_phone)];
    }
    if (data.external_id) {
      userData.external_id = [data.external_id];
    }
    if (data.client_ip) {
      userData.client_ip_address = data.client_ip;
    }
    if (data.user_agent) {
      userData.client_user_agent = data.user_agent;
    }
    if (data.fbc) {
      userData.fbc = data.fbc;
    }
    if (data.fbp) {
      userData.fbp = data.fbp;
    }

    const event: ConversionEvent = {
      event_name: data.event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url,
      user_data: userData,
      custom_data: data.custom_data,
    };

    return this.sendEvent(event);
  }
}

// Export singleton instance
export const metaConversionAPI = new MetaConversionAPI(); 