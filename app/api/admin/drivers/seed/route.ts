import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check if this is an admin request (you may want to add proper authentication)
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    
    // Basic security check - replace with proper auth
    if (adminKey !== process.env.ADMIN_SEED_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Default Google Reviews URL for TreasureHub
    const defaultGoogleReviewsUrl = 'https://g.page/r/TreasureHub/review';

    // Seed drivers data
    const driversToCreate = [
      {
        initials: 'ARM',
        fullName: 'Alexander Raymond MacDonald',
        email: 'alex@treasurehub.club',
        googleReviewsUrl: defaultGoogleReviewsUrl,
        isActive: true,
      },
      // Add more drivers here as needed
    ];

    const createdDrivers = [];

    for (const driverData of driversToCreate) {
      try {
        // Check if driver already exists
        const existingDriver = await prisma.driver.findUnique({
          where: { initials: driverData.initials },
        });

        if (existingDriver) {
          console.log(`Driver ${driverData.initials} already exists, skipping...`);
          continue;
        }

        // Create new driver
        const driver = await prisma.driver.create({
          data: driverData,
        });

        createdDrivers.push(driver);
        console.log(`Created driver: ${driver.fullName} (${driver.initials})`);
      } catch (error) {
        console.error(`Error creating driver ${driverData.initials}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${driversToCreate.length} drivers`,
      created: createdDrivers.length,
      drivers: createdDrivers,
    });

  } catch (error) {
    console.error('Error seeding drivers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to list all drivers (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    
    // Basic security check
    if (adminKey !== process.env.ADMIN_SEED_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        initials: true,
        fullName: true,
        email: true,
        isActive: true,
        totalReviews: true,
        totalBonusEarned: true,
        createdAt: true,
        _count: {
          select: {
            reviewScans: true,
            reviewBonuses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      drivers,
      total: drivers.length,
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
