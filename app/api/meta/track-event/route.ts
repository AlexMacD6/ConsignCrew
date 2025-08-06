import { NextRequest, NextResponse } from 'next/server';
import { metaPixelAPI } from '@/lib/meta-pixel-api';
import crypto from 'crypto';

interface EventData {
  event_name: string;
  event_time?: number;
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: Record<string, any>;
  event_source_url?: string;
  action_source?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

export async function POST(request: NextRequest) {
  try {
    const eventData: EventData = await request.json();
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate required fields
    if (!eventData.event_name) {
      return NextResponse.json({ error: 'event_name is required' }, { status: 400 });
    }

    // Hash sensitive user data for privacy
    const hashedUserData: any = {};
    
    if (eventData.user_data?.email) {
      hashedUserData.em = crypto.createHash('sha256').update(eventData.user_data.email.toLowerCase()).digest('hex');
    }
    
    if (eventData.user_data?.phone) {
      hashedUserData.ph = crypto.createHash('sha256').update(eventData.user_data.phone.replace(/\D/g, '')).digest('hex');
    }

    if (eventData.user_data?.external_id) {
      hashedUserData.external_id = eventData.user_data.external_id;
    }

    // Add client IP and user agent
    hashedUserData.client_ip_address = clientIP;
    hashedUserData.client_user_agent = userAgent;

    // Prepare event for Meta Pixel API
    const event = {
      event_name: eventData.event_name,
      event_time: eventData.event_time || Math.floor(Date.now() / 1000),
      user_data: hashedUserData,
      custom_data: eventData.custom_data || {},
      event_source_url: eventData.event_source_url || request.headers.get('referer') || '',
      action_source: eventData.action_source || 'website',
    };

    // Send event to Meta Pixel
    const result = await metaPixelAPI.sendEvent(event);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to track event'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json({
      error: 'Failed to track event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Predefined event tracking functions for common e-commerce events
export async function trackViewContent(request: NextRequest) {
  const { content_id, content_type, value, currency } = await request.json();
  
  // Use the conversion API directly
  const { trackViewContent: trackViewContentConversion } = await import('../conversion/route');
  return trackViewContentConversion(request, {
    content_name: content_type,
    content_category: content_type,
    content_ids: [content_id],
    value,
    currency: currency || 'USD',
  });
}

export async function trackAddToCart(request: NextRequest) {
  const { content_id, content_type, value, currency, quantity } = await request.json();
  
  // Use the conversion API directly
  const { metaConversionAPI } = await import('../../../lib/meta-conversion-api');
  const { auth } = await import('../../../lib/auth');
  const { headers } = await import('next/headers');
  
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackCustomEvent({
    event_name: 'AddToCart',
    custom_data: {
      content_id,
      content_type,
      value,
      currency: currency || 'USD',
      quantity: quantity || 1,
    },
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    event_source_url: request.url,
  });
}

export async function trackPurchase(request: NextRequest) {
  const { content_id, content_type, value, currency, num_items } = await request.json();
  
  // Use the conversion API directly
  const { metaConversionAPI } = await import('../../../lib/meta-conversion-api');
  const { auth } = await import('../../../lib/auth');
  const { headers } = await import('next/headers');
  
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackCustomEvent({
    event_name: 'Purchase',
    custom_data: {
      content_id,
      content_type,
      value,
      currency: currency || 'USD',
      num_items: num_items || 1,
    },
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    event_source_url: request.url,
  });
}

export async function trackSearch(request: NextRequest) {
  const { search_string, content_category } = await request.json();
  
  // Use the conversion API directly
  const { trackSearch: trackSearchConversion } = await import('../conversion/route');
  return trackSearchConversion(request, {
    search_string,
    content_category,
  });
} 