import { auth } from './auth';
import { prisma } from './prisma';

/**
 * Check if the current user is authenticated
 * @param headers - Request headers containing session information
 * @returns Promise<boolean> - True if user is authenticated
 */
export async function isAuthenticated(headers: Headers): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers });
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the current authenticated user
 * @param headers - Request headers containing session information
 * @returns Promise<any> - User object or null if not authenticated
 */
export async function getCurrentUser(headers: Headers): Promise<any> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user has admin privileges in any organization
 * @param headers - Request headers containing session information
 * @returns Promise<boolean> - True if user is admin
 */
export async function isUserAdmin(headers: Headers): Promise<boolean> {
  try {
    const user = await getCurrentUser(headers);
    if (!user) return false;

    // Check if user is admin or owner in any organization
    return user.members.some((member: any) => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user's admin organizations
 * @param headers - Request headers containing session information
 * @returns Promise<any[]> - Array of admin organizations
 */
export async function getUserAdminOrganizations(headers: Headers): Promise<any[]> {
  try {
    const user = await getCurrentUser(headers);
    if (!user) return [];

    return user.members
      .filter((member: any) => member.role === 'ADMIN' || member.role === 'OWNER')
      .map((member: any) => member.organization);
  } catch (error) {
    console.error('Error getting admin organizations:', error);
    return [];
  }
}

/**
 * Check if user is admin in a specific organization
 * @param headers - Request headers containing session information
 * @param organizationId - Organization ID to check
 * @returns Promise<boolean> - True if user is admin in the organization
 */
export async function isUserAdminInOrganization(headers: Headers, organizationId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser(headers);
    if (!user) return false;

    return user.members.some((member: any) => 
      member.organizationId === organizationId && 
      (member.role === 'ADMIN' || member.role === 'OWNER')
    );
  } catch (error) {
    console.error('Error checking organization admin status:', error);
    return false;
  }
}

/**
 * Get user's role in a specific organization
 * @param headers - Request headers containing session information
 * @param organizationId - Organization ID to check
 * @returns Promise<string | null> - User's role or null if not a member
 */
export async function getUserOrganizationRole(headers: Headers, organizationId: string): Promise<string | null> {
  try {
    const user = await getCurrentUser(headers);
    if (!user) return null;

    const member = user.members.find((member: any) => member.organizationId === organizationId);
    return member?.role || null;
  } catch (error) {
    console.error('Error getting organization role:', error);
    return null;
  }
}

/**
 * Client-side function to check if user is admin (for use in React components)
 * @returns Promise<{isAdmin: boolean, user: any}> - Admin status and user data
 */
export async function checkAdminStatus(): Promise<{isAdmin: boolean, user: any}> {
  try {
    const response = await fetch('/api/admin/check-status');
    if (response.ok) {
      const data = await response.json();
      return {
        isAdmin: data.isAdmin,
        user: data.user
      };
    }
    return { isAdmin: false, user: null };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, user: null };
  }
} 