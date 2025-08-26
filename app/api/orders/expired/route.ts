import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Handle expired orders - detect, cleanup, and restore to cart
 * 
 * GET /api/orders/expired - Get user's expired orders
 * POST /api/orders/expired/restore - Restore expired orders back to cart
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find all expired PENDING orders for this user
    const now = new Date();
    
    const expiredOrders = await prisma.order.findMany({
      where: {
        buyerId: session.user.id,
        status: 'PENDING',
        checkoutExpiresAt: {
          lt: now // Expired orders only
        }
      },
      include: {
        listing: {
          select: {
            id: true,
            itemId: true,
            title: true,
            photos: true,
            status: true,
            isHeld: true,
            price: true,
            salePrice: true,
            salePriceEffectiveDate: true,
            discountSchedule: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check which listings are still available (not sold/processing)
    const availableExpiredOrders = expiredOrders.filter(order => 
      order.listing.status === 'active' || 
      (order.listing.status === 'processing' && order.listing.isHeld)
    );

    // Format the response
    const formattedOrders = availableExpiredOrders.map(order => {
      const expiredMinutes = Math.floor((now.getTime() - new Date(order.checkoutExpiresAt).getTime()) / 1000 / 60);
      
      // Check if order is multi-item
      const priceBreakdown = (order as any).shippingAddress?.priceBreakdown;
      const isMultiItem = priceBreakdown?.isMultiItem;
      const items = priceBreakdown?.items || [];

      return {
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt,
        expiredAt: order.checkoutExpiresAt,
        expiredMinutesAgo: expiredMinutes,
        isMultiItem,
        itemCount: isMultiItem ? items.length : 1,
        items: isMultiItem ? items : [{
          listingId: order.listing.id,
          listingItemId: order.listing.itemId,
          title: order.listing.title,
          photos: order.listing.photos,
          price: order.listing.price,
          salePrice: order.listing.salePrice
        }],
        // Single item fallback
        listing: !isMultiItem ? {
          itemId: order.listing.itemId,
          title: order.listing.title,
          photos: order.listing.photos,
          price: order.listing.price,
          salePrice: order.listing.salePrice
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      expiredOrders: formattedOrders,
      count: formattedOrders.length
    });

  } catch (error) {
    console.error('Error finding expired orders:', error);
    return NextResponse.json(
      { error: 'Failed to find expired orders' },
      { status: 500 }
    );
  }
}

/**
 * Restore expired orders back to cart
 * POST /api/orders/expired/restore
 * Body: { orderIds: string[] } - Array of order IDs to restore
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
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    console.log('Restoring expired orders to cart:', orderIds, 'for user:', session.user.id);

    // Get or create user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id }
      });
    }

    const restoredOrders = [];
    const failedOrders = [];

    // Process each order
    for (const orderId of orderIds) {
      try {
        // Find the expired order and verify ownership
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
                isHeld: true
              }
            }
          }
        });

        if (!order) {
          failedOrders.push({ orderId, reason: 'Order not found' });
          continue;
        }

        // Verify order is expired and pending
        const now = new Date();
        const isExpired = now > new Date(order.checkoutExpiresAt);
        
        if (order.status !== 'PENDING' || !isExpired) {
          failedOrders.push({ orderId, reason: 'Order is not expired or not pending' });
          continue;
        }

        // Check if listing is still available
        if (order.listing.status !== 'active' && !(order.listing.status === 'processing' && order.listing.isHeld)) {
          failedOrders.push({ orderId, reason: 'Item is no longer available' });
          continue;
        }

        // Check if this is a multi-item order
        const priceBreakdown = (order as any).shippingAddress?.priceBreakdown;
        const isMultiItem = priceBreakdown?.isMultiItem;
        const items = priceBreakdown?.items || [];

        if (isMultiItem && items.length > 1) {
          // Restore all items from multi-item order to cart
          for (const item of items) {
            // Check if item already exists in cart
            const existingCartItem = await prisma.cartItem.findUnique({
              where: {
                cartId_listingId: {
                  cartId: cart.id,
                  listingId: item.listingId
                }
              }
            });

            if (!existingCartItem) {
              // Add item back to cart
              await prisma.cartItem.create({
                data: {
                  cartId: cart.id,
                  listingId: item.listingId,
                  quantity: item.quantity || 1
                }
              });
            }
          }
        } else {
          // Single item order - restore to cart
          const existingCartItem = await prisma.cartItem.findUnique({
            where: {
              cartId_listingId: {
                cartId: cart.id,
                listingId: order.listing.id
              }
            }
          });

          if (!existingCartItem) {
            // Add item back to cart
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                listingId: order.listing.id,
                quantity: 1
              }
            });
          }
        }

        // Update listing status back to active and remove hold
        if (isMultiItem && items.length > 1) {
          // Update all listings in multi-item order
          for (const item of items) {
            await prisma.listing.update({
              where: { id: item.listingId },
              data: {
                status: 'active',
                isHeld: false,
                heldUntil: null,
                updatedAt: new Date()
              }
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
              updatedAt: new Date()
            }
          });
        }

        // Cancel the expired order
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        restoredOrders.push({ 
          orderId, 
          itemCount: isMultiItem ? items.length : 1,
          isMultiItem 
        });

      } catch (error) {
        console.error(`Error restoring order ${orderId}:`, error);
        failedOrders.push({ 
          orderId, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = restoredOrders.length;
    const failureCount = failedOrders.length;

    return NextResponse.json({
      success: true,
      message: `${successCount} order(s) restored to cart${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      restoredOrders,
      failedOrders,
      stats: {
        requested: orderIds.length,
        restored: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error restoring expired orders:', error);
    return NextResponse.json(
      { error: 'Failed to restore expired orders' },
      { status: 500 }
    );
  }
}
