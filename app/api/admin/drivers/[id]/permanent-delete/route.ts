import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Permanently delete a driver and ALL associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driverId = params.id;

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        _count: {
          select: {
            reviewScans: true,
            reviewBonuses: true,
          }
        }
      }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Log the deletion for audit purposes
    console.log(`🚨 PERMANENT DELETE: Driver ${existingDriver.fullName} (${existingDriver.initials}) with ${existingDriver._count.reviewScans} scans and ${existingDriver._count.reviewBonuses} bonuses`);

    // Permanently delete all associated data in the correct order (due to foreign key constraints)
    
    // 1. Delete review bonuses first (they reference google reviews)
    const deletedBonuses = await prisma.reviewBonus.deleteMany({
      where: { driverId: driverId }
    });

    // 2. Delete google reviews (they reference review scans)
    const deletedGoogleReviews = await prisma.googleReview.deleteMany({
      where: {
        reviewScan: {
          driverId: driverId
        }
      }
    });

    // 3. Delete review scans (they reference the driver)
    const deletedScans = await prisma.reviewScan.deleteMany({
      where: { driverId: driverId }
    });

    // 4. Finally delete the driver
    const deletedDriver = await prisma.driver.delete({
      where: { id: driverId }
    });

    // Log the deletion results
    console.log(`✅ DELETION COMPLETE: Removed ${deletedScans.count} scans, ${deletedGoogleReviews.count} reviews, ${deletedBonuses.count} bonuses, and driver record`);

    return NextResponse.json({
      success: true,
      message: 'Driver and all associated data permanently deleted',
      deletionSummary: {
        driver: deletedDriver.fullName,
        reviewScansDeleted: deletedScans.count,
        googleReviewsDeleted: deletedGoogleReviews.count,
        bonusesDeleted: deletedBonuses.count,
      }
    });

  } catch (error) {
    console.error('❌ Error permanently deleting driver:', error);
    
    // Check if this is a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete driver due to data dependencies. Please contact support.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
