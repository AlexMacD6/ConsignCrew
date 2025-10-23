import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get pre-screening rating statistics
export async function GET(request: NextRequest) {
  try {
    // Get total pre-screening ratings
    const totalRatings = await prisma.preScreeningRating.count();

    // Get high ratings (4-5 stars)
    const highRatings = await prisma.preScreeningRating.count({
      where: {
        rating: {
          gte: 4
        }
      }
    });

    // Get low ratings (1-3 stars)
    const lowRatings = await prisma.preScreeningRating.count({
      where: {
        rating: {
          lte: 3
        }
      }
    });

    // Calculate conversion rate (percentage that proceed to Google Reviews)
    const conversionRate = totalRatings > 0 ? Math.round((highRatings / totalRatings) * 100) : 0;

    // Get rating distribution
    const ratingDistribution = await prisma.preScreeningRating.groupBy({
      by: ['rating'],
      _count: {
        rating: true
      },
      orderBy: {
        rating: 'asc'
      }
    });

    // Get recent ratings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await prisma.preScreeningRating.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        rating: true,
        proceedsToGoogle: true,
        createdAt: true,
        driver: {
          select: {
            initials: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Calculate average rating
    const averageRating = await prisma.preScreeningRating.aggregate({
      _avg: {
        rating: true
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRatings,
        highRatings,
        lowRatings,
        conversionRate,
        averageRating: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 10) / 10 : 0,
        ratingDistribution,
        recentRatings: recentStats.length,
      },
      recentActivity: recentStats
    });

  } catch (error) {
    console.error('Error fetching pre-screening statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
