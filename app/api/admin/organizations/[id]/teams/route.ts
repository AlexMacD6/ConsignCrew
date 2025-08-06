import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auth } from '../../../../../lib/auth';

// GET /api/admin/organizations/[id]/teams - Get organization teams
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

    // Get organization teams
    const teams = await prisma.team.findMany({
      where: { organizationId: params.id },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error fetching organization teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/organizations/[id]/teams - Create team
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        organizationId: params.id,
      },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/organizations/[id]/teams - Update team
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

    const { teamId, name } = await request.json();

    if (!teamId || !name) {
      return NextResponse.json({ error: 'Team ID and name are required' }, { status: 400 });
    }

    // Update team
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { name },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id]/teams - Delete team
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
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Delete team (this will cascade delete team members)
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 