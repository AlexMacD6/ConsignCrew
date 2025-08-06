import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { auth } from '../../../../../../../lib/auth';

// GET /api/admin/organizations/[id]/teams/[teamId]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; teamId: string } }
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

    // Get team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: params.teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/organizations/[id]/teams/[teamId]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; teamId: string } }
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is a member of the organization
    const orgMember = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: params.id,
      },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'User must be a member of the organization' }, { status: 400 });
    }

    // Check if user is already a member of the team
    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        teamId: params.teamId,
      },
    });

    if (existingTeamMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Add user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        userId,
        teamId: params.teamId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error('Error adding member to team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id]/teams/[teamId]/members - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; teamId: string } }
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

    // Remove user from team
    await prisma.teamMember.deleteMany({
      where: {
        userId,
        teamId: params.teamId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member from team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 