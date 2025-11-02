import { NextRequest, NextResponse } from 'next/server';
import { auth } from './app/lib/auth';
import { trackPageViewForRequest, isTrackingEnabled } from './app/lib/meta-pageview-middleware';

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://192.168.4.119:3000',
    'http://192.168.4.119:8081',
    'https://www.treasurehubclub.com',
    'https://treasurehubclub.com',
    'https://treasurehub.club',
    'https://www.treasurehub.club',
  ];

  // Check if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const allowOrigin = isAllowedOrigin ? origin : allowedOrigins[0];

  // Handle CORS preflight OPTIONS requests - CRITICAL: Must come first
  // Do NOT redirect OPTIONS requests to prevent "Redirect is not allowed for a preflight request" error
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Expose-Headers': 'set-auth-token, ETag',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only handle URL-encoded BetterAuth routes - be very specific
  if (request.nextUrl.pathname.includes('/api/auth/') && request.nextUrl.pathname.includes('%5B...betterauth%5D')) {
    console.log('🔍 Detected encoded BetterAuth URL:', request.nextUrl.pathname);
    
    // Decode the URL and redirect to the proper route
    const decodedPath = request.nextUrl.pathname.replace('%5B...betterauth%5D', '[...betterauth]');
    const redirectUrl = new URL(decodedPath + request.nextUrl.search, request.url);
    
    console.log('🔄 Redirecting encoded URL to:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl, 302);
  }

  // Track page view for Meta Pixel (server-side fallback)
  // Temporarily disabled due to expired access token
  // if (isTrackingEnabled()) {
  //   // Fire and forget - don't await to avoid blocking the request
  //   trackPageViewForRequest(request).catch(error => {
  //     console.warn('Meta page view tracking failed in middleware:', error);
  //   });
  // }

  // For API routes, add CORS headers to the response
  const response = NextResponse.next();
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Expose-Headers', 'set-auth-token, ETag');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes to handle CORS:
     * - API routes (for CORS headers)
     * - Auth routes (for encoded BetterAuth URLs)
     * - Page routes (for Meta tracking)
     * Exclude:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 