import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getDisplayPrice } from "../../../lib/price-calculator";
import { createCheckoutSession } from "../../../lib/stripe";

/**
 * Create checkout session from cart
 * POST /api/cart/checkout
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body to get delivery method and promo code
    const body = await request.json();
    const deliveryMethod = body.deliveryMethod || "delivery"; // default to delivery
    const promoCode = body.promoCode;
    const promoDiscount = body.promoDiscount;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            listing: {
              include: {
                user: { select: { name: true } }
              }
            }
          },
          orderBy: { addedAt: "desc" }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate all items are still available
    for (const item of cart.items) {
      if (item.listing.status !== "active") {
        return NextResponse.json(
          { 
            error: `Item "${item.listing.title}" is no longer available`,
            unavailableItem: item.listing.title 
          },
          { status: 409 }
        );
      }

      // Check if listing is currently held by another buyer
      if (item.listing.isHeld && item.listing.heldUntil && new Date() < item.listing.heldUntil) {
        return NextResponse.json(
          { 
            error: `Item "${item.listing.title}" is currently being purchased by another buyer`,
            heldItem: item.listing.title 
          },
          { status: 409 }
        );
      }
    }

    // For now, let's handle single-item carts and redirect to the existing single-item checkout
    // Multi-item cart checkout will need more complex order modeling
    
    if (cart.items.length === 1) {
      // Single item - use existing checkout flow logic
      const item = cart.items[0];
      const listing = item.listing;
      
      // Allow users to purchase their own listings (restriction removed per user request)

      // Check if listing is currently held by another buyer
      if (listing.isHeld && listing.heldUntil && new Date() < listing.heldUntil) {
        return NextResponse.json(
          { 
            error: 'This item is currently being purchased by another buyer. Please try again in a few minutes.',
            code: 'ITEM_HELD'
          },
          { status: 409 }
        );
      }

      // Get the correct display price
      const { price: finalPrice } = getDisplayPrice(listing);

      // Calculate delivery fee based on delivery method and order total
      let deliveryFee = 0;
      const deliveryCategory = listing.deliveryCategory || 'NORMAL';
      
      if (deliveryMethod === "delivery") {
        // Check if order qualifies for free delivery (over $150)
        if (finalPrice >= 150) {
          deliveryFee = 0;
        } else {
          // Apply standard delivery fees
          deliveryFee = deliveryCategory === 'BULK' ? 100 : 50;
        }
      }
      // If pickup, deliveryFee remains 0

      // Apply promo code discounts
      let promoDiscountAmount = 0;
      if (promoDiscount) {
        if (promoDiscount.type === 'free_shipping') {
          promoDiscountAmount = deliveryFee;
          deliveryFee = 0;
        } else {
          promoDiscountAmount = promoDiscount.amount || 0;
        }
      }

      // Tax at fixed 8.25% - calculated on subtotal + delivery fee
      const TAX_RATE = 0.0825;
      const taxableAmount = finalPrice + deliveryFee;
      const salesTax = taxableAmount * TAX_RATE;
      
      // Calculate final total: subtotal + delivery fee (after promo) + tax
      // Note: For free shipping promos, deliveryFee is already set to 0 above
      const orderTotal = finalPrice + deliveryFee + salesTax;

      // Hold the item for 10 minutes during checkout
      const holdDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
      const holdExpiry = new Date(Date.now() + holdDuration);

      // Update listing to hold it during checkout and set to processing
      await prisma.listing.update({
        where: { itemId: listing.itemId },
        data: {
          isHeld: true,
          heldUntil: holdExpiry,
          status: 'processing'
        }
      });

      // Create order in database with both new fields and JSON backup
      const order = await prisma.order.create({
        data: {
          listingId: listing.id,
          buyerId: session.user.id,
          sellerId: listing.userId,
          amount: orderTotal,
          currency: 'usd',
          status: 'PENDING',
          checkoutExpiresAt: holdExpiry,
          isHeld: true,
          
          // NEW: Populate dedicated pricing fields
          subtotal: finalPrice,
          deliveryFee: deliveryFee,
          taxAmount: salesTax,
          taxRate: TAX_RATE,
          deliveryMethod: deliveryMethod,
          deliveryCategory: deliveryCategory,
          promoCode: promoCode,
          promoDiscountAmount: promoDiscountAmount,
          promoDiscountType: promoDiscount?.type,
          isMultiItem: false,
          
          // Keep JSON for backward compatibility and item details
          shippingAddress: {
            priceBreakdown: {
              subtotal: finalPrice,
              deliveryFee: deliveryFee,
              deliveryCategory: deliveryCategory,
              deliveryMethod: deliveryMethod,
              tax: salesTax,
              taxRate: TAX_RATE,
              total: orderTotal,
              isMultiItem: false,
              promoCode: promoCode,
              promoDiscount: promoDiscountAmount,
              promoDiscountType: promoDiscount?.type,
              items: [{
                listingId: listing.id,
                listingItemId: listing.itemId,
                title: listing.title,
                quantity: 1,
                itemPrice: finalPrice,
                itemTotal: finalPrice,
                photos: listing.photos,
                deliveryCategory: listing.deliveryCategory
              }]
            }
          }
        }
      });

      // Clear the cart after successful order creation
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        checkoutUrl: `/checkout/${order.id}`
      });
    } else {
      // Multi-item cart - handle multiple items in a single order
      
      // Calculate totals for all items in the cart
      let subtotal = 0;
      let hasBulkItems = false;
      const cartItems = [];

      // Process each item and calculate totals
      for (const item of cart.items) {
        const listing = item.listing;
        
        // Check if listing is currently held by another buyer
        if (listing.isHeld && listing.heldUntil && new Date() < listing.heldUntil) {
          return NextResponse.json(
            { 
              error: `Item "${listing.title}" is currently being purchased by another buyer. Please try again in a few minutes.`,
              code: 'ITEM_HELD'
            },
            { status: 409 }
          );
        }

        // Get the correct display price
        const { price: itemPrice } = getDisplayPrice(listing);
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        // Check for bulk items
        if (listing.deliveryCategory === 'BULK') {
          hasBulkItems = true;
        }

        cartItems.push({
          listing: listing,
          quantity: item.quantity,
          itemPrice: itemPrice,
          itemTotal: itemTotal
        });
      }

      // Calculate delivery fee based on delivery method and order total
      let deliveryFee = 0;
      
      if (deliveryMethod === "delivery") {
        // Check if order qualifies for free delivery (over $150)
        if (subtotal >= 150) {
          deliveryFee = 0;
        } else {
          // Apply standard delivery fees
          deliveryFee = hasBulkItems ? 100 : 50;
        }
      }
      // If pickup, deliveryFee remains 0

      // Apply promo code discounts
      let promoDiscountAmount = 0;
      if (promoDiscount) {
        if (promoDiscount.type === 'free_shipping') {
          promoDiscountAmount = deliveryFee;
          deliveryFee = 0;
        } else {
          promoDiscountAmount = promoDiscount.amount || 0;
        }
      }

      // Tax at fixed 8.25% - calculated on subtotal + delivery fee
      const TAX_RATE = 0.0825;
      const taxableAmount = subtotal + deliveryFee;
      const salesTax = taxableAmount * TAX_RATE;
      
      // Calculate final total: subtotal + delivery fee (after promo) + tax
      // Note: For free shipping promos, deliveryFee is already set to 0 above
      const orderTotal = subtotal + deliveryFee + salesTax;

      // Hold all items for 10 minutes during checkout
      const holdDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
      const holdExpiry = new Date(Date.now() + holdDuration);

      // Update all listings to hold them during checkout and set to processing
      for (const item of cartItems) {
        await prisma.listing.update({
          where: { id: item.listing.id },
          data: {
            isHeld: true,
            heldUntil: holdExpiry,
            status: 'processing'
          }
        });
      }

      // For multi-item orders, we'll create an order with the first listing as primary
      // and store all item details in the shippingAddress field
      const primaryListing = cartItems[0].listing;
      
      // Create order in database with both new fields and JSON backup
      const order = await prisma.order.create({
        data: {
          listingId: primaryListing.id,
          buyerId: session.user.id,
          sellerId: primaryListing.userId, // We'll use the first seller as primary
          amount: orderTotal,
          currency: 'usd',
          status: 'PENDING',
          checkoutExpiresAt: holdExpiry,
          isHeld: true,
          
          // NEW: Populate dedicated pricing fields
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          taxAmount: salesTax,
          taxRate: TAX_RATE,
          deliveryMethod: deliveryMethod,
          deliveryCategory: hasBulkItems ? 'BULK' : 'NORMAL',
          promoCode: promoCode,
          promoDiscountAmount: promoDiscountAmount,
          promoDiscountType: promoDiscount?.type,
          isMultiItem: true,
          
          // Keep JSON for backward compatibility and item details
          shippingAddress: {
            priceBreakdown: {
              subtotal: subtotal,
              deliveryFee: deliveryFee,
              deliveryCategory: hasBulkItems ? 'BULK' : 'NORMAL',
              deliveryMethod: deliveryMethod,
              tax: salesTax,
              taxRate: TAX_RATE,
              total: orderTotal,
              isMultiItem: true,
              promoCode: promoCode,
              promoDiscount: promoDiscountAmount,
              promoDiscountType: promoDiscount?.type,
              items: cartItems.map(item => ({
                listingId: item.listing.id,
                listingItemId: item.listing.itemId,
                title: item.listing.title,
                quantity: item.quantity,
                itemPrice: item.itemPrice,
                itemTotal: item.itemTotal,
                photos: item.listing.photos,
                deliveryCategory: item.listing.deliveryCategory
              }))
            }
          }
        }
      });

      // Clear the cart after successful order creation
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Return the checkout URL for the created order
      return NextResponse.json({
        success: true,
        checkoutUrl: `/checkout/${order.id}`,
        orderId: order.id,
        isMultiItem: true
      });
    }

  } catch (error) {
    console.error("Cart checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
