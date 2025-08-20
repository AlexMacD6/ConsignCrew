import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { initials: string } }
) {
  try {
    const { initials } = await params;
    
    // Get client IP and user agent for tracking
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      request.ip ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

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

    // Log the QR scan
    await prisma.reviewScan.create({
      data: {
        driverId: driver.id,
        ipAddress,
        userAgent,
      },
    });

    // Default Google Reviews URL for TreasureHub
    const defaultGoogleReviewsUrl = "https://g.page/r/CSDiB3DPr0hFEAI/review";
    const redirectUrl = driver.googleReviewsUrl || defaultGoogleReviewsUrl;

    return NextResponse.json({ 
      redirectUrl,
      driver: {
        initials: driver.initials,
        fullName: driver.fullName
      }
    });
  } catch (error) {
    console.error("Error processing review redirect:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
