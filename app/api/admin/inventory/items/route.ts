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
    const listId = searchParams.get("listId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (listId) where.listId = listId;
    // Note: status filtering will be done after fetching, since it's calculated from dispositions
    // Note: inStock filtering will also be done after fetching
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

    // Fetch all items since we need to calculate dispositions and filter before paginating
    const [items, total] = await Promise.all([
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
          dispositions: true, // Include all disposition records
        },
        orderBy: [{ updatedAt: "desc" }, { description: "asc" }],
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Include unitPurchasePrice and listing counts
    const itemsWithUnit = items.map((it: any) => {
      const postedListings = it.listings?.length || 0;
      const totalInventory = it.quantity || 0;
      
      // Calculate disposition quantities from the new disposition records
      const dispositions = it.dispositions || [];
      const receivedQty = dispositions
        .filter((d: any) => d.status === "RECEIVED")
        .reduce((sum: number, d: any) => sum + d.quantity, 0);
      const trashedQty = dispositions
        .filter((d: any) => d.status === "TRASH")
        .reduce((sum: number, d: any) => sum + d.quantity, 0);
      const usedQty = dispositions
        .filter((d: any) => d.status === "USE")
        .reduce((sum: number, d: any) => sum + d.quantity, 0);
      
      const totalAllocated = receivedQty + trashedQty + usedQty;
      const manifested = Math.max(0, totalInventory - totalAllocated);
      const availableToList = Math.max(0, receivedQty - postedListings);
      
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
        // Disposition quantities
        receivedQuantity: receivedQty,
        trashedQuantity: trashedQty,
        usedQuantity: usedQty,
        manifestedQuantity: manifested,
        dispositions: it.dispositions, // Include full disposition records
      };
    });

    // Apply filtering after calculating counts
    let filteredItems = itemsWithUnit;
    
    // Filter by status if requested
    if (statusParam && statusParam !== "ALL") {
      if (statusParam === "MANIFESTED") {
        filteredItems = filteredItems.filter(item => item.manifestedQuantity > 0);
      } else if (statusParam === "RECEIVED") {
        filteredItems = filteredItems.filter(item => item.receivedQuantity > 0);
      } else if (statusParam === "TRASH") {
        filteredItems = filteredItems.filter(item => item.trashedQuantity > 0);
      } else if (statusParam === "USE") {
        filteredItems = filteredItems.filter(item => item.usedQuantity > 0);
      }
    }
    
    // Filter by in-stock if requested
    if (inStockParam === "true") {
      filteredItems = filteredItems.filter(item => item.receivedQuantity > 0);
    }
    
    // availableOnlyParam=true means "show only items available to list" (availableToList > 0)
    if (availableOnlyParam === "true") {
      filteredItems = filteredItems.filter(item => item.availableToList > 0);
    }

    // Calculate total count after filtering
    const totalFilteredCount = filteredItems.length;

    // Apply pagination to filtered results
    const startIndex = skip;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Calculate status counts from the items - sum quantities, not count items
    const statusCounts = {
      MANIFESTED: itemsWithUnit.reduce((sum, item) => sum + (item.manifestedQuantity || 0), 0),
      RECEIVED: itemsWithUnit.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
      TRASH: itemsWithUnit.reduce((sum, item) => sum + (item.trashedQuantity || 0), 0),
      USE: itemsWithUnit.reduce((sum, item) => sum + (item.usedQuantity || 0), 0),
    };

    return NextResponse.json({
      success: true,
      items: paginatedItems,
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


