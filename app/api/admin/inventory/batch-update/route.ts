import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const { listId, items } = await request.json();
    
    if (!listId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "listId and items array are required" },
        { status: 400 }
      );
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
