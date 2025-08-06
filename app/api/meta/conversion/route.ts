import { NextRequest, NextResponse } from 'next/server';
import { metaConversionAPI } from '../../../lib/meta-conversion-api';
import { auth } from '../../../lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.META_ACCESS_TOKEN) {
      console.error('Meta Conversion API: META_ACCESS_TOKEN not configured');
      return NextResponse.json({
        success: false,
        message: 'Meta Conversion API not configured',
      }, { status: 503 });
    }

    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      console.error('Meta Conversion API: NEXT_PUBLIC_META_PIXEL_ID not configured');
      return NextResponse.json({
        success: false,
        message: 'Meta Pixel ID not configured',
      }, { status: 503 });
    }

    const body = await request.json();
    const { 
      event_name, 
      custom_data, 
      event_id,
      action_source = 'website',
      user_email, 
      user_phone, 
      external_id,
      fbc,
      fbp,
      event_source_url 
    } = body;

    // Validate required fields
    if (!event_name) {
      return NextResponse.json({
        success: false,
        message: 'event_name is required',
      }, { status: 400 });
    }

    // Get client information
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Get user session if available
    let session = null;
    let userId = null;
    try {
      session = await auth.api.getSession({ headers: headersList });
      userId = session?.user?.id;
    } catch (sessionError) {
      console.warn('Meta Conversion API: Session retrieval failed:', sessionError);
      // Continue without session - not critical for tracking
    }

    // Prepare tracking data
    const trackingData = {
      user_email: user_email || session?.user?.email,
      user_phone: user_phone || session?.user?.mobilePhone,
      external_id: external_id || userId,
      client_ip: clientIp,
      user_agent: userAgent,
      fbc,
      fbp,
      event_source_url: event_source_url || request.url,
    };

    let result = null;

    // Route to appropriate tracking method based on event name
    switch (event_name) {
      case 'PageView':
        result = await metaConversionAPI.trackPageView(trackingData);
        break;
      
      case 'ViewContent':
        result = await metaConversionAPI.trackViewContent({
          ...trackingData,
          event_id,
          action_source,
          content_name: custom_data?.content_name,
          content_category: custom_data?.content_category,
          content_ids: custom_data?.content_ids,
          value: custom_data?.value,
          currency: custom_data?.currency,
          brand: custom_data?.brand,
          condition: custom_data?.condition,
          availability: custom_data?.availability,
          price: custom_data?.price,
          sale_price: custom_data?.sale_price,
          gtin: custom_data?.gtin,
          // Enhanced Facebook Shop catalog fields
          gender: custom_data?.gender,
          color: custom_data?.color,
          size: custom_data?.size,
          age_group: custom_data?.age_group,
          material: custom_data?.material,
          pattern: custom_data?.pattern,
          style: custom_data?.style,
          quantity: custom_data?.quantity,
          item_group_id: custom_data?.item_group_id,
          sale_price_effective_date: custom_data?.sale_price_effective_date,
          video_url: custom_data?.video_url,
          description: custom_data?.description,
          image_url: custom_data?.image_url,
        });
        break;
      
      case 'Search':
        result = await metaConversionAPI.trackSearch({
          ...trackingData,
          search_string: custom_data?.search_string,
          content_category: custom_data?.content_category,
        });
        break;
      
      case 'Lead':
        result = await metaConversionAPI.trackLead({
          ...trackingData,
          content_name: custom_data?.content_name,
          content_category: custom_data?.content_category,
          value: custom_data?.value,
          currency: custom_data?.currency,
        });
        break;
      
      case 'Contact':
        result = await metaConversionAPI.trackContact({
          ...trackingData,
          content_name: custom_data?.content_name,
          content_category: custom_data?.content_category,
        });
        break;
      
      default:
        // For custom events, use the generic method
        result = await metaConversionAPI.trackCustomEvent({
          event_name,
          custom_data,
          ...trackingData,
        });
        break;
    }

    if (result) {
      console.log('Meta Conversion API: Event tracked successfully', {
        event_name,
        result
      });
      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
        result,
      });
    } else {
      console.error('Meta Conversion API: Failed to track event', {
        event_name,
        trackingData
      });
      return NextResponse.json({
        success: false,
        message: 'Failed to track event',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Meta Conversion API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Helper functions for common tracking scenarios
export async function trackPageView(request: NextRequest) {
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackPageView({
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    client_ip: clientIp,
    user_agent: userAgent,
    event_source_url: request.url,
  });
}

export async function trackViewContent(
  request: NextRequest,
  data: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
  }
) {
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackViewContent({
    ...data,
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    client_ip: clientIp,
    user_agent: userAgent,
    event_source_url: request.url,
  });
}

export async function trackSearch(
  request: NextRequest,
  data: {
    search_string?: string;
    content_category?: string;
  }
) {
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackSearch({
    ...data,
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    client_ip: clientIp,
    user_agent: userAgent,
    event_source_url: request.url,
  });
}

export async function trackLead(
  request: NextRequest,
  data: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
  }
) {
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackLead({
    ...data,
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    client_ip: clientIp,
    user_agent: userAgent,
    event_source_url: request.url,
  });
}

export async function trackContact(
  request: NextRequest,
  data: {
    content_name?: string;
    content_category?: string;
  }
) {
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const session = await auth.api.getSession({ headers: headersList });
  
  return metaConversionAPI.trackContact({
    ...data,
    user_email: session?.user?.email,
    user_phone: session?.user?.mobilePhone,
    external_id: session?.user?.id,
    client_ip: clientIp,
    user_agent: userAgent,
    event_source_url: request.url,
  });
} 