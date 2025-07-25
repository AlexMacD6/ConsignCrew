import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '../../../lib/auth';
import { acceptInvitation } from '../../../lib/organization-utils';

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    // Accept the invitation
    await acceptInvitation(invitationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 