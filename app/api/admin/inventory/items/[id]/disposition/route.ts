import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET endpoint to retrieve all dispositions for an inventory item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;

    const dispositions = await prisma.inventoryDisposition.findMany({
      where: { inventoryItemId: itemId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dispositions });
  } catch (error) {
    console.error("Error fetching dispositions:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispositions" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to set or update a disposition status for an inventory item
 * This allows splitting items into different statuses (e.g., 1 RECEIVED, 1 TRASH, 1 USE)
 * 
 * Body parameters:
 * - status: "RECEIVED" | "TRASH" | "USE"
 * - quantity: Number of units to set to this status
 * - notes: Optional notes about this disposition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;
    const body = await request.json();
    
    // Validate status
    const status = body?.status;
    if (!status || !["RECEIVED", "TRASH", "USE"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'RECEIVED', 'TRASH', or 'USE'" },
        { status: 400 }
      );
    }

    // Validate quantity
    const quantity = parseInt(body?.quantity ?? 0, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 }
      );
    }

    const notes = body?.notes || null;

    // Fetch the item and current dispositions
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { dispositions: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const totalQty = item.quantity ?? 0;
    
    // Calculate total allocated
    const currentlyAllocated = item.dispositions.reduce(
      (sum, d) => sum + d.quantity,
      0
    );
    
    const available = totalQty - currentlyAllocated;

    if (quantity > available) {
      return NextResponse.json(
        { 
          error: `Cannot allocate ${quantity}. Only ${available} available (${totalQty} total, ${currentlyAllocated} already allocated).` 
        },
        { status: 400 }
      );
    }

    // Check if there's already a disposition with this status
    const existingDisposition = item.dispositions.find(d => d.status === status);

    let result;
    if (existingDisposition) {
      // Update existing disposition quantity
      result = await prisma.inventoryDisposition.update({
        where: { id: existingDisposition.id },
        data: {
          quantity: existingDisposition.quantity + quantity,
          notes: notes || existingDisposition.notes,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new disposition
      result = await prisma.inventoryDisposition.create({
        data: {
          inventoryItemId: itemId,
          status,
          quantity,
          notes,
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      disposition: result,
      message: `${quantity} unit(s) marked as ${status}`
    });
  } catch (error) {
    console.error("Error setting disposition:", error);
    return NextResponse.json(
      { error: "Failed to set disposition" },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update a specific disposition's quantity
 * This allows changing quantities or moving items between statuses
 * 
 * Body parameters:
 * - status: "RECEIVED" | "TRASH" | "USE" - The status to update
 * - quantity: New total quantity for this status
 * - notes: Optional notes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;
    const body = await request.json();
    
    // Validate status
    const status = body?.status;
    if (!status || !["RECEIVED", "TRASH", "USE"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'RECEIVED', 'TRASH', or 'USE'" },
        { status: 400 }
      );
    }

    // Validate quantity
    const newQuantity = parseInt(body?.quantity ?? 0, 10);
    if (!Number.isFinite(newQuantity) || newQuantity < 0) {
      return NextResponse.json(
        { error: "quantity must be a non-negative integer" },
        { status: 400 }
      );
    }

    const notes = body?.notes;

    // Fetch the item and current dispositions
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { dispositions: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const totalQty = item.quantity ?? 0;
    
    // Find the disposition for this status
    const targetDisposition = item.dispositions.find(d => d.status === status);
    const currentQuantityForStatus = targetDisposition?.quantity ?? 0;
    
    // Calculate total allocated to OTHER statuses (excluding the target status)
    const totalAllocatedToOthers = item.dispositions
      .filter(d => d.status !== status)
      .reduce((sum, d) => sum + d.quantity, 0);
    
    // The max we can allocate to this status is the total quantity minus what's allocated to other statuses
    const maxAllowedForThisStatus = totalQty - totalAllocatedToOthers;
    
    // Check if the new quantity exceeds what we can allocate
    if (newQuantity > totalQty) {
      return NextResponse.json(
        { 
          error: `Cannot set ${status} to ${newQuantity}. Total quantity is only ${totalQty}.` 
        },
        { status: 400 }
      );
    }
    
    // Calculate how much we need to deallocate from other statuses
    const neededChange = newQuantity - currentQuantityForStatus;
    const totalAllocated = item.dispositions.reduce((sum, d) => sum + d.quantity, 0);
    const manifestedQty = totalQty - totalAllocated;

    // If we need more than what's manifested, we need to deallocate from other statuses
    if (neededChange > manifestedQty) {
      const needToDeallocate = neededChange - manifestedQty;
      
      // Deallocate from other statuses (FIFO - first status with quantity)
      let remainingToDeallocate = needToDeallocate;
      
      for (const disp of item.dispositions) {
        if (disp.status !== status && remainingToDeallocate > 0) {
          const canTakeFromThis = Math.min(disp.quantity, remainingToDeallocate);
          
          if (canTakeFromThis === disp.quantity) {
            // Delete this disposition entirely
            await prisma.inventoryDisposition.delete({
              where: { id: disp.id },
            });
          } else {
            // Reduce this disposition
            await prisma.inventoryDisposition.update({
              where: { id: disp.id },
              data: {
                quantity: disp.quantity - canTakeFromThis,
                updatedAt: new Date(),
              },
            });
          }
          
          remainingToDeallocate -= canTakeFromThis;
        }
      }
    }

    let result;

    if (newQuantity === 0) {
      // Remove the disposition if quantity is 0
      if (targetDisposition) {
        await prisma.inventoryDisposition.delete({
          where: { id: targetDisposition.id },
        });
      }
      result = null;
    } else if (targetDisposition) {
      // Update existing disposition
      result = await prisma.inventoryDisposition.update({
        where: { id: targetDisposition.id },
        data: {
          quantity: newQuantity,
          notes: notes !== undefined ? notes : targetDisposition.notes,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new disposition
      result = await prisma.inventoryDisposition.create({
        data: {
          inventoryItemId: itemId,
          status,
          quantity: newQuantity,
          notes,
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      disposition: result,
      message: newQuantity === 0 
        ? `${status} status cleared`
        : `${status} quantity set to ${newQuantity}`
    });
  } catch (error) {
    console.error("Error updating disposition:", error);
    return NextResponse.json(
      { error: "Failed to update disposition" },
      { status: 500 }
    );
  }
}
