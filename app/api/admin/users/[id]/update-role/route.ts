import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auth } from '../../../../../lib/auth';

// PUT /api/admin/users/[id]/update-role - Update user role in organization
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

    // Check if current user is admin in any organization
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

    // Check if current user is admin or owner in any organization
    const isAdmin = currentUser.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { organizationId, newRole } = await request.json();

    if (!organizationId || !newRole) {
      return NextResponse.json({ error: 'Organization ID and new role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['MEMBER', 'ADMIN', 'OWNER'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be MEMBER, ADMIN, or OWNER' }, { status: 400 });
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is already a member of the organization
    let member = await prisma.member.findFirst({
      where: {
        userId: params.id,
        organizationId: organizationId,
      },
    });

    if (member) {
      // Update existing member role
      member = await prisma.member.update({
        where: { id: member.id },
        data: { role: newRole },
      });
    } else {
      // Create new member with specified role
      member = await prisma.member.create({
        data: {
          userId: params.id,
          organizationId: organizationId,
          role: newRole,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User role updated successfully',
      member 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




