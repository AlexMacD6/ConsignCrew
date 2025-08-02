import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API route to increment view count for a listing
 * This should be called when someone visits a listing detail page
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Increment the view count for this listing
    const updatedListing = await prisma.listing.update({
      where: { itemId: id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        itemId: true,
        title: true,
        views: true,
      },
    });

    return NextResponse.json({
      success: true,
      views: updatedListing.views,
    });

  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to increment view count" },
      { status: 500 }
    );
  }
} 