import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '../../../lib/auth';

// GET /api/admin/check-status - Check if current user has admin privileges
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin in any organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or owner in any organization
    const isAdmin = user.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );

    // Get user's admin organizations
    const adminOrganizations = user.members
      .filter(member => member.role === 'ADMIN' || member.role === 'OWNER')
      .map(member => member.organization);

    return NextResponse.json({ 
      isAdmin, 
      adminOrganizations,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 