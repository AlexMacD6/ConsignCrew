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
    const inStockParam = searchParams.get("inStock");
    const availableOnlyParam = searchParams.get("availableOnly"); // Now means "listed only"
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
    if (inStockParam === "true") {
      // Only items with at least one unit received
      where.receivedQuantity = { gt: 0 };
    }
    // Note: We'll handle availableOnlyParam filtering after getting the data
    // availableOnlyParam=true now means "show only listed items"
    if (q) {
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { itemNumber: { contains: q, mode: "insensitive" } },
        { vendor: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { list: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // For listed-only filtering, we need to get all items first, then filter and paginate
    // This is because we need to calculate posting counts before filtering
    const shouldFetchAll = availableOnlyParam === "true";
    
    const [items, total, counts] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          list: {
            select: { id: true, name: true, lotNumber: true, briefDescription: true },
          },
          listings: {
            select: { id: true, status: true, createdAt: true },
            where: { status: "active" }, // Only count active listings
          },
        },
        orderBy: [{ updatedAt: "desc" }, { description: "asc" }],
        ...(shouldFetchAll ? {} : { skip, take: limit }), // Skip pagination if we need to filter
      }),
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.groupBy({
        by: ["receiveStatus"],
        _count: { receiveStatus: true },
      }),
    ]);

    // Include unitPurchasePrice and listing counts
    const itemsWithUnit = items.map((it: any) => {
      const postedListings = it.listings?.length || 0;
      // Handle null quantity by defaulting to 0, but preserve original for debugging
      const originalQuantity = it.quantity;
      const totalInventory = it.quantity || 0;
      const availableToList = Math.max(0, totalInventory - postedListings);
      
      // Debug logging for items with null quantity
      if (originalQuantity === null || originalQuantity === undefined) {
        console.log(`Warning: Item ${it.itemNumber} has null/undefined quantity:`, {
          itemNumber: it.itemNumber,
          originalQuantity,
          totalInventory,
          description: it.description
        });
      }
      
      return {
        ...it,
        quantity: availableToList, // Override with available quantity for the UI
        totalQuantity: totalInventory, // Keep total for display
        unitPurchasePrice:
          typeof it.purchasePrice === "number" && typeof totalInventory === "number" && totalInventory > 0
            ? it.purchasePrice / totalInventory
            : null,
        postedListings,
        availableToList,
        totalInventory,
      };
    });

    // Apply filtering after calculating counts
    // availableOnlyParam=true means "show only items available to list" (availableToList > 0)
    let filteredItems = availableOnlyParam === "true" 
      ? itemsWithUnit.filter(item => item.availableToList > 0)
      : itemsWithUnit;

    // Apply pagination to filtered results if we fetched all items
    if (shouldFetchAll) {
      const startIndex = skip;
      const endIndex = startIndex + limit;
      filteredItems = filteredItems.slice(startIndex, endIndex);
    }

    const statusCounts = {
      MANIFESTED: 0,
      PARTIALLY_RECEIVED: 0,
      RECEIVED: 0,
    } as Record<string, number>;
    for (const c of counts) statusCounts[c.receiveStatus] = c._count.receiveStatus;

    // Calculate proper pagination counts
    const totalFilteredCount = availableOnlyParam === "true" 
      ? itemsWithUnit.filter(item => item.availableToList > 0).length
      : total;

    return NextResponse.json({
      success: true,
      items: filteredItems,
      pagination: { 
        page, 
        limit, 
        total: totalFilteredCount,
        totalPages: Math.ceil(totalFilteredCount / limit) 
      },
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


