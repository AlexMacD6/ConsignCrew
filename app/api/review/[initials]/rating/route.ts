import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { initials: string } }
) {
  try {
    const { initials } = await params;
    const { rating } = await request.json();
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get client IP and user agent for tracking
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      request.ip ||
      "unknown";

    // Find the driver by initials (case insensitive)
    const driver = await prisma.driver.findUnique({
      where: {
        initials: initials.toUpperCase(),
      },
    });

    if (!driver || !driver.isActive) {
      return NextResponse.json(
        { error: "Driver not found or inactive" },
        { status: 404 }
      );
    }

    // Find the most recent review scan for this driver from this IP
    // This links the rating to the QR scan that brought them here
    const recentScan = await prisma.reviewScan.findFirst({
      where: {
        driverId: driver.id,
        ipAddress: ipAddress,
        scannedAt: {
          // Within the last 30 minutes
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    if (!recentScan) {
      console.warn(`No recent scan found for rating submission: ${initials}, IP: ${ipAddress}`);
    }

    // Store the pre-screening rating
    const preScreeningRating = await prisma.preScreeningRating.create({
      data: {
        driverId: driver.id,
        reviewScanId: recentScan?.id, // May be null if no recent scan found
        rating: rating,
        ipAddress: ipAddress,
        proceedsToGoogle: rating >= 4,
      },
    });

    // Log the rating action
    console.log(`📊 Pre-screening rating: ${rating}/5 for driver ${driver.initials} (${driver.fullName}), proceeds to Google: ${rating >= 4}`);

    return NextResponse.json({ 
      success: true,
      rating: rating,
      proceedsToGoogle: rating >= 4,
      message: rating >= 4 
        ? "Thank you! Redirecting to Google Reviews..." 
        : "Thank you for your feedback. Our team will follow up."
    });

  } catch (error) {
    console.error("Error processing pre-screening rating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
