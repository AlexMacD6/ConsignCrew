import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * API route to handle saving/unsaving a listing
 * POST /api/listings/[id]/save
 * Body: { action: 'save' | 'unsave' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    if (!action || !['save', 'unsave'].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'save' or 'unsave'" },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { itemId: id },
      select: { id: true, saves: true }
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Update saves count
    const updatedListing = await prisma.listing.update({
      where: { itemId: id },
      data: {
        saves: {
          increment: action === 'save' ? 1 : -1,
        },
      },
      select: {
        itemId: true,
        title: true,
        saves: true,
      },
    });

    // Ensure saves count doesn't go below 0
    if (updatedListing.saves < 0) {
      await prisma.listing.update({
        where: { itemId: id },
        data: { saves: 0 },
      });
      updatedListing.saves = 0;
    }

    return NextResponse.json({
      success: true,
      saves: updatedListing.saves,
      action: action,
    });

  } catch (error) {
    console.error("Error updating saves count:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update saves count" },
      { status: 500 }
    );
  }
}
