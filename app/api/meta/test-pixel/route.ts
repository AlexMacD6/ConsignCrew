import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const config = {
      pixelId: pixelId ? 'Configured' : 'Not configured',
      accessToken: accessToken ? 'Configured' : 'Not configured',
      pixelIdValue: pixelId ? `${pixelId.substring(0, 4)}...${pixelId.substring(pixelId.length - 4)}` : null,
      accessTokenValue: accessToken ? `${accessToken.substring(0, 10)}...` : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Meta Pixel configuration check',
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Meta Pixel test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking Meta Pixel configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_name, custom_data } = body;

    console.log('Meta Pixel test event:', { event_name, custom_data });

    // Test the conversion API
    const response = await fetch('/api/meta/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name,
        custom_data,
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Meta Pixel test event sent',
      event_name,
      custom_data,
      conversionApiResponse: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Meta Pixel test event error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error sending test event',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 