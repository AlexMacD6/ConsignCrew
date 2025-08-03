import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get API key from query parameters or headers
    const apiKey = request.nextUrl.searchParams.get('api_key') || 
                   request.headers.get('x-api-key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }
    
    // Validate API key
    const keyRecord = await prisma.facebookApiKey.findUnique({
      where: { apiKey, isActive: true }
    });
    
    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Get basic statistics
    const totalListings = await prisma.listing.count({
      where: { status: 'active' }
    });
    
    const facebookEnabledListings = await prisma.listing.count({
      where: {
        status: 'active',
        facebookShopEnabled: true
      }
    });
    
    const lastUpdatedListing = await prisma.listing.findFirst({
      where: {
        status: 'active',
        facebookShopEnabled: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    });
    
    // Check database connectivity
    const dbStatus = await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      api_key: {
        name: keyRecord.name,
        is_active: keyRecord.isActive,
        last_used: keyRecord.lastUsed,
        usage_count: keyRecord.usageCount
      },
      statistics: {
        total_listings: totalListings,
        facebook_enabled_listings: facebookEnabledListings,
        last_updated: lastUpdatedListing?.updatedAt || null
      },
      feed_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treasurehub.com'}/api/facebook-shop/feed?api_key=${apiKey}`,
      version: '1.0'
    };
    
    // Set CORS headers
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };
    
    return NextResponse.json(healthStatus, { headers: responseHeaders });
    
  } catch (error) {
    console.error('Facebook Shop Health Check Error:', error);
    
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Internal server error',
      version: '1.0'
    };
    
    return NextResponse.json(errorStatus, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
} 