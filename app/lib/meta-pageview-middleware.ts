/**
 * Meta Pixel Page View Middleware
 * Automatically tracks page views server-side for better coverage
 */

import { NextRequest } from 'next/server';
import { metaConversionAPI } from './meta-conversion-api';
import { auth } from './auth';
import { headers } from 'next/headers';

/**
 * Track page view for a request
 * This can be called from middleware or API routes
 */
export async function trackPageViewForRequest(request: NextRequest) {
  try {
    // Skip tracking for certain paths
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Skip API routes, static files, and admin routes
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/admin/') ||
      pathname.includes('.') // Static files
    ) {
      return;
    }

    // Get client information
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Get user session if available (handle Prisma errors gracefully)
    let session = null;
    try {
      // Only try to get session in server environment and when Prisma is available
      if (typeof window === 'undefined' && process.env.DATABASE_URL) {
        session = await auth.api.getSession({ headers: headersList });
      }
    } catch (sessionError) {
      // Log but don't fail - session is optional for tracking
      console.warn('Failed to get session for tracking:', sessionError);
    }

    // Track the page view
    await metaConversionAPI.trackPageView({
      user_email: session?.user?.email,
      user_phone: session?.user?.mobilePhone,
      external_id: session?.user?.id,
      client_ip: clientIp,
      user_agent: userAgent,
      event_source_url: request.url,
    });

  } catch (error) {
    // Silently fail to not impact user experience
    console.warn('Meta Page View tracking failed:', error);
  }
}

/**
 * Track specific content view (for product pages, etc.)
 */
export async function trackContentViewForRequest(
  request: NextRequest,
  data: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
  }
) {
  try {
    // Get client information
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Get user session if available (handle Prisma errors gracefully)
    let session = null;
    try {
      // Only try to get session in server environment and when Prisma is available
      if (typeof window === 'undefined' && process.env.DATABASE_URL) {
        session = await auth.api.getSession({ headers: headersList });
      }
    } catch (sessionError) {
      // Log but don't fail - session is optional for tracking
      console.warn('Failed to get session for tracking:', sessionError);
    }

    // Track the content view
    await metaConversionAPI.trackViewContent({
      ...data,
      user_email: session?.user?.email,
      user_phone: session?.user?.mobilePhone,
      external_id: session?.user?.id,
      client_ip: clientIp,
      user_agent: userAgent,
      event_source_url: request.url,
    });

  } catch (error) {
    // Silently fail to not impact user experience
    console.warn('Meta Content View tracking failed:', error);
  }
}

/**
 * Check if tracking should be enabled
 */
export function isTrackingEnabled(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.NEXT_PUBLIC_META_PIXEL_ID);
} 