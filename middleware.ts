import { NextRequest, NextResponse } from 'next/server';
import { auth } from './app/lib/auth';
import { trackPageViewForRequest, isTrackingEnabled } from './app/lib/meta-pageview-middleware';

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
  // Track page view for Meta Pixel (server-side fallback)
  if (isTrackingEnabled()) {
    // Fire and forget - don't await to avoid blocking the request
    trackPageViewForRequest(request).catch(error => {
      console.warn('Meta page view tracking failed in middleware:', error);
    });
  }

  // Temporarily disable middleware to test authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match only page routes, exclude:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 