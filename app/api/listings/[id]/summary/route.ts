import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update listing summary information (status, pricing, transaction details)
 * PATCH /api/listings/[id]/summary
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // id contains the itemId value
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the listing to verify ownership and include inventory data (using itemId field in database)
    const listing = await prisma.listing.findUnique({
      where: { itemId: id }, // id from URL parameter is actually the itemId
      select: {
        id: true,
        userId: true,
        status: true,
        purchasePrice: true,
        inventoryItems: {
          select: {
            id: true,
            purchasePrice: true,
            quantity: true,
            unitRetail: true,
            description: true
          }
        }
      }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify ownership
    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const {
      status,
      transactionPrice,
      paymentMethod,
      salesTax,
      taxRate,
      dateSold,
      comments,
      fulfillmentMethod
    } = await request.json();

    // Calculate purchase price from inventory if not already set
    let calculatedPurchasePrice = null; // listing.purchasePrice; // Commented out until migration runs
    if (!calculatedPurchasePrice && listing.inventoryItems.length > 0) {
      const inventoryItem = listing.inventoryItems[0]; // Take the first linked inventory item
      if (inventoryItem.purchasePrice && inventoryItem.quantity && inventoryItem.quantity > 0) {
        calculatedPurchasePrice = inventoryItem.purchasePrice / inventoryItem.quantity;
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    // Set purchase price from inventory calculation if not already set
    if (calculatedPurchasePrice && !listing.purchasePrice) {
      updateData.purchasePrice = calculatedPurchasePrice;
    }
    
    // Transaction tracking fields
    if (transactionPrice !== undefined) {
      updateData.transactionPrice = transactionPrice;
    }
    
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }
    
    if (salesTax !== undefined) {
      updateData.salesTax = salesTax;
    }
    
    if (taxRate !== undefined) {
      updateData.taxRate = taxRate;
    }
    
    if (dateSold !== undefined) {
      updateData.soldAt = new Date(dateSold);
    }
    
    if (comments !== undefined) {
      updateData.comments = comments;
    }
    
    if (fulfillmentMethod !== undefined) {
      updateData.fulfillmentMethod = fulfillmentMethod;
    }

    // Update the listing using itemId and include inventory data in response
    const updatedListing = await prisma.listing.update({
      where: { itemId: id },
      data: updateData,
      include: {
        inventoryItems: {
          select: {
            id: true,
            purchasePrice: true,
            quantity: true,
            unitRetail: true,
            description: true
          }
        }
      }
    });

    // Create a history event for significant changes
    if (status && status !== listing.status) {
      await prisma.listingHistory.create({
        data: {
          listingId: listing.id,
          eventType: 'STATUS_CHANGED',
          eventTitle: `Status changed to ${status}`,
          description: `Listing status updated from ${listing.status} to ${status}`,
          metadata: {
            previousStatus: listing.status,
            newStatus: status,
            updatedBy: session.user.id,
            transactionPrice,
            paymentMethod,
            salesTax
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing summary updated successfully'
    });

  } catch (error) {
    console.error('Error updating listing summary:', error);
    return NextResponse.json(
      { error: 'Failed to update listing summary' },
      { status: 500 }
    );
  }
}
