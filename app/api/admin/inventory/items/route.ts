import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Admin auth
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const statusParam = searchParams.get("status");
    const status = (statusParam && statusParam !== "ALL"
      ? (statusParam as "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED")
      : null);
    const listId = searchParams.get("listId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (listId) where.listId = listId;
    if (status) where.receiveStatus = status;
    if (q) {
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { itemNumber: { contains: q, mode: "insensitive" } },
        { vendor: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total, counts] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          list: {
            select: { id: true, name: true, lotNumber: true, briefDescription: true },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { description: "asc" }],
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.groupBy({
        by: ["receiveStatus"],
        _count: { receiveStatus: true },
      }),
    ]);

    const statusCounts = {
      MANIFESTED: 0,
      PARTIALLY_RECEIVED: 0,
      RECEIVED: 0,
    } as Record<string, number>;
    for (const c of counts) statusCounts[c.receiveStatus] = c._count.receiveStatus;

    return NextResponse.json({
      success: true,
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}


