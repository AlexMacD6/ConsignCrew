import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Immediately cleanup expired checkout sessions and push listings back to active
 * This is called when the frontend detects an expired session
 * 
 * POST /api/checkout/cleanup-expired
 * Body: { orderId: string }
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

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('Cleanup expired: Processing order:', orderId, 'for user:', session.user.id);

    // Fetch the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        buyerId: session.user.id 
      },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            isHeld: true,
            heldUntil: true,
          }
        }
      }
    });

    if (!order) {
      console.log('Cleanup expired: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order is actually expired or if this is a manual cancellation
    const now = new Date();
    const orderExpiry = new Date(order.checkoutExpiresAt);
    const isExpired = now > orderExpiry;
    
    // Allow cleanup for expired orders OR manual cancellations of pending orders
    const canCleanup = isExpired || order.status === 'PENDING';
    
    if (!canCleanup) {
      return NextResponse.json(
        { error: 'Order cannot be cleaned up' },
        { status: 400 }
      );
    }

    // Check if order is in a state that can be cleaned up
    if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: `Order status '${order.status}' cannot be cleaned up` },
        { status: 400 }
      );
    }
    
    // If order is already cancelled, just update the listing status
    if (order.status === 'CANCELLED') {
      console.log('Cleanup expired: Order already cancelled, just updating listing status');
      
      // Check if this is a multi-item order
      const priceBreakdown = (order as any).shippingAddress?.priceBreakdown;
      const isMultiItem = priceBreakdown?.isMultiItem;
      const items = priceBreakdown?.items || [];

      if (isMultiItem && items.length > 1) {
        // Update all listings in multi-item order
        for (const item of items) {
          await prisma.listing.update({
            where: { id: item.listingId },
            data: {
              status: 'active',
              isHeld: false,
              heldUntil: null,
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Update single listing
        await prisma.listing.update({
          where: { id: order.listing.id },
          data: {
            status: 'active',
            isHeld: false,
            heldUntil: null,
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Listing status updated for already cancelled order',
        orderId: order.id,
        listingId: order.listing.id,
        newOrderStatus: order.status,
        newListingStatus: 'active',
        restoredToCart: false
      });
    }

    console.log('Cleanup expired: Order is expired or cancelled, cleaning up...');

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the order to cancelled status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Check if this is a multi-item order and update all listings
      const priceBreakdown = (updatedOrder as any).shippingAddress?.priceBreakdown;
      const isMultiItem = priceBreakdown?.isMultiItem;
      const items = priceBreakdown?.items || [];

      let updatedListing;
      if (isMultiItem && items.length > 1) {
        // Update all listings in multi-item order
        for (const item of items) {
          await tx.listing.update({
            where: { id: item.listingId },
            data: {
              status: 'active',
              isHeld: false,
              heldUntil: null,
              updatedAt: new Date(),
            },
          });
        }
        // For response, use the first listing
        updatedListing = await tx.listing.findUnique({
          where: { id: order.listing.id }
        });
      } else {
        // Update single listing
        updatedListing = await tx.listing.update({
          where: { id: order.listing.id },
          data: {
            status: 'active',
            isHeld: false,
            heldUntil: null,
            updatedAt: new Date(),
          },
        });
      }

      // If this order came from cart (has price breakdown in shippingAddress), 
      // restore the items to the user's cart
      // Note: priceBreakdown is already available from above
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

        // Restore all items to cart
        if (isMultiItem && items.length > 1) {
          // Restore multiple items
          for (const item of items) {
            // Check if item is already in cart (shouldn't be, but just in case)
            const existingCartItem = await tx.cartItem.findUnique({
              where: {
                cartId_listingId: {
                  cartId: cart.id,
                  listingId: item.listingId,
                },
              },
            });

            if (!existingCartItem) {
              await tx.cartItem.create({
                data: {
                  cartId: cart.id,
                  listingId: item.listingId,
                  quantity: item.quantity,
                },
              });
            }
          }
          restoredToCart = true;
        } else {
          // Restore single item
          const existingCartItem = await tx.cartItem.findUnique({
            where: {
              cartId_listingId: {
                cartId: cart.id,
                listingId: order.listing.id,
              },
            },
          });

          if (!existingCartItem) {
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
      }

      return { updatedOrder, updatedListing, restoredToCart };
    });

    console.log('Cleanup expired: Successfully cleaned up session:', {
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newOrderStatus: result.updatedOrder.status,
      newListingStatus: result.updatedListing.status,
      restoredToCart: result.restoredToCart
    });

    return NextResponse.json({
      success: true,
      message: result.restoredToCart 
        ? 'Session cleaned up and item restored to cart'
        : 'Session cleaned up successfully',
      orderId: result.updatedOrder.id,
      listingId: result.updatedListing.id,
      newOrderStatus: result.updatedOrder.status,
      newListingStatus: result.updatedListing.status,
      restoredToCart: result.restoredToCart
    });

  } catch (error) {
    console.error('Error cleaning up expired session:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired session' },
      { status: 500 }
    );
  }
}
