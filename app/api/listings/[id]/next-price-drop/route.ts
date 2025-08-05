import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DISCOUNT_SCHEDULES, getTimeUntilNextDrop, getNextDropPercentage, calculateNextDropInfo } from '@/lib/discount-schedule';

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

    // Check if listing has a discount schedule
    const discountScheduleData = listing.discountSchedule as any;
    let scheduleType: string;
    
    // Handle both string format (legacy) and object format
    if (typeof discountScheduleData === 'string') {
      scheduleType = discountScheduleData;
    } else if (discountScheduleData?.type) {
      scheduleType = discountScheduleData.type;
    } else {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'No price drop schedule configured',
      });
    }
    const discountSchedule = DISCOUNT_SCHEDULES[scheduleType];

    if (!discountSchedule) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'Invalid discount schedule',
      });
    }

    // Get the original price (first price in history or current price)
    const originalPrice = listing.priceHistory[0]?.price || listing.price;
    const currentPrice = listing.price;
    const reservePrice = listing.reservePrice || 0;

    // Calculate next price drop information
    const timeUntilNextDrop = getTimeUntilNextDrop(listing.createdAt, discountSchedule);
    const nextDropPercentage = getNextDropPercentage(listing.createdAt, discountSchedule);
    
    // Calculate what the price would be after the next drop
    const nextDropInfo = calculateNextDropInfo(listing.createdAt, discountSchedule);
    const nextDropPrice = nextDropInfo 
      ? Math.round(originalPrice * (nextDropInfo.nextDropPercentage / 100) * 100) / 100
      : 0;
    
    // Check if we're already at or below reserve price
    const isAtReservePrice = currentPrice <= reservePrice;
    
    // If at reserve price, no more drops
    if (isAtReservePrice) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'At reserve price - no more price drops',
        currentPrice,
        reservePrice,
      });
    }

    // If listing has expired, no more drops
    if (!timeUntilNextDrop) {
      return NextResponse.json({
        success: true,
        hasPriceDrop: false,
        message: 'Price drop period has ended',
        currentPrice,
        originalPrice,
      });
    }

    return NextResponse.json({
      success: true,
      hasPriceDrop: true,
      timeUntilNextDrop,
      nextDropPrice: Math.max(nextDropPrice, reservePrice),
      currentPrice,
      originalPrice,
      reservePrice,
      scheduleType,
      nextDropPercentage,
    });

  } catch (error) {
    console.error('Error fetching next price drop info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch next price drop info' },
      { status: 500 }
    );
  }
} 