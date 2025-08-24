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
    if (!Number.isFinite(receiveQty) || receiveQty <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const totalQty = item.quantity ?? 0;
    const alreadyReceived = item.receivedQuantity ?? 0;
    const remaining = Math.max(totalQty - alreadyReceived, 0);
    if (receiveQty > remaining) {
      return NextResponse.json(
        { error: `Cannot receive ${receiveQty}. Only ${remaining} remaining.` },
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

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error receiving inventory item:", error);
    return NextResponse.json(
      { error: "Failed to receive item" },
      { status: 500 }
    );
  }
}


