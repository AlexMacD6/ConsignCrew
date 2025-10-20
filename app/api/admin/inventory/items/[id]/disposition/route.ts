import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST endpoint to mark an inventory item with a disposition (TRASH or USE)
 * This endpoint allows tracking items that are:
 * - TRASH: Disposed of (damaged, unsellable)
 * - USE: Kept for personal/business use (subject to use tax)
 * 
 * The disposition is tracked separately from receiving status to maintain
 * accurate inventory reconciliation and tax reporting.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;
    const body = await request.json();
    
    // Validate disposition type
    const disposition = body?.disposition;
    if (!disposition || !["TRASH", "USE"].includes(disposition)) {
      return NextResponse.json(
        { error: "disposition must be 'TRASH' or 'USE'" },
        { status: 400 }
      );
    }

    // Validate quantity
    const dispositionQty = parseInt(body?.quantity ?? 0, 10);
    if (!Number.isFinite(dispositionQty) || dispositionQty <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Optional notes about the disposition
    const dispositionNotes = body?.notes || null;

    // Fetch the item
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Calculate available quantity for disposition
    const totalQty = item.quantity ?? 0;
    const alreadyReceived = item.receivedQuantity ?? 0;
    const alreadyDispositioned = item.dispositionQuantity ?? 0;
    const available = Math.max(totalQty - alreadyReceived - alreadyDispositioned, 0);

    if (dispositionQty > available) {
      return NextResponse.json(
        { 
          error: `Cannot disposition ${dispositionQty}. Only ${available} available (${totalQty} total, ${alreadyReceived} received, ${alreadyDispositioned} already dispositioned).` 
        },
        { status: 400 }
      );
    }

    // Update the item with disposition
    const newDispositionTotal = alreadyDispositioned + dispositionQty;
    const newReceived = alreadyReceived; // Don't change received quantity
    
    // Determine new receive status based on total accounted items
    const totalAccounted = newReceived + newDispositionTotal;
    let newStatus: "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED" = "MANIFESTED";
    if (totalAccounted <= 0) newStatus = "MANIFESTED";
    else if (totalAccounted < totalQty) newStatus = "PARTIALLY_RECEIVED";
    else newStatus = "RECEIVED"; // Consider "received" when all items are accounted for (including dispositions)

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        disposition,
        dispositionQuantity: newDispositionTotal,
        dispositionAt: new Date(),
        dispositionBy: session.user.id,
        dispositionNotes,
        receiveStatus: newStatus,
      },
    });

    return NextResponse.json({ 
      success: true, 
      item: updated,
      message: `${dispositionQty} unit(s) marked as ${disposition}`
    });
  } catch (error) {
    console.error("Error setting item disposition:", error);
    return NextResponse.json(
      { error: "Failed to set disposition" },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update/change an inventory item's disposition
 * This allows changing the disposition type (RECEIVED, TRASH, USE) after initial processing
 * 
 * Body parameters:
 * - disposition: "RECEIVED" | "TRASH" | "USE" (null/"RECEIVED" means normal received, not disposed)
 * - quantity: Optional number of units to change (defaults to all received if not provided)
 * - notes: Optional notes about the change
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;
    const body = await request.json();
    
    // Validate disposition type - null or "RECEIVED" means clear disposition
    const disposition = body?.disposition;
    if (disposition && !["RECEIVED", "TRASH", "USE"].includes(disposition)) {
      return NextResponse.json(
        { error: "disposition must be 'RECEIVED', 'TRASH', or 'USE'" },
        { status: 400 }
      );
    }

    // Optional notes about the disposition change
    const dispositionNotes = body?.notes || null;

    // Optional quantity - how many units to change
    const changeQuantity = body?.quantity ? parseInt(body.quantity, 10) : null;
    if (changeQuantity !== null && (!Number.isFinite(changeQuantity) || changeQuantity <= 0)) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Fetch the item
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const receivedQty = item.receivedQuantity || 0;
    const currentDispositionQty = item.dispositionQuantity || 0;

    // Determine how many units to affect
    const qtyToChange = changeQuantity !== null ? changeQuantity : receivedQty;

    // Validate quantity doesn't exceed received
    if (qtyToChange > receivedQty) {
      return NextResponse.json(
        { error: `Cannot change ${qtyToChange} units. Only ${receivedQty} received.` },
        { status: 400 }
      );
    }

    // Prepare update data based on disposition
    let updateData: any = {
      dispositionAt: new Date(),
      dispositionBy: session.user.id,
    };

    if (disposition === "RECEIVED" || !disposition) {
      // Moving back to RECEIVED - reduce or clear disposition quantity
      const newDispositionQty = Math.max(0, currentDispositionQty - qtyToChange);
      
      updateData.dispositionQuantity = newDispositionQty;
      
      // If no more units are dispositioned, clear disposition entirely
      if (newDispositionQty === 0) {
        updateData.disposition = null;
        updateData.dispositionNotes = null;
      }
    } else {
      // Set TRASH or USE disposition
      updateData.disposition = disposition;
      
      // If current disposition is same type, don't change quantity (just update notes)
      // If different type or no disposition, set to the specified quantity
      if (item.disposition === disposition) {
        // Same disposition - add to existing quantity if specified
        updateData.dispositionQuantity = changeQuantity !== null 
          ? Math.min(receivedQty, currentDispositionQty + qtyToChange)
          : receivedQty;
      } else {
        // Different or no disposition - set to new quantity
        updateData.dispositionQuantity = qtyToChange;
      }
      
      updateData.dispositionNotes = dispositionNotes;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    let message = "";
    if (disposition === "RECEIVED" || !disposition) {
      message = `${qtyToChange} unit(s) moved back to RECEIVED (normal)`;
    } else {
      message = `${qtyToChange} unit(s) marked as ${disposition}`;
    }

    return NextResponse.json({ 
      success: true, 
      item: updated,
      message
    });
  } catch (error) {
    console.error("Error updating item disposition:", error);
    return NextResponse.json(
      { error: "Failed to update disposition" },
      { status: 500 }
    );
  }
}

