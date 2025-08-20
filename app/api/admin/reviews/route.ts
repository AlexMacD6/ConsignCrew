import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List review scans and Google reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const driverId = searchParams.get('driverId');
    const rating = searchParams.get('rating');
    const bonusAwarded = searchParams.get('bonusAwarded');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (driverId) {
      where.driverId = driverId;
    }

    // Get review scans with related data
    const [reviewScans, totalCount] = await Promise.all([
      prisma.reviewScan.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: {
            select: {
              initials: true,
              fullName: true,
            },
          },
          googleReview: {
            include: {
              reviewBonuses: {
                select: {
                  bonusAmount: true,
                  awardedAt: true,
                  paymentStatus: true,
                },
              },
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
      }),
      prisma.reviewScan.count({ where }),
    ]);

    // Filter by Google review criteria if provided
    let filteredScans = reviewScans;
    if (rating || bonusAwarded) {
      filteredScans = reviewScans.filter(scan => {
        if (!scan.googleReview) return false;
        
        if (rating && scan.googleReview.rating !== parseInt(rating)) {
          return false;
        }
        
        if (bonusAwarded !== null && scan.googleReview.bonusAwarded !== (bonusAwarded === 'true')) {
          return false;
        }
        
        return true;
      });
    }

    // Calculate statistics
    const stats = {
      totalScans: totalCount,
      reviewsConfirmed: reviewScans.filter(scan => scan.googleReview).length,
      fiveStarReviews: reviewScans.filter(scan => scan.googleReview?.rating === 5).length,
      bonusesAwarded: reviewScans.filter(scan => scan.googleReview?.bonusAwarded).length,
    };

    return NextResponse.json({
      success: true,
      reviewScans: filteredScans,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching review scans:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Manually confirm a Google review for a scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewScanId, rating, reviewText, reviewerName, googleReviewId } = body;

    // Validate required fields
    if (!reviewScanId || !rating) {
      return NextResponse.json(
        { error: 'Review scan ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if review scan exists
    const reviewScan = await prisma.reviewScan.findUnique({
      where: { id: reviewScanId },
      include: {
        googleReview: true,
        driver: true,
      },
    });

    if (!reviewScan) {
      return NextResponse.json(
        { error: 'Review scan not found' },
        { status: 404 }
      );
    }

    if (reviewScan.googleReview) {
      return NextResponse.json(
        { error: 'Review already confirmed for this scan' },
        { status: 409 }
      );
    }

    // Create Google review record
    const googleReview = await prisma.googleReview.create({
      data: {
        reviewScanId,
        googleReviewId: googleReviewId || null,
        rating,
        reviewText: reviewText || null,
        reviewerName: reviewerName || null,
      },
    });

    // Update driver statistics
    await prisma.driver.update({
      where: { id: reviewScan.driverId },
      data: {
        totalReviews: { increment: 1 },
      },
    });

    // Automatically award bonus for 5-star reviews
    let reviewBonus = null;
    if (rating === 5) {
      reviewBonus = await prisma.reviewBonus.create({
        data: {
          driverId: reviewScan.driverId,
          googleReviewId: googleReview.id,
          bonusAmount: 5.00, // Default $5 bonus
        },
      });

      // Update driver's total bonus earned
      await prisma.driver.update({
        where: { id: reviewScan.driverId },
        data: {
          totalBonusEarned: { increment: 5.00 },
        },
      });

      // Mark the review as having a bonus awarded
      await prisma.googleReview.update({
        where: { id: googleReview.id },
        data: { bonusAwarded: true },
      });
    }

    return NextResponse.json({
      success: true,
      googleReview,
      reviewBonus,
      message: rating === 5 
        ? 'Review confirmed and $5 bonus awarded!' 
        : 'Review confirmed successfully',
    });

  } catch (error) {
    console.error('Error confirming review:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a confirmed review
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleReviewId, rating, reviewText, reviewerName } = body;

    if (!googleReviewId) {
      return NextResponse.json(
        { error: 'Google review ID is required' },
        { status: 400 }
      );
    }

    const existingReview = await prisma.googleReview.findUnique({
      where: { id: googleReviewId },
      include: {
        reviewScan: {
          include: { driver: true },
        },
        reviewBonuses: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const oldRating = existingReview.rating;
    const newRating = rating || oldRating;

    // Update the review
    const updatedReview = await prisma.googleReview.update({
      where: { id: googleReviewId },
      data: {
        ...(rating && { rating }),
        ...(reviewText !== undefined && { reviewText }),
        ...(reviewerName !== undefined && { reviewerName }),
      },
    });

    // Handle bonus logic if rating changed
    if (rating && rating !== oldRating) {
      const driverId = existingReview.reviewScan.driverId;
      
      // If changing from 5-star to non-5-star, remove bonus
      if (oldRating === 5 && newRating !== 5) {
        await prisma.reviewBonus.deleteMany({
          where: { googleReviewId },
        });
        
        await prisma.driver.update({
          where: { id: driverId },
          data: {
            totalBonusEarned: { decrement: 5.00 },
          },
        });

        await prisma.googleReview.update({
          where: { id: googleReviewId },
          data: { bonusAwarded: false },
        });
      }
      
      // If changing from non-5-star to 5-star, add bonus
      if (oldRating !== 5 && newRating === 5) {
        await prisma.reviewBonus.create({
          data: {
            driverId,
            googleReviewId,
            bonusAmount: 5.00,
          },
        });

        await prisma.driver.update({
          where: { id: driverId },
          data: {
            totalBonusEarned: { increment: 5.00 },
          },
        });

        await prisma.googleReview.update({
          where: { id: googleReviewId },
          data: { bonusAwarded: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      googleReview: updatedReview,
      message: 'Review updated successfully',
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
