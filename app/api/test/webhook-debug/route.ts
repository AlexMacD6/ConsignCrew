import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to test Stripe webhook processing manually
 * GET /api/test/webhook-debug?sessionId=cs_test_...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch session from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Find the order in our database
    const order = await prisma.order.findFirst({
      where: { stripeCheckoutSessionId: sessionId },
      include: { listing: true },
    });

    // Check if webhook endpoint is configured
    const webhookEndpoints = await stripe.webhookEndpoints.list();
    const ourWebhook = webhookEndpoints.data.find(webhook => 
      webhook.url.includes('/api/webhooks/stripe')
    );

    return NextResponse.json({
      success: true,
      debug: {
        sessionId,
        stripeSession: {
          id: stripeSession.id,
          status: stripeSession.status,
          payment_status: stripeSession.payment_status,
          metadata: stripeSession.metadata,
          payment_intent: stripeSession.payment_intent,
        },
        order: order ? {
          id: order.id,
          status: order.status,
          listingId: order.listingId,
          amount: order.amount,
        } : null,
        listing: order?.listing ? {
          itemId: order.listing.itemId,
          status: order.listing.status,
          isHeld: order.listing.isHeld,
        } : null,
        webhook: {
          configured: !!ourWebhook,
          url: ourWebhook?.url,
          status: ourWebhook?.status,
          events: ourWebhook?.enabled_events,
        },
        environment: {
          webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
        }
      }
    });

  } catch (error) {
    console.error('Error debugging webhook:', error);
    return NextResponse.json(
      { error: 'Failed to debug webhook', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Test webhook processing manually
 * POST /api/test/webhook-debug
 * Body: { sessionId: 'cs_test_...' }
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch session from Stripe to simulate webhook data
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Manually call the webhook handler with the session data
    const { listingId, buyerId, sellerId } = stripeSession.metadata;

    // Find the order by checkout session ID
    const order = await prisma.order.findUnique({
      where: { stripeCheckoutSessionId: stripeSession.id },
      include: { listing: true },
    });

    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found for session',
        sessionId: stripeSession.id 
      }, { status: 404 });
    }

    // Update order with payment details (simulating webhook)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripePaymentIntentId: stripeSession.payment_intent,
        amount: stripeSession.amount_total / 100, // Convert from cents
      },
    });

    // Mark listing as sold and release hold
    await prisma.listing.update({
      where: { id: order.listingId },
      data: {
        status: 'sold',
        isHeld: false, // Release the hold
        heldUntil: null, // Clear hold expiry
      },
    });

    // Create listing history event
    await prisma.listingHistory.create({
      data: {
        listingId: order.listingId,
        eventType: 'PURCHASE',
        eventTitle: 'Item Purchased',
        description: `Item purchased by user ${buyerId} (manual webhook simulation)`,
        metadata: {
          orderId: order.id,
          buyerId,
          amount: stripeSession.amount_total / 100,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processing simulated successfully',
      order: {
        id: order.id,
        status: 'PAID',
        listingId: order.listingId,
      },
      listing: {
        itemId: order.listing?.itemId,
        status: 'sold',
      }
    });

  } catch (error) {
    console.error('Error simulating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to simulate webhook', details: error.message },
      { status: 500 }
    );
  }
}
