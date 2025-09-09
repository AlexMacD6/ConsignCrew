import { NextRequest, NextResponse } from 'next/server';
import { auth } from './app/lib/auth';
import { trackPageViewForRequest, isTrackingEnabled } from './app/lib/meta-pageview-middleware';

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
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

  // Let all other requests pass through normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Only match specific routes that might need URL decoding:
     * - Auth routes (for encoded BetterAuth URLs)
     * - Page routes (for Meta tracking)
     * Exclude:
     * - Most API routes (to avoid interfering with database connections)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/api/auth/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 