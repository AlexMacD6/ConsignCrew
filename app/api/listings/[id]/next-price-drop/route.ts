import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  DISCOUNT_SCHEDULES, 
  calculateNextDropInfo, 
  calculateCurrentPrice,
  calculateNextDropPriceFromOriginal
} from '@/lib/discount-schedule';

// GET - Get next price drop information for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    // Find the listing by itemId
    const listing = await prisma.listing.findUnique({
      where: { itemId: listingId },
      include: {
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Get the original price (first price in history or current price)
    const originalPrice = listing.priceHistory[0]?.price || listing.price;
    const currentPrice = listing.price;
    const reservePrice = listing.reservePrice || 0;

    // Get the discount schedule from the listing
    const discountScheduleData = listing.discountSchedule as any;
    const scheduleType = discountScheduleData?.type || 'Classic-60';
    const discountSchedule = DISCOUNT_SCHEDULES[scheduleType];

    if (!discountSchedule) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'Invalid discount schedule',
        currentPrice,
        originalPrice,
      });
    }

    // Calculate next drop information using proper discount schedule logic
    const nextDropInfo = calculateNextDropInfo(listing.createdAt, discountSchedule);

    if (!nextDropInfo) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'Discount period has ended',
        currentPrice,
        originalPrice,
      });
    }

    // Calculate the next drop price based on ORIGINAL price (for consistent drops)
    const nextDropPrice = calculateNextDropPriceFromOriginal(
      originalPrice,
      listing.createdAt,
      discountSchedule,
      reservePrice
    );

    // If no next drop price available, return no more drops
    if (nextDropPrice === null) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'No more price drops available',
        currentPrice,
        originalPrice,
      });
    }

    // Check if we're already at or below reserve price
    if (nextDropPrice <= reservePrice) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'At reserve price - no more price drops',
        currentPrice,
        reservePrice,
      });
    }

    // Format the time until next drop
    const { daysUntilNextDrop } = nextDropInfo;
    
    let timeUntilNextDrop: string;
    if (daysUntilNextDrop === 0) {
      timeUntilNextDrop = "Any moment now...";
    } else if (daysUntilNextDrop === 1) {
      timeUntilNextDrop = "1d";
    } else {
      timeUntilNextDrop = `${daysUntilNextDrop}d`;
    }

    return NextResponse.json({
      success: true,
      hasPriceDrop: true,
      timeUntilNextDrop,
      nextDropPrice,
      currentPrice,
      originalPrice,
      reservePrice,
      scheduleType,
      nextDropPercentage: nextDropInfo.nextDropPercentage,
    });

  } catch (error) {
    console.error('Error fetching next price drop info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch next price drop info' },
      { status: 500 }
    );
  }
} 