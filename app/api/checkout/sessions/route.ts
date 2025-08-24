import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Extend Prisma types for PromoCode table created via migration
type Promo = { code: string; discountType: 'PERCENT'|'AMOUNT'; value: number; isActive: boolean; maxRedemptions: number|null; timesRedeemed: number; expiresAt: Date|null };
import { createCheckoutSession } from '@/lib/stripe';
import { getDisplayPrice } from '@/lib/price-calculator';

/**
 * Create a Stripe Checkout Session for purchasing a listing
 * 
 * POST /api/checkout/sessions
 * Body: { listingId: string }
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
    console.log('Checkout request body:', body); // Debug log
    console.log('Request body type:', typeof body); // Debug log

    const { listingId, overrideOwnPurchase, promoCode } = body;
    console.log('Extracted listingId:', listingId); // Debug log

    if (!listingId) {
      console.error('Missing listingId in request body:', body); // Debug log
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Fetch the listing and validate availability
    const listing = await prisma.listing.findUnique({
      where: { itemId: listingId },
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
        // Fields needed for sales price calculation
        discountSchedule: true,
        createdAt: true,
        reservePrice: true,
        // Fields needed for checkout hold system
        isHeld: true,
        heldUntil: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if listing is available for purchase
    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Listing is not available for purchase' },
        { status: 400 }
      );
    }

    // Check if user is trying to buy their own listing
    console.log('Debug - listing.userId:', listing.userId);
    console.log('Debug - session.user.id:', session.user.id);
    console.log('Debug - listing.user.id:', listing.user?.id);
    console.log('Debug - ownership check:', listing.userId === session.user.id);

    if (listing.userId === session.user.id && !overrideOwnPurchase) {
      return NextResponse.json(
        {
          error: 'This is your own listing. Confirm to proceed.',
          code: 'OWN_LISTING',
        },
        { status: 400 }
      );
    }

    // Check if listing has quantity available
    if (listing.quantity < 1) {
      return NextResponse.json(
        { error: 'Listing is out of stock' },
        { status: 400 }
      );
    }

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

    // Create success and cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/order/thanks?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`;

    // Get the correct display price (sales price if available, otherwise list price)
    const { price: finalPrice } = getDisplayPrice(listing);

    // Delivery fee based on deliveryCategory
    const deliveryCategory = (listing as any).deliveryCategory || 'NORMAL';
    const deliveryFee = deliveryCategory === 'BULK' ? 100 : 50;

    // Promo code
    let promoDiscount = 0;
    if (promoCode) {
      const promo = await (prisma as any).promoCode.findFirst({ where: { code: promoCode.toUpperCase(), isActive: true } });
      if (promo && (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) && (!promo.maxRedemptions || promo.timesRedeemed < promo.maxRedemptions)) {
        if (promo.discountType === 'PERCENT') promoDiscount = Math.max(0, Math.min(finalPrice, (promo.value / 100) * finalPrice));
        else promoDiscount = Math.max(0, Math.min(finalPrice, promo.value));
      }
    }

    // Tax at fixed 8.25%
    const TAX_RATE = 0.0825;
    const taxable = Math.max(0, finalPrice + deliveryFee - promoDiscount);
    const salesTax = taxable * TAX_RATE;
    const orderTotal = taxable + salesTax;

    // Hold the item for 10 minutes during checkout (like StubHub)
    const holdDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const holdExpiry = new Date(Date.now() + holdDuration);

    // Update listing to hold it during checkout and set to processing
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        isHeld: true,
        heldUntil: holdExpiry,
        status: 'processing',
      },
    });

    // Create Stripe Checkout Session
    console.log('Creating Stripe checkout session for listing:', listing.itemId);
    const checkoutSession = await createCheckoutSession(
      { ...listing, price: orderTotal },
      session.user.id,
      successUrl,
      cancelUrl
    );
    console.log('Stripe checkout session created:', {
      id: checkoutSession.id,
      url: checkoutSession.url,
      status: checkoutSession.status
    });

    // Create pending order in database
    console.log('Creating order with Stripe session ID:', checkoutSession.id);
    const order = await prisma.order.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.userId,
        amount: orderTotal,
        status: 'PENDING',
        stripeCheckoutSessionId: checkoutSession.id,
        checkoutExpiresAt: holdExpiry,
        isHeld: true,
        // Store breakdown
        shippingAddress: {
          deliveryCategory,
          deliveryFee,
          promoCode: promoCode || null,
          promoDiscount,
          taxRate: TAX_RATE,
          salesTax,
        } as any
      },
    });
    console.log('Order created successfully:', {
      id: order.id,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId
    });

    // Return the checkout session URL
    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      orderId: order.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
