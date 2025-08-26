import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getDisplayPrice } from "../../lib/price-calculator";

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            listing: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });

    // If cart doesn't exist, create it
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: {
          items: {
            include: {
              listing: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate delivery fees and totals
    const cartWithTotals = calculateCartTotals(cart);

    return NextResponse.json({
      success: true,
      cart: cartWithTotals,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, quantity = 1 } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Verify listing exists and is available
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "Listing is not available" },
        { status: 400 }
      );
    }

    // Allow users to add their own listings to cart for testing/flexibility
    // (removed restriction)

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_listingId: {
          cartId: cart.id,
          listingId: listingId,
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      // Add new item to cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          listingId: listingId,
          quantity: quantity,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// Helper function to calculate cart totals and delivery fees
function calculateCartTotals(cart: any) {
  let subtotal = 0;
  let hasBulkItems = false;
  let hasNormalItems = false;

  // Calculate subtotal and check for bulk items
  cart.items.forEach((item: any) => {
    // Use the display price which includes sale pricing and discount schedules
    const currentPrice = getDisplayPrice(item.listing).price;
    const itemTotal = currentPrice * item.quantity;
    subtotal += itemTotal;

    if (item.listing.deliveryCategory === "BULK") {
      hasBulkItems = true;
    } else {
      hasNormalItems = true;
    }
  });

  // Calculate delivery fee based on requirements:
  // - $50 delivery fee on any orders less than $150
  // - $100 on bulk orders less than $150
  // - If it's more than $150 but still a bulk item, that cost gets dropped to $50
  let deliveryFee = 0;

  if (subtotal < 150) {
    if (hasBulkItems) {
      deliveryFee = 100; // $100 for bulk orders under $150
    } else {
      deliveryFee = 50; // $50 for normal orders under $150
    }
  } else if (subtotal >= 150 && hasBulkItems) {
    deliveryFee = 50; // $50 for bulk orders over $150
  }
  // No delivery fee for normal orders over $150

  // Calculate tax (8.25% - typical Texas rate)
  const taxRate = 0.0825;
  const tax = subtotal * taxRate;
  
  const total = subtotal + deliveryFee + tax;

  return {
    ...cart,
    subtotal,
    deliveryFee,
    tax,
    total,
    hasBulkItems,
    hasNormalItems,
  };
}
