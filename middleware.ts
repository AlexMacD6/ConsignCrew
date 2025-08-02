import { NextRequest, NextResponse } from 'next/server';
import { auth } from './app/lib/auth';

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
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