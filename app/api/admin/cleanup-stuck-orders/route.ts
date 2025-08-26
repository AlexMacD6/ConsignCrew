import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to cleanup stuck orders and restore items to active status
 * This is useful for orders that got stuck in processing status
 * 
 * POST /api/admin/cleanup-stuck-orders
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may need to adjust this based on your auth system)
    // For now, we'll allow any authenticated user to cleanup their own orders
    
    // Find all pending orders older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const stuckOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: fifteenMinutesAgo
        },
        // Only cleanup current user's orders (for safety)
        buyerId: session.user.id
      },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            isHeld: true,
            itemId: true,
            title: true
          }
        }
      }
    });

    console.log(`Found ${stuckOrders.length} stuck orders for user ${session.user.id}`);

    const cleanupResults = [];

    for (const order of stuckOrders) {
      try {
        // Use a transaction to cleanup each order
        const result = await prisma.$transaction(async (tx) => {
          // Update the order to cancelled status
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              updatedAt: new Date(),
            },
          });

          // Update the listing to active status and remove hold
          const updatedListing = await tx.listing.update({
            where: { id: order.listing.id },
            data: {
              status: 'active',
              isHeld: false,
              heldUntil: null,
              updatedAt: new Date(),
            },
          });

          // If this order came from cart, restore to cart
          const priceBreakdown = (order as any).shippingAddress?.priceBreakdown;
          let restoredToCart = false;
          
          if (priceBreakdown) {
            // Get or create the user's cart
            let cart = await tx.cart.findUnique({
              where: { userId: session.user.id },
            });

            if (!cart) {
              cart = await tx.cart.create({
                data: { userId: session.user.id },
              });
            }

            // Check if item is already in cart
            const existingCartItem = await tx.cartItem.findUnique({
              where: {
                cartId_listingId: {
                  cartId: cart.id,
                  listingId: order.listing.id,
                },
              },
            });

            if (!existingCartItem) {
              // Add the item back to cart
              await tx.cartItem.create({
                data: {
                  cartId: cart.id,
                  listingId: order.listing.id,
                  quantity: 1,
                },
              });
              restoredToCart = true;
            }
          }

          return { updatedOrder, updatedListing, restoredToCart };
        });

        cleanupResults.push({
          orderId: order.id,
          listingId: order.listing.id,
          listingTitle: order.listing.title,
          listingItemId: order.listing.itemId,
          restoredToCart: result.restoredToCart,
          success: true
        });

        console.log(`Cleaned up stuck order ${order.id} for listing ${order.listing.itemId}`);

      } catch (error) {
        console.error(`Failed to cleanup order ${order.id}:`, error);
        cleanupResults.push({
          orderId: order.id,
          listingId: order.listing.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanupResults.filter(r => r.success).length} stuck orders`,
      cleanupResults,
      totalFound: stuckOrders.length,
      totalCleaned: cleanupResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Error cleaning up stuck orders:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup stuck orders' },
      { status: 500 }
    );
  }
}
