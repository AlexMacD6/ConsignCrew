import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;
    const body = await request.json();
    const receiveQty = parseInt(body?.quantity ?? 0, 10);
    const override = body?.override === true; // Allow override for out-of-order receiving
    
    if (!Number.isFinite(receiveQty) || receiveQty <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Fetch item with listing count to check if items have been posted
    const item = await prisma.inventoryItem.findUnique({ 
      where: { id: itemId },
      include: {
        listings: {
          select: { id: true, status: true },
          where: { status: "active" }
        }
      }
    });
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const totalQty = item.quantity ?? 0;
    const alreadyReceived = item.receivedQuantity ?? 0;
    const postedListings = item.listings?.length || 0;
    
    // Calculate remaining considering both received and posted items
    const remaining = Math.max(totalQty - alreadyReceived, 0);
    
    // If no override and trying to receive more than remaining, check if items are posted
    if (!override && receiveQty > remaining) {
      // If items are posted but not received, suggest override
      if (postedListings > 0 && alreadyReceived === 0) {
        return NextResponse.json(
          { 
            error: `Cannot receive ${receiveQty}. Only ${remaining} remaining. However, ${postedListings} item(s) have been posted but not received. Use override to receive out of order.`,
            requiresOverride: true,
            postedCount: postedListings
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Cannot receive ${receiveQty}. Only ${remaining} remaining.` },
        { status: 400 }
      );
    }
    
    // With override, allow receiving even if it exceeds "available" due to posted items
    // But still don't exceed the total quantity
    const maxAllowedWithOverride = totalQty - alreadyReceived;
    if (receiveQty > maxAllowedWithOverride) {
      return NextResponse.json(
        { error: `Cannot receive ${receiveQty}. Maximum ${maxAllowedWithOverride} can be received (total: ${totalQty}, already received: ${alreadyReceived}).` },
        { status: 400 }
      );
    }

    const newReceived = alreadyReceived + receiveQty;
    let newStatus: "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED" = "MANIFESTED";
    if (newReceived <= 0) newStatus = "MANIFESTED";
    else if (newReceived < totalQty) newStatus = "PARTIALLY_RECEIVED";
    else newStatus = "RECEIVED";

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        receivedQuantity: newReceived,
        receiveStatus: newStatus,
        receivedAt: new Date(),
        receivedBy: session.user.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      item: updated,
      warning: override ? "Item received out of order (after posting)" : undefined
    });
  } catch (error) {
    console.error("Error receiving inventory item:", error);
    return NextResponse.json(
      { error: "Failed to receive item" },
      { status: 500 }
    );
  }
}


