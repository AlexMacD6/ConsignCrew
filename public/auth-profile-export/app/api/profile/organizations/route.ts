import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get user's organization memberships
 * GET /api/profile/organizations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's organization memberships
    const memberships = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    const response = NextResponse.json({
      organizations: memberships.map(m => ({
        organizationId: m.organization.id,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
        joinedAt: m.createdAt,
      }))
    });

    // Add caching headers for better performance (longer cache for permissions)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
