import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { 
  updateUserRole, 
  removeUserFromOrganization,
  inviteUserToOrganization 
} from '../../../../lib/organization-utils';

// GET /api/admin/organizations/[id] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin in any organization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or owner in any organization
    const isAdmin = currentUser.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get organization with members and teams
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobilePhone: true,
              },
            },
          },
        },
        teams: {
          include: {
            teamMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        invitations: {
          where: { status: 'PENDING' },
          include: {
            inviter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or owner of this specific organization
    const member = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden - Admin/Owner access required' }, { status: 403 });
    }

    const { name, slug, logo, metadata } = await request.json();

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        logo,
        metadata,
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner of this specific organization
    const member = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
        role: 'OWNER',
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 });
    }

    // Check if this is the default organization
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
    });

    if (organization?.slug === 'default-organization') {
      return NextResponse.json({ error: 'Cannot delete the default organization' }, { status: 400 });
    }

    // Delete organization (this will cascade delete members, teams, etc.)
    await prisma.organization.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 