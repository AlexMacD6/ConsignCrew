import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, winningBidAmount, serviceCharges, shippingCharges, totalPurchasePrice, totalExtRetailValue, msrpPercentage } = await request.json();

    // Handle name update (existing functionality)
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name is required and must be a non-empty string" },
          { status: 400 }
        );
      }

      const updatedList = await prisma.inventoryList.update({
        where: { id },
        data: { name: name.trim() },
      });

      return NextResponse.json({
        success: true,
        list: updatedList,
      });
    }

    // Handle financial data update (new functionality)
    if (winningBidAmount !== undefined || serviceCharges !== undefined || shippingCharges !== undefined || 
        totalPurchasePrice !== undefined || totalExtRetailValue !== undefined || msrpPercentage !== undefined) {
      
      const updateData: any = {};
      
      if (winningBidAmount !== undefined) updateData.winningBidAmount = winningBidAmount;
      if (serviceCharges !== undefined) updateData.serviceCharges = serviceCharges;
      if (shippingCharges !== undefined) updateData.shippingCharges = shippingCharges;
      if (totalPurchasePrice !== undefined) updateData.totalPurchasePrice = totalPurchasePrice;
      if (totalExtRetailValue !== undefined) updateData.totalExtRetailValue = totalExtRetailValue;
      if (msrpPercentage !== undefined) updateData.msrpPercentage = msrpPercentage;

      const updatedList = await prisma.inventoryList.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        list: updatedList,
      });
    }

    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error updating inventory list:", error);
    return NextResponse.json(
      { error: "Failed to update inventory list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.inventoryList.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Inventory list deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inventory list:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory list" },
      { status: 500 }
    );
  }
}
