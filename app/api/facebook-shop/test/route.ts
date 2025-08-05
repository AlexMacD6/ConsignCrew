import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Facebook Shop export endpoint...");
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    console.log("Session:", session ? "Found" : "Not found");
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    console.log("User admin status:", user?.isAdmin);

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Simple test - just count listings
    const listingCount = await prisma.listing.count({
      where: {
        facebookShopEnabled: true,
        status: "active"
      }
    });

    console.log(`Found ${listingCount} listings`);

    return NextResponse.json({
      success: true,
      message: "Test endpoint working",
      listingCount,
      user: {
        id: session.user.id,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 