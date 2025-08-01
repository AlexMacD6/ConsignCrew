import { NextRequest, NextResponse } from 'next/server';
import { sendServerEvent, MetaPixelEvent } from '@/lib/meta-pixel';

/**
 * Meta Conversions API endpoint
 * Handles server-side event tracking for Facebook Ads optimization
 */
export async function POST(request: NextRequest) {
  try {
    const { event, userData } = await request.json();

    // Validate required fields
    if (!event || !event.event_name) {
      return NextResponse.json(
        { error: 'Missing required event data' },
        { status: 400 }
      );
    }

    // Get client information for user_data
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Build the Meta Pixel event
    const metaEvent: MetaPixelEvent = {
      event_name: event.event_name,
      event_time: event.event_time || Math.floor(Date.now() / 1000),
      action_source: event.action_source || 'website',
      event_source_url: event.event_source_url || request.headers.get('referer') || 'https://treasurehub.club',
      user_data: {
        ...event.user_data,
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        ...userData,
      },
      custom_data: event.custom_data || {},
    };

    // Send event to Meta Conversions API
    const result = await sendServerEvent(metaEvent);

    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Event tracked successfully',
          event_id: result.result?.events_received?.[0]?.event_id
        },
        { status: 200 }
      );
    } else {
      console.error('Meta Conversions API error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to track event' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Meta Conversions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing Meta Pixel configuration
 */
export async function GET() {
  const pixelId = process.env.META_PIXEL_ID;
  const hasAccessToken = !!process.env.META_ACCESS_TOKEN;

  return NextResponse.json({
    configured: !!(pixelId && hasAccessToken),
    pixel_id: pixelId ? '***' + pixelId.slice(-4) : null,
    has_access_token: hasAccessToken,
    message: 'Meta Pixel Conversions API is ready',
  });
} 