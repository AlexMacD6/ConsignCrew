import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
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

    const listing = await prisma.listing.findUnique({
      where: {
        itemId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            members: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        priceHistory: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Get last 10 price changes
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: `Listing with itemId '${id}' not found` },
        { status: 404 }
      );
    }

    // Transform the data to include organization information
    const transformedListing = {
      ...listing,
      user: {
        ...listing.user,
        organization: listing.user.members[0]?.organization || null,
        organizations: listing.user.members.map(member => member.organization),
      },
    };

    return NextResponse.json({
      success: true,
      listing: transformedListing,
    });

  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Get the existing listing to check ownership
    const existingListing = await prisma.listing.findUnique({
      where: { itemId: id },
      include: { user: true },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: `Listing with itemId '${id}' not found` },
        { status: 404 }
      );
    }

    // Check if the user owns this listing
    if (existingListing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      department,
      category,
      subCategory,
      title,
      condition,
      price,
      description,
      zipCode,
      neighborhood,
      brand,
      height,
      width,
      depth,
      serialNumber,
      modelNumber,
      estimatedRetailPrice,
      discountSchedule,
      photos,
      videoUrl,
    } = body;

    // Validate required fields
    if (!title || !price || !condition || !description || !zipCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { itemId: id },
      data: {
        department,
        category,
        subCategory,
        title,
        condition,
        price: parseFloat(price),
        description,
        zipCode,
        neighborhood,
        brand: brand || null,
        height: height || null,
        width: width || null,
        depth: depth || null,
        serialNumber: serialNumber || null,
        modelNumber: modelNumber || null,
        estimatedRetailPrice: estimatedRetailPrice ? parseFloat(estimatedRetailPrice) : null,
        discountSchedule: discountSchedule || { type: "Classic-60" },
        photos: photos || {},
        videoUrl: videoUrl || null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });

  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update listing" },
      { status: 500 }
    );
  }
} 