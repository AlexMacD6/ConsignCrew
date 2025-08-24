import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all drivers with review statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { initials: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activeOnly) {
      where.isActive = true;
    }

    // Get drivers with statistics
    const [drivers, totalCount] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              reviewScans: true,
              reviewBonuses: true,
            },
          },
          reviewScans: {
            orderBy: { scannedAt: 'desc' },
            take: 5,
            include: {
              googleReview: {
                select: {
                  rating: true,
                  confirmedAt: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { totalReviews: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      drivers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initials, fullName, email, phone, vehicleType, googleReviewsUrl } = body;

    // Validate required fields
    if (!initials || !fullName) {
      return NextResponse.json(
        { error: 'Initials and full name are required' },
        { status: 400 }
      );
    }

    // Validate initials format (2-4 uppercase letters)
    if (!/^[A-Z]{2,4}$/.test(initials)) {
      return NextResponse.json(
        { error: 'Initials must be 2-4 uppercase letters (e.g., ARM, JD)' },
        { status: 400 }
      );
    }

    // Check if driver with these initials already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { initials },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: `Driver with initials "${initials}" already exists` },
        { status: 409 }
      );
    }

    // Check if email is already in use
    if (email) {
      const existingEmail = await prisma.driver.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: `Email "${email}" is already in use` },
          { status: 409 }
        );
      }
    }

    // Create new driver
    const driver = await prisma.driver.create({
      data: {
        initials: initials.toUpperCase(),
        fullName,
        email: email || null,
        phone: phone || null,
        vehicleType: vehicleType || null,
        googleReviewsUrl: googleReviewsUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      driver,
      message: 'Driver created successfully',
    });

  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update an existing driver
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, initials, fullName, email, phone, vehicleType, googleReviewsUrl, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Validate initials if provided
    if (initials && !/^[A-Z]{2,4}$/.test(initials)) {
      return NextResponse.json(
        { error: 'Initials must be 2-4 uppercase letters (e.g., ARM, JD)' },
        { status: 400 }
      );
    }

    // Check for conflicts with other drivers
    if (initials && initials !== existingDriver.initials) {
      const conflictingDriver = await prisma.driver.findUnique({
        where: { initials },
      });

      if (conflictingDriver) {
        return NextResponse.json(
          { error: `Driver with initials "${initials}" already exists` },
          { status: 409 }
        );
      }
    }

    if (email && email !== existingDriver.email) {
      const conflictingEmail = await prisma.driver.findUnique({
        where: { email },
      });

      if (conflictingEmail) {
        return NextResponse.json(
          { error: `Email "${email}" is already in use` },
          { status: 409 }
        );
      }
    }

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        ...(initials && { initials: initials.toUpperCase() }),
        ...(fullName && { fullName }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(vehicleType !== undefined && { vehicleType: vehicleType || null }),
        ...(googleReviewsUrl !== undefined && { googleReviewsUrl: googleReviewsUrl || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      driver: updatedDriver,
      message: 'Driver updated successfully',
    });

  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Deactivate a driver (soft delete - preserves all data)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false (preserves all review data)
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: { isActive: false },
    });

    console.log(`🔄 SOFT DELETE: Driver ${existingDriver.fullName} (${existingDriver.initials}) deactivated (data preserved)`);

    return NextResponse.json({
      success: true,
      driver: updatedDriver,
      message: 'Driver deactivated successfully (review history preserved)',
    });

  } catch (error) {
    console.error('Error deactivating driver:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
