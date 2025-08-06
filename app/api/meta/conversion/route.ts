import { NextRequest, NextResponse } from 'next/server';
import { metaConversionAPI } from '../../../lib/meta-conversion-api';
import { auth } from '../../../lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      event_name, 
      custom_data, 
      user_email, 
      user_phone, 
      external_id,
      fbc,
      fbp,
      event_source_url 
    } = body;

    // Get client information
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Get user session if available
    const session = await auth.api.getSession({ headers: headersList });
    const userId = session?.user?.id;

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
          content_name: custom_data?.content_name,
          content_category: custom_data?.content_category,
          content_ids: custom_data?.content_ids,
          value: custom_data?.value,
          currency: custom_data?.currency,
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
      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
        result,
      });
    } else {
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