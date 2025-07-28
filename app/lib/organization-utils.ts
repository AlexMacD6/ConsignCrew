import { prisma } from './prisma';

/**
 * Get or create the default organization for new users
 */
export async function getOrCreateDefaultOrganization() {
  try {
    // Try to find existing default organization
    let defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'default-organization' },
    });

    if (!defaultOrg) {
      // Create default organization if it doesn't exist
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-organization',
          metadata: JSON.stringify({
            description: 'Default organization for all users',
            type: 'default',
            autoCreated: true,
          }),
        },
      });
      console.log('Created default organization:', defaultOrg.id);
    }

    return defaultOrg;
  } catch (error) {
    console.error('Error getting/creating default organization:', error);
    throw error;
  }
}

/**
 * Add a user to the default organization
 */
export async function addUserToDefaultOrganization(userId: string, role: string = 'MEMBER') {
  try {
    const defaultOrg = await getOrCreateDefaultOrganization();

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: defaultOrg.id,
      },
    });

    if (existingMember) {
      console.log('User already a member of default organization');
      return existingMember;
    }

    // Add user to default organization
    const member = await prisma.member.create({
      data: {
        userId,
        organizationId: defaultOrg.id,
        role,
      },
    });

    console.log('Added user to default organization:', userId);
    return member;
  } catch (error) {
    console.error('Error adding user to default organization:', error);
    throw error;
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  logo?: string;
  metadata?: string;
  ownerId: string;
}) {
  try {
    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        metadata: data.metadata,
      },
    });

    // Add the creator as owner
    await prisma.member.create({
      data: {
        userId: data.ownerId,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    return organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

/**
 * Invite a user to an organization
 */
export async function inviteUserToOrganization(data: {
  email: string;
  organizationId: string;
  inviterId: string;
  role: string;
}) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      // Check if user is already a member
      const existingMember = await prisma.member.findFirst({
        where: {
          userId: existingUser.id,
          organizationId: data.organizationId,
        },
      });

      if (existingMember) {
        throw new Error('User is already a member of this organization');
      }
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: data.email,
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        role: data.role,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return invitation;
  } catch (error) {
    console.error('Error inviting user to organization:', error);
    throw error;
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(invitationId: string, userId: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Add user to organization
    await prisma.member.create({
      data: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

/**
 * Remove a user from an organization
 */
export async function removeUserFromOrganization(userId: string, organizationId: string) {
  try {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!member) {
      throw new Error('User is not a member of this organization');
    }

    // Don't allow removing the last owner
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.member.count({
        where: {
          organizationId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner from an organization');
      }
    }

    await prisma.member.delete({
      where: { id: member.id },
    });

    return true;
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
}

/**
 * Update user role in organization
 */
export async function updateUserRole(userId: string, organizationId: string, newRole: string) {
  try {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!member) {
      throw new Error('User is not a member of this organization');
    }

    // Don't allow changing the last owner's role
    if (member.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await prisma.member.count({
        where: {
          organizationId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot change the role of the last owner');
      }
    }

    await prisma.member.update({
      where: { id: member.id },
      data: { role: newRole },
    });

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
} 