import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auth } from '../../../../../lib/auth';
import { 
  updateUserRole, 
  removeUserFromOrganization,
  inviteUserToOrganization 
} from '../../../../../lib/organization-utils';

// GET /api/admin/organizations/[id]/members - Get organization members
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

    // Get organization members
    const members = await prisma.member.findMany({
      where: { organizationId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/admin/organizations/[id]/members - Add member to organization
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

    const { userId, role } = await request.json();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: params.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
    }

    // Add user to organization
    const newMember = await prisma.member.create({
      data: {
        userId,
        organizationId: params.id,
        role: role || 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ member: newMember });
  } catch (error) {
    console.error('Error adding member to organization:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/admin/organizations/[id]/members - Update member role
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

    const { userId, role } = await request.json();

    // Update user role
    await updateUserRole(userId, params.id, role);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id]/members - Remove member from organization
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Remove user from organization
    await removeUserFromOrganization(userId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member from organization:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 