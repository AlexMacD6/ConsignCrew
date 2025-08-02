import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id: id,
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
        { error: "Listing not found" },
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