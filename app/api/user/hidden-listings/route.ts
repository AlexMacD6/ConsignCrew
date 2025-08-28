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

    // Get all hidden listings for the user
    const hiddenListings = await prisma.hiddenListing.findMany({
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
    const hiddenItemIds = hiddenListings.map(hidden => hidden.listing.itemId);

    return NextResponse.json({
      success: true,
      hiddenListings: hiddenItemIds
    });

  } catch (error) {
    console.error("Error fetching hidden listings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch hidden listings" },
      { status: 500 }
    );
  }
}
