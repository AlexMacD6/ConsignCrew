import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || 'NOT_SET',
    metaAccessToken: process.env.META_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
    metaCatalogId: process.env.META_CATALOG_ID || 'NOT_SET',
    metaBusinessId: process.env.META_BUSINESS_ID || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
} 