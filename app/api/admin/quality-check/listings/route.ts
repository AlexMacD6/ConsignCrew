import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const searchTerm = searchParams.get("search") || "";

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

    // Fetch listings
    const listings = await prisma.listing.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        qualityChecked: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("Error fetching listings for quality check:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
} 