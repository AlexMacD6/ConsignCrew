import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

// Global flag to prevent multiple prefetch attempts
let prefetchStarted = false;

/**
 * Hook to trigger early authentication and data fetching
 * This should be used in the root layout or app component
 * to start authentication flow as early as possible
 */
export function useEarlyAuth() {
  useEffect(() => {
    if (prefetchStarted) return;
    prefetchStarted = true;

    // Start both session and organizations fetch in parallel
    const sessionPromise = authClient.getSession();
    
    // Also try to prefetch organizations immediately (in case session is cached)
    const orgPromise = fetch('/api/profile/organizations', {
      credentials: 'include',
    }).catch(() => null); // Ignore errors for speculative fetch

    // Wait for session, then ensure organizations are fetched
    sessionPromise.then((session) => {
      if (session?.user?.id) {
        // Session exists, ensure organizations are prefetched
        // This will use cache if orgPromise succeeded, or make fresh request
        fetch('/api/profile/organizations', {
          credentials: 'include',
        }).catch(() => {
          // Ignore errors in prefetch, the actual hook will handle retries
        });
      }
    }).catch(() => {
      // Ignore errors in session prefetch
    });
  }, []);
}
