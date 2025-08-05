import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../../lib/auth";

/**
 * Bulk toggle Facebook Shop status for multiple listings
 */
export async function POST(request: NextRequest) {
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

    const { enabled, filter, searchTerm } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Build where clause based on filter and search
    const whereClause: any = {};

    // Apply filter
    if (filter === 'enabled') {
      whereClause.facebookShopEnabled = true;
    } else if (filter === 'disabled') {
      whereClause.facebookShopEnabled = false;
    }

    // Apply search term
    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // Update all matching listings
    const result = await prisma.listing.updateMany({
      where: whereClause,
      data: { facebookShopEnabled: enabled }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      enabled
    });

  } catch (error) {
    console.error("Error bulk updating Facebook Shop status:", error);
    return NextResponse.json(
      { error: "Failed to bulk update listings" },
      { status: 500 }
    );
  }
} 