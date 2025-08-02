import { prisma } from './prisma';
import { auth } from './auth';

/**
 * Check if a user has admin privileges in any organization
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) return false;

    // Check if user is admin or owner in any organization
    return user.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user's admin organizations
 */
export async function getUserAdminOrganizations(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          where: {
            role: {
              in: ['ADMIN', 'OWNER'],
            },
          },
          include: {
            organization: true,
          },
        },
      },
    });

    return user?.members.map(member => member.organization) || [];
  } catch (error) {
    console.error('Error getting admin organizations:', error);
    return [];
  }
}

/**
 * Check if user is admin in a specific organization
 */
export async function isUserAdminInOrganization(userId: string, organizationId: string): Promise<boolean> {
  try {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    return !!member;
  } catch (error) {
    console.error('Error checking organization admin status:', error);
    return false;
  }
}

/**
 * Get user's role in a specific organization
 */
export async function getUserOrganizationRole(userId: string, organizationId: string): Promise<string | null> {
  try {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    return member?.role || null;
  } catch (error) {
    console.error('Error getting organization role:', error);
    return null;
  }
}

/**
 * Get all users with their organization memberships
 */
export async function getAllUsersWithOrganizations() {
  try {
    const users = await prisma.user.findMany({
      include: {
        members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        sessions: {
          select: {
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => ({
      ...user,
      lastLogin: user.sessions[0]?.updatedAt || null,
      adminOrganizations: user.members
        .filter(member => member.role === 'ADMIN' || member.role === 'OWNER')
        .map(member => member.organization),
    }));
  } catch (error) {
    console.error('Error getting users with organizations:', error);
    return [];
  }
}

/**
 * Create a default admin organization if none exists
 */
export async function createDefaultAdminOrganization() {
  try {
    // Check if any organization exists
    const existingOrg = await prisma.organization.findFirst();
    
    if (existingOrg) {
      return existingOrg;
    }

    // Create default admin organization
    const defaultOrg = await prisma.organization.create({
      data: {
            name: 'TreasureHub Admin',
    slug: 'treasurehub-admin',
        metadata: JSON.stringify({
                      description: 'Default admin organization for TreasureHub',
          type: 'admin',
        }),
      },
    });

    console.log('Created default admin organization:', defaultOrg.id);
    return defaultOrg;
  } catch (error) {
    console.error('Error creating default admin organization:', error);
    throw error;
  }
}

/**
 * Assign user as admin to an organization
 */
export async function assignUserAsAdmin(userId: string, organizationId: string) {
  try {
    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (existingMember) {
      // Update existing member to admin
      return await prisma.member.update({
        where: { id: existingMember.id },
        data: { role: 'ADMIN' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Create new admin member
      return await prisma.member.create({
        data: {
          userId,
          organizationId,
          role: 'ADMIN',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error('Error assigning user as admin:', error);
    throw error;
  }
} 