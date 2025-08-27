import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/inventory/search - Get inventory items for listing selection
 * Query params: 
 * - lotDescription: filter by inventory list brief description
 * - vendor: filter by vendor  
 * - department: filter by department
 * - limit: number of results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lotDescription = searchParams.get("lotDescription");
    const vendor = searchParams.get("vendor");
    const department = searchParams.get("department");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build filter conditions
    const whereConditions: any = {};
    if (lotDescription && lotDescription !== "all") {
      whereConditions.list = { 
        briefDescription: { equals: lotDescription, mode: "insensitive" }
      };
    }
    if (vendor && vendor !== "all") {
      whereConditions.vendor = { equals: vendor, mode: "insensitive" };
    }
    if (department && department !== "all") {
      whereConditions.department = { equals: department, mode: "insensitive" };
    }

    // Get inventory items and compute unitPurchasePrice (purchasePrice/quantity)
    const rawItems = await prisma.inventoryItem.findMany({
      where: whereConditions,
      select: {
        id: true,
        lotNumber: true,
        itemNumber: true,
        deptCode: true,
        department: true,
        description: true,
        quantity: true,
        unitRetail: true,
        extRetail: true,
        vendor: true,
        categoryCode: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        purchasePrice: true,
        // Include listings to calculate available quantity
        listings: {
          select: {
            id: true,
            status: true
          }
        },
        // Exclude purchasePrice from selection
        list: {
          select: {
            id: true,
            name: true,
            briefDescription: true,
            datePurchased: true,
            lotNumber: true,
          }
        }
      },
      orderBy: [
        { updatedAt: "desc" },
        { description: "asc" }
      ],
      take: limit,
    });

    // Map to include unitPurchasePrice, available quantity, and hide purchasePrice
    const items = rawItems.map((it: any) => {
      // Only count active listings (not sold, cancelled, etc.)
      const activeListings = it.listings?.filter((listing: any) => 
        listing.status === 'active' || listing.status === 'processing'
      ) || [];
      const postedListings = activeListings.length;
      const totalQuantity = it.quantity || 0;
      const availableQuantity = Math.max(0, totalQuantity - postedListings);
      
      return {
        ...it,
        quantity: availableQuantity, // Override with available quantity for listing
        totalQuantity, // Keep original quantity for reference
        postedListings,
        unitPurchasePrice:
          typeof it.purchasePrice === 'number' && typeof totalQuantity === 'number' && totalQuantity > 0
            ? it.purchasePrice / totalQuantity
            : null,
        purchasePrice: undefined,
        listings: undefined, // Remove listings from response for cleaner data
      };
    });

    // Get unique values for filters
    const allItems = await prisma.inventoryItem.findMany({
      select: {
        vendor: true,
        department: true,
        list: {
          select: {
            briefDescription: true,
          }
        }
      },
    });

    const vendors = [...new Set(allItems.map(item => item.vendor).filter(Boolean))].sort();
    const departments = [...new Set(allItems.map(item => item.department).filter(Boolean))].sort();
    const lotDescriptions = [...new Set(allItems.map(item => item.list?.briefDescription).filter(Boolean))].sort();

    return NextResponse.json({ 
      success: true, 
      items,
      count: items.length,
      filters: {
        vendors,
        departments,
        lotDescriptions
      }
    });
    
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
