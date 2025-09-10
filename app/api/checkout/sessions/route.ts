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
    let deliveryFee = deliveryCategory === 'BULK' ? 100 : 50;

    // Promo code handling (updated to support new promo system)
    let promoDiscount = 0;
    let promoDiscountType = null;
    let validPromo = null;
    
    if (promoCode) {
      const promo = await (prisma as any).promoCode.findFirst({ 
        where: { 
          code: promoCode.toUpperCase(), 
          isActive: true 
        } 
      });
      
      if (promo && 
          (!promo.startDate || new Date(promo.startDate) <= new Date()) &&
          (!promo.endDate || new Date(promo.endDate) > new Date()) && 
          (!promo.usageLimit || promo.usageCount < promo.usageLimit)) {
        
        validPromo = promo;
        promoDiscountType = promo.type;
        
        if (promo.type === 'percentage') {
          promoDiscount = Math.max(0, Math.min(finalPrice, (promo.value / 100) * finalPrice));
        } else if (promo.type === 'fixed_amount') {
          promoDiscount = Math.max(0, Math.min(finalPrice, promo.value));
        } else if (promo.type === 'free_shipping') {
          // For free shipping, set delivery fee to 0 and track the discount amount
          promoDiscount = deliveryFee; // Track how much we're saving
          deliveryFee = 0; // Make delivery free
        }
      }
    }

    // Tax at fixed 8.25% - calculated on subtotal + delivery fee (after promo applied)
    const TAX_RATE = 0.0825;
    const subtotalAfterPromo = Math.max(0, finalPrice - (promoDiscountType === 'free_shipping' ? 0 : promoDiscount));
    const taxableAmount = subtotalAfterPromo + deliveryFee;
    const salesTax = taxableAmount * TAX_RATE;
    
    const orderTotal = subtotalAfterPromo + deliveryFee + salesTax;

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
        // NEW: Populate dedicated pricing fields
        subtotal: finalPrice,
        deliveryFee: deliveryFee,
        taxAmount: salesTax,
        taxRate: TAX_RATE,
        deliveryMethod: 'delivery', // This is direct checkout, always delivery
        deliveryCategory: deliveryCategory,
        promoCode: validPromo?.code || null,
        promoDiscountAmount: promoDiscountType === 'free_shipping' ? 0 : promoDiscount,
        promoDiscountType: promoDiscountType,
        isMultiItem: false,
        
        // Keep JSON for backward compatibility and item details
        shippingAddress: {
          priceBreakdown: {
            subtotal: finalPrice, // Original item price before any discounts
            deliveryFee: deliveryFee, // Will be 0 if free shipping applied
            deliveryCategory: deliveryCategory,
            deliveryMethod: 'delivery', // This is direct checkout, always delivery
            tax: salesTax,
            taxRate: TAX_RATE,
            total: orderTotal,
            isMultiItem: false,
            promoCode: validPromo?.code || null,
            promoDiscount: promoDiscountType === 'free_shipping' ? 0 : promoDiscount, // For free shipping, discount is applied to delivery, not item
            promoDiscountType: promoDiscountType,
            items: [{
              listingId: listing.id,
              listingItemId: listing.itemId,
              title: listing.title,
              quantity: 1,
              itemPrice: finalPrice, // Original item price
              itemTotal: finalPrice, // Original item price
              photos: listing.photos,
              deliveryCategory: listing.deliveryCategory
            }]
          }
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
