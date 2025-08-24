import { useState, useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth-client';

interface UserPermissions {
  canListItems: boolean;
  canBuyItems: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isLoading: boolean;
}

// Global cache to avoid duplicate requests across components
const permissionsCache = new Map<string, { permissions: UserPermissions; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useUserPermissions(): UserPermissions {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canListItems: false,
    canBuyItems: false,
    isSeller: false,
    isBuyer: false,
    isLoading: true,
  });
  
  const fetchingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    async function fetchUserPermissions() {
      // Wait for session to be resolved
      if (sessionLoading) {
        return; // Stay in loading state while session is being fetched
      }

      if (!session?.user?.id) {
        setPermissions({
          canListItems: false,
          canBuyItems: false,
          isSeller: false,
          isBuyer: false,
          isLoading: false,
        });
        return;
      }

      const userId = session.user.id;
      const now = Date.now();
      
      // Check cache first
      const cached = permissionsCache.get(userId);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('useUserPermissions: Using cached permissions for user:', userId);
        setPermissions(cached.permissions);
        return;
      }

      // Prevent duplicate requests
      if (fetchingRef.current) {
        await fetchingRef.current;
        return;
      }

      fetchingRef.current = (async () => {
        try {
          console.log('useUserPermissions: Fetching fresh permissions for user:', userId);
          
          const response = await fetch('/api/profile/organizations', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const userOrganizations = data.organizations || [];

            // BetterAuth role-based policy (strict): use roles only, ignore slugs
            const roleSet = new Set(
              userOrganizations.map((m: any) => (m.role || '').toUpperCase())
            );
            const isAdmin = roleSet.has('ADMIN') || roleSet.has('OWNER');
            const isSeller = roleSet.has('SELLER');
            const isBuyer = roleSet.has('BUYER');

            // Permissions strictly from roles; admins inherit all
            const canListItems = isAdmin || isSeller;
            // Everyone can buy: if authenticated, allow regardless of role
            const canBuyItems = true;
            
            const newPermissions: UserPermissions = {
              canListItems,
              canBuyItems,
              isSeller,
              isBuyer,
              isLoading: false,
            };

            // Cache the result
            permissionsCache.set(userId, {
              permissions: newPermissions,
              timestamp: now
            });

            setPermissions(newPermissions);
          } else {
            console.log('useUserPermissions: Organizations API failed:', response.status);
            // Keep loading true for API failures to prevent false access denied
            const fallbackPermissions: UserPermissions = {
              canListItems: false,
              canBuyItems: false,
              isSeller: false,
              isBuyer: false,
              isLoading: true, // Keep loading true to retry
            };
            setPermissions(fallbackPermissions);
            
            // Retry after 3 seconds for API failures
            setTimeout(() => {
              fetchUserPermissions();
            }, 3000);
          }
        } catch (error) {
          console.error('useUserPermissions: Error fetching user organizations:', error);
          // Keep loading state true on error to prevent false access denied
          // User can retry by refreshing the page
          const errorPermissions: UserPermissions = {
            canListItems: false,
            canBuyItems: false,
            isSeller: false,
            isBuyer: false,
            isLoading: true, // Keep loading true to show loading spinner instead of access denied
          };
          setPermissions(errorPermissions);
          
          // Retry after 3 seconds
          setTimeout(() => {
            fetchUserPermissions();
          }, 3000);
        } finally {
          fetchingRef.current = null;
        }
      })();

      await fetchingRef.current;
    }

    fetchUserPermissions();
  }, [session?.user?.id, sessionLoading]);

  return permissions;
}

// Export a function to clear the cache when needed (e.g., after user role changes)
export function clearPermissionsCache(userId?: string) {
  if (userId) {
    permissionsCache.delete(userId);
  } else {
    permissionsCache.clear();
  }
}
