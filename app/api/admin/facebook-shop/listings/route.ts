import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Get all listings with Facebook Shop status for admin management
 */
export async function GET(request: NextRequest) {
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

    // Fetch all listings with user information
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        facebookShopEnabled: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      listings,
      total: listings.length,
      enabled: listings.filter(l => l.facebookShopEnabled).length,
      disabled: listings.filter(l => !l.facebookShopEnabled).length
    });

  } catch (error) {
    console.error("Error fetching listings for Facebook Shop management:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
} 