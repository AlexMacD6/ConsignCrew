import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
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

    const { qualityChecked, filter, searchTerm } = await request.json();

    if (typeof qualityChecked !== "boolean") {
      return NextResponse.json(
        { error: "qualityChecked must be a boolean" },
        { status: 400 }
      );
    }

    // Build where clause
    let whereClause: any = {};

    // Filter by quality check status
    if (filter === "checked") {
      whereClause.qualityChecked = true;
    } else if (filter === "unchecked") {
      whereClause.qualityChecked = false;
    }

    // Add search functionality
    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    // Update listings
    const result = await prisma.listing.updateMany({
      where: whereClause,
      data: { qualityChecked },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error bulk updating quality check status:", error);
    return NextResponse.json(
      { error: "Failed to bulk update quality check status" },
      { status: 500 }
    );
  }
} 