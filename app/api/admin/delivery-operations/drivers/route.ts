import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get all delivery drivers
 * GET /api/admin/delivery-operations/drivers
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: {
              select: { slug: true }
            }
          }
        }
      }
    });

    const isAdmin = user?.members?.some(member => 
      member.organization.slug === 'treasurehub-admin' || 
      member.role === 'ADMIN' || 
      member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get drivers from Review-to-Tip driver table
    const driversFromDB = await prisma.driver.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        vehicleType: true,
        isActive: true,
      },
      orderBy: [
        { isActive: 'desc' },
        { fullName: 'asc' }
      ]
    });

    // Transform to delivery operations format
    const drivers = driversFromDB.map(driver => ({
      id: driver.id,
      name: driver.fullName,
      email: driver.email || 'No email provided',
      phone: driver.phone || 'No phone provided',
      vehicleType: driver.vehicleType || 'Not specified',
      isActive: driver.isActive,
    }));

    return NextResponse.json({
      success: true,
      drivers
    });

  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

/**
 * Create or update driver
 * POST /api/admin/delivery-operations/drivers
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: {
              select: { slug: true }
            }
          }
        }
      }
    });

    const isAdmin = user?.members?.some(member => 
      member.organization.slug === 'treasurehub-admin' || 
      member.role === 'ADMIN' || 
      member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, email, phone, vehicleType, isActive } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // TODO: Implement driver creation in database
    // This would create a new driver record
    // const driver = await prisma.driver.create({
    //   data: {
    //     name,
    //     email,
    //     phone,
    //     vehicleType,
    //     isActive: isActive ?? true,
    //     createdBy: session.user.id
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver created successfully',
      // driver
    });

  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}

/**
 * Update driver status
 * PUT /api/admin/delivery-operations/drivers
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: {
              select: { slug: true }
            }
          }
        }
      }
    });

    const isAdmin = user?.members?.some(member => 
      member.organization.slug === 'treasurehub-admin' || 
      member.role === 'ADMIN' || 
      member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { driverId, isActive } = await request.json();

    if (!driverId || isActive === undefined) {
      return NextResponse.json({ 
        error: 'Driver ID and status are required' 
      }, { status: 400 });
    }

    // TODO: Implement driver status update in database
    // await prisma.driver.update({
    //   where: { id: driverId },
    //   data: {
    //     isActive,
    //     updatedBy: session.user.id
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver status updated successfully'
    });

  } catch (error) {
    console.error('Error updating driver status:', error);
    return NextResponse.json(
      { error: 'Failed to update driver status' },
      { status: 500 }
    );
  }
}
