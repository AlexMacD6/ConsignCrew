import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseAvailable, safeDbOperation } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/admin/check-status - Check if current user has admin privileges
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.error('DATABASE_URL not available');
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Safely execute database operation
    const user = await safeDbOperation(async () => {
      return await db.user.findUnique({
        where: { id: session.user.id },
        include: {
          members: {
            include: {
              organization: true,
            },
          },
        },
      });
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
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('Database not available')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 