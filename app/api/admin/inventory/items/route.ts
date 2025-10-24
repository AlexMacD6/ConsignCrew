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
    const unlistedOnlyParam = searchParams.get("unlistedOnly"); // Filter for items not yet listed
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

    // Fetch all items
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
          InventoryDisposition: {
            select: { 
              id: true,
              status: true, 
              quantity: true, 
              notes: true,
              createdAt: true,
              createdBy: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { description: "asc" }],
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Include unitPurchasePrice, listing counts, and disposition quantities
    const itemsWithUnit = items.map((it: any) => {
      const postedListings = it.listings?.length || 0;
      const totalInventory = it.quantity || 0;
      const availableToList = Math.max(0, totalInventory - postedListings);
      
      // Calculate quantities from InventoryDisposition records
      const dispositions = it.InventoryDisposition || [];
      const receivedQty = dispositions
        .filter((d: any) => d.status === "RECEIVED")
        .reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);
      const trashedQty = dispositions
        .filter((d: any) => d.status === "TRASH")
        .reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);
      const usedQty = dispositions
        .filter((d: any) => d.status === "USE")
        .reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);
      
      // Calculate manifested quantity (total - all dispositions)
      const totalDispositioned = receivedQty + trashedQty + usedQty;
      const manifestedQty = Math.max(0, totalInventory - totalDispositioned);
      
      // Determine primary status (what state most of the inventory is in)
      let primaryStatus = "MANIFESTED"; // Default if no dispositions
      if (receivedQty > 0 && receivedQty >= manifestedQty && receivedQty >= trashedQty && receivedQty >= usedQty) {
        primaryStatus = "RECEIVED";
      } else if (trashedQty > 0 && trashedQty >= manifestedQty && trashedQty >= receivedQty && trashedQty >= usedQty) {
        primaryStatus = "TRASH";
      } else if (usedQty > 0 && usedQty >= manifestedQty && usedQty >= receivedQty && usedQty >= trashedQty) {
        primaryStatus = "USE";
      }
      
      return {
        ...it,
        quantity: availableToList,
        totalQuantity: totalInventory,
        unitPurchasePrice:
          typeof it.purchasePrice === "number" && typeof totalInventory === "number" && totalInventory > 0
            ? it.purchasePrice / totalInventory
            : null,
        postedListings,
        availableToList,
        totalInventory,
        // Add calculated disposition quantities
        receivedQuantity: receivedQty,
        trashedQuantity: trashedQty,
        usedQuantity: usedQty,
        manifestedQuantity: manifestedQty,
        primaryStatus, // PRIMARY, RECEIVED, TRASH, USE
      };
    });

    // Apply filtering after calculating counts
    let filteredItems = itemsWithUnit;
    
    // Filter by status if requested (using calculated quantities from InventoryDisposition)
    if (statusParam && statusParam !== "ALL") {
      if (statusParam === "MANIFESTED") {
        // Show items with manifested quantity > 0
        filteredItems = filteredItems.filter(item => item.manifestedQuantity > 0);
      } else if (statusParam === "RECEIVED") {
        // Show items with received quantity > 0
        filteredItems = filteredItems.filter(item => item.receivedQuantity > 0);
      } else if (statusParam === "TRASH") {
        // Show items with trashed quantity > 0
        filteredItems = filteredItems.filter(item => item.trashedQuantity > 0);
      } else if (statusParam === "USE") {
        // Show items with used quantity > 0
        filteredItems = filteredItems.filter(item => item.usedQuantity > 0);
      }
    }
    
    // Filter by in-stock if requested (items with RECEIVED quantity)
    if (inStockParam === "true") {
      filteredItems = filteredItems.filter(item => item.receivedQuantity > 0);
    }
    
    // availableOnlyParam=true means "show only items available to list" (availableToList > 0)
    if (availableOnlyParam === "true") {
      filteredItems = filteredItems.filter(item => item.availableToList > 0);
    }
    
    // unlistedOnlyParam=true means "show only items that haven't been listed yet" (postedListings === 0)
    if (unlistedOnlyParam === "true") {
      filteredItems = filteredItems.filter(item => item.postedListings === 0);
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


