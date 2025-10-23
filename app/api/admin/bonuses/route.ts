import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List review bonuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const driverId = searchParams.get('driverId');
    const paymentStatus = searchParams.get('paymentStatus');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (driverId) {
      where.driverId = driverId;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Get bonuses with related data
    const [bonuses, totalCount] = await Promise.all([
      prisma.reviewBonus.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: {
            select: {
              initials: true,
              fullName: true,
              email: true,
            },
          },
          googleReview: {
            include: {
              reviewScan: {
                select: {
                  scannedAt: true,
                  ipAddress: true,
                },
              },
            },
          },
        },
        orderBy: { awardedAt: 'desc' },
      }),
      prisma.reviewBonus.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.reviewBonus.aggregate({
      where,
      _sum: { bonusAmount: true },
      _count: true,
    });

    const statusStats = await prisma.reviewBonus.groupBy({
      by: ['paymentStatus'],
      where,
      _sum: { bonusAmount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      bonuses,
      stats: {
        totalBonuses: stats._count,
        totalAmount: stats._sum.bonusAmount || 0,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.paymentStatus] = {
            count: stat._count,
            amount: stat._sum.bonusAmount || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; amount: number }>),
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching bonuses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update bonus payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bonusId, paymentStatus, paymentMethod, paymentDetails } = body;

    if (!bonusId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Bonus ID and payment status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Payment status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if bonus exists
    const existingBonus = await prisma.reviewBonus.findUnique({
      where: { id: bonusId },
      include: {
        driver: true,
        googleReview: true,
      },
    });

    if (!existingBonus) {
      return NextResponse.json(
        { error: 'Bonus not found' },
        { status: 404 }
      );
    }

    // Update bonus
    const updatedBonus = await prisma.reviewBonus.update({
      where: { id: bonusId },
      data: {
        paymentStatus,
        ...(paymentMethod && { paymentMethod }),
        ...(paymentDetails && { paymentDetails }),
      },
    });

    return NextResponse.json({
      success: true,
      bonus: updatedBonus,
      message: `Bonus payment status updated to ${paymentStatus}`,
    });

  } catch (error) {
    console.error('Error updating bonus:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Mark multiple bonuses as paid (bulk operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bonusIds, paymentStatus, paymentMethod, paymentDetails } = body;

    if (!bonusIds || !Array.isArray(bonusIds) || bonusIds.length === 0) {
      return NextResponse.json(
        { error: 'Bonus IDs array is required' },
        { status: 400 }
      );
    }

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'Payment status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Payment status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update multiple bonuses
    const updateResult = await prisma.reviewBonus.updateMany({
      where: {
        id: { in: bonusIds },
      },
      data: {
        paymentStatus,
        ...(paymentMethod && { paymentMethod }),
        ...(paymentDetails && { paymentDetails }),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      message: `${updateResult.count} bonuses updated to ${paymentStatus}`,
    });

  } catch (error) {
    console.error('Error bulk updating bonuses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
