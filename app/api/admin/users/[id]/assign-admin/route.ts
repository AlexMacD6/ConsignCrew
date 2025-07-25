import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auth } from '../../../../../lib/auth';

// POST /api/admin/users/[id]/assign-admin - Assign admin role to user in organization
export async function POST(
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
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
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
      // Update existing member to admin role
      member = await prisma.member.update({
        where: { id: member.id },
        data: { role: 'ADMIN' },
      });
    } else {
      // Create new member with admin role
      member = await prisma.member.create({
        data: {
          userId: params.id,
          organizationId: organizationId,
          role: 'ADMIN',
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User assigned as admin successfully',
      member 
    });
  } catch (error) {
    console.error('Error assigning admin role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 