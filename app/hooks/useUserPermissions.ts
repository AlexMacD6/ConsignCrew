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
  const { data: session } = authClient.useSession();
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
            
            // Check if user is part of seller organization
            const isSeller = userOrganizations.some((member: any) => 
              member.organizationSlug === 'sellers'
            );
            
            // Check if user is part of buyer organization
            const isBuyer = userOrganizations.some((member: any) => 
              member.organizationSlug === 'buyers'
            );
            
            // Permissions based on organization membership
            const canListItems = isSeller;
            const canBuyItems = isBuyer;
            
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
            const fallbackPermissions: UserPermissions = {
              canListItems: false,
              canBuyItems: false,
              isSeller: false,
              isBuyer: false,
              isLoading: false,
            };
            setPermissions(fallbackPermissions);
          }
        } catch (error) {
          console.error('useUserPermissions: Error fetching user organizations:', error);
          const errorPermissions: UserPermissions = {
            canListItems: false,
            canBuyItems: false,
            isSeller: false,
            isBuyer: false,
            isLoading: false,
          };
          setPermissions(errorPermissions);
        } finally {
          fetchingRef.current = null;
        }
      })();

      await fetchingRef.current;
    }

    fetchUserPermissions();
  }, [session?.user?.id]);

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
