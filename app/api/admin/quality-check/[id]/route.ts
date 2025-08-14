import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { trackProductStatusChange } from "@/lib/meta-pixel-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user?.members.length) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, qualityScore } = body;

    // Get the current listing to track status changes
    const currentListing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        itemId: true,
        title: true,
        status: true,
        price: true,
        department: true,
        category: true,
        brand: true,
        condition: true,
        reservePrice: true
      }
    });

    if (!currentListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const previousStatus = currentListing.status;

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        qualityChecked: true,
        qualityScore: qualityScore || null,
        qualityNotes: notes || null,
        status: status || "active",
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send real-time status change event to Meta if status changed
    if (status && status !== previousStatus) {
      try {
        await trackProductStatusChange({
          content_ids: [currentListing.itemId],
          content_type: 'product',
          content_name: currentListing.title,
          content_category: `${currentListing.department} > ${currentListing.category}`,
          value: currentListing.price,
          currency: 'USD',
          brand: currentListing.brand || 'TreasureHub',
          condition: currentListing.condition,
          availability: status === 'active' ? 'in stock' : 'out of stock',
          price: currentListing.price,
          sale_price: currentListing.reservePrice || currentListing.price,
          previous_status: previousStatus,
          new_status: status,
          reason: `Quality check: ${notes || 'Status updated'}`
        });
        console.log(`✅ Sent product status change event for ${currentListing.itemId}`);
      } catch (eventError) {
        console.warn(`⚠️ Failed to send product status change event for ${currentListing.itemId}:`, eventError);
      }
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error updating listing quality check:", error);
    return NextResponse.json(
      { error: "Failed to update quality check" },
      { status: 500 }
    );
  }
} 