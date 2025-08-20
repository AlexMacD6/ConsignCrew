import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '../../../lib/auth';

// GET /api/admin/users - Get all users with organization memberships (admin only)
export async function GET(request: NextRequest) {
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

    // Get all users with their organization memberships
    const users = await prisma.user.findMany({
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to include role and organization info
    const usersWithOrganizations = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      mobilePhone: user.mobilePhone,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      primaryRole: user.members.length > 0 ? user.members[0].role : 'NO_ROLE',
      organizations: user.members.map(member => ({
        id: member.id, // Use member ID instead of organization ID to ensure uniqueness
        organizationId: member.organization.id,
        name: member.organization.name,
        role: member.role,
      })),
      totalOrganizations: user.members.length,
    }));

    return NextResponse.json({ users: usersWithOrganizations });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 