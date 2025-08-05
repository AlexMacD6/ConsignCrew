import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../../lib/auth";

/**
 * Update Facebook Shop status for a specific listing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          where: {
            role: {
              in: ['ADMIN', 'OWNER']
            }
          }
        }
      }
    });

    if (!user?.members.length) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { facebookShopEnabled } = await request.json();

    if (typeof facebookShopEnabled !== 'boolean') {
      return NextResponse.json(
        { error: "facebookShopEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: { facebookShopEnabled },
      select: {
        id: true,
        title: true,
        facebookShopEnabled: true
      }
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing
    });

  } catch (error) {
    console.error("Error updating listing Facebook Shop status:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
} 