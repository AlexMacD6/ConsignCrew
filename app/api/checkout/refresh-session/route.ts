import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';
import { getDisplayPrice } from '@/lib/price-calculator';

/**
 * Refresh an expired checkout session by creating a new Stripe session
 * This follows ecommerce best practices of creating fresh sessions rather than reviving expired ones
 * 
 * POST /api/checkout/refresh-session
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

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

    console.log('Refresh session: Processing order:', orderId, 'for user:', session.user.id);

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
            itemId: true,
            userId: true,
            price: true,
            status: true,
            quantity: true,
            title: true,
            description: true,
            photos: true,
            discountSchedule: true,
            createdAt: true,
            reservePrice: true,
            isHeld: true,
            heldUntil: true,
          }
        }
      }
    });

    if (!order) {
      console.log('Refresh session: Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the listing is still available
    if (order.listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Listing is no longer available for purchase' },
        { status: 400 }
      );
    }

    // Check if listing has quantity available
    if (order.listing.quantity < 1) {
      return NextResponse.json(
        { error: 'Listing is out of stock' },
        { status: 400 }
      );
    }

    // Check if listing is currently held by another buyer
    if (order.listing.isHeld && order.listing.heldUntil && new Date() < order.listing.heldUntil) {
      return NextResponse.json(
        { 
          error: 'This item is currently being purchased by another buyer. Please try again in a few minutes.',
          code: 'ITEM_HELD'
        },
        { status: 409 }
      );
    }

    // Create new success and cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/order/thanks?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/list-item/${order.listing.itemId}`;

    // Get the current display price (may have changed since original order)
    const { price: currentPrice } = getDisplayPrice(order.listing);

    // Create new hold duration (10 minutes)
    const holdDuration = 10 * 60 * 1000;
    const newHoldExpiry = new Date(Date.now() + holdDuration);

    // Create new Stripe Checkout Session
    console.log('Refresh session: Creating new Stripe session for listing:', order.listing.itemId);
    const newCheckoutSession = await createCheckoutSession(
      order.listing,
      session.user.id,
      successUrl,
      cancelUrl
    );

    console.log('Refresh session: New Stripe session created:', {
      id: newCheckoutSession.id,
      url: newCheckoutSession.url,
      status: newCheckoutSession.status
    });

    // Update the order with new session and extend hold
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeCheckoutSessionId: newCheckoutSession.id,
        checkoutExpiresAt: newHoldExpiry,
        amount: currentPrice, // Update price in case it changed
        updatedAt: new Date(),
      },
    });

    // Update listing hold
    await prisma.listing.update({
      where: { id: order.listing.id },
      data: {
        isHeld: true,
        heldUntil: newHoldExpiry,
        status: 'processing',
      },
    });

    console.log('Refresh session: Order updated successfully:', {
      id: updatedOrder.id,
      newStripeSessionId: updatedOrder.stripeCheckoutSessionId,
      newExpiry: updatedOrder.checkoutExpiresAt,
      newAmount: updatedOrder.amount
    });

    // Return the new checkout session URL
    return NextResponse.json({
      success: true,
      sessionId: newCheckoutSession.id,
      checkoutUrl: newCheckoutSession.url,
      orderId: updatedOrder.id,
      message: 'Checkout session refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to refresh checkout session' },
      { status: 500 }
    );
  }
}
