import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['purchasePrice', 'extRetail'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If extRetail is not provided but unitRetail and quantity are, calculate it
    if (body.unitRetail !== undefined && body.quantity !== undefined) {
      updateData.extRetail = body.unitRetail * body.quantity;
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}
