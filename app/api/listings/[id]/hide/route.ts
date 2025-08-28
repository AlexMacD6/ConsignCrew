import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { itemId: id },
      select: { id: true }
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check if already hidden
    const existingHide = await prisma.hiddenListing.findFirst({
      where: {
        userId: session.user.id,
        listingId: listing.id
      }
    });

    if (existingHide) {
      return NextResponse.json(
        { error: "Listing already hidden" },
        { status: 400 }
      );
    }

    // Hide the listing
    await prisma.hiddenListing.create({
      data: {
        userId: session.user.id,
        listingId: listing.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Listing hidden successfully"
    });

  } catch (error) {
    console.error("Error hiding listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to hide listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { itemId: id },
      select: { id: true }
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check if hidden
    const existingHide = await prisma.hiddenListing.findFirst({
      where: {
        userId: session.user.id,
        listingId: listing.id
      }
    });

    if (!existingHide) {
      return NextResponse.json(
        { error: "Listing not hidden" },
        { status: 400 }
      );
    }

    // Remove the hide
    await prisma.hiddenListing.delete({
      where: {
        id: existingHide.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Listing unhidden successfully"
    });

  } catch (error) {
    console.error("Error unhiding listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unhide listing" },
      { status: 500 }
    );
  }
}
