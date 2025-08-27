import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getDisplayPrice } from "../../lib/price-calculator";
import { calculateCartTotals as calculateTotals } from "../../../lib/cart-calculations";

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
    const cartWithTotals = calculateCartTotalsForAPI(cart);

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
function calculateCartTotalsForAPI(cart: any, deliveryMethod: 'delivery' | 'pickup' = 'delivery') {
  // Transform cart items to match the interface expected by our calculation function
  const transformedItems = cart.items.map((item: any) => {
    // Use the display price which includes sale pricing and discount schedules
    const currentPrice = getDisplayPrice(item.listing).price;
    
    return {
      id: item.id,
      quantity: item.quantity,
      listing: {
        price: currentPrice,
        bulkItem: item.listing.deliveryCategory === "BULK"
      }
    };
  });

  // Use centralized calculation function
  const calculations = calculateTotals(transformedItems, deliveryMethod);
  
  return {
    ...cart,
    ...calculations,
  };
}
