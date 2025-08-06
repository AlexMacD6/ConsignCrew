import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auth } from '../../../../../lib/auth';
import { inviteUserToOrganization } from '../../../../../lib/organization-utils';

// GET /api/admin/organizations/[id]/invitations - Get organization invitations
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

    // Get organization invitations
    const invitations = await prisma.invitation.findMany({
      where: { organizationId: params.id },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/organizations/[id]/invitations - Create invitation
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

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Create invitation
    const invitation = await inviteUserToOrganization({
      email,
      organizationId: params.id,
      inviterId: session.user.id,
      role,
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id]/invitations - Cancel invitation
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
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    // Cancel invitation
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 