import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all saved listings for the user
    const savedListings = await prisma.savedListing.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          select: {
            itemId: true
          }
        }
      }
    });

    // Extract just the listing itemIds
    const savedItemIds = savedListings.map(saved => saved.listing.itemId);

    return NextResponse.json({
      success: true,
      savedListings: savedItemIds
    });

  } catch (error) {
    console.error("Error fetching saved listings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch saved listings" },
      { status: 500 }
    );
  }
}
