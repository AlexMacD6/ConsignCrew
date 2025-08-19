import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const { listId, items } = await request.json();
    
    console.log('Batch update request:', { listId, itemsCount: items?.length });
    
    if (!listId || !Array.isArray(items)) {
      console.error('Batch update validation failed:', { listId, items: typeof items });
      return NextResponse.json(
        { error: "listId and items array are required" },
        { status: 400 }
      );
    }
    
    if (items.length === 0) {
      console.warn('Batch update called with empty items array');
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No items to update"
      });
    }

    // Use Prisma's transaction to update all items at once
    const result = await prisma.$transaction(
      items.map((item: any) =>
        prisma.inventoryItem.update({
          where: { id: item.id },
          data: { 
            purchasePrice: item.purchasePrice,
            extRetail: item.extRetail 
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.length,
      message: `Updated ${result.length} inventory items`
    });
  } catch (error) {
    console.error("Error batch updating inventory items:", error);
    return NextResponse.json(
      { error: "Failed to batch update inventory items" },
      { status: 500 }
    );
  }
}
