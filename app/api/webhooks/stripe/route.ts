import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Stripe Webhook Handler
 * 
 * Handles webhook events from Stripe:
 * - checkout.session.completed: Create order, mark listing as sold
 * - payment_intent.succeeded: Ensure order is persisted
 * - charge.dispute.created: Mark order as disputed
 * 
 * POST /api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: any;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;

      case 'charge.dispute.closed':
        await handleChargeDisputeClosed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completion
 * Creates order and marks listing as sold
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    const { listingId, buyerId, sellerId } = session.metadata;

    // Find the order by checkout session ID
    const order = await prisma.order.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { listing: true },
    });

    if (!order) {
      console.error('Order not found for session:', session.id);
      return;
    }

    // Update order with payment details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripePaymentIntentId: session.payment_intent,
        stripeChargeId: session.payment_intent ? undefined : undefined, // Will be set when payment intent succeeds
        amount: session.amount_total / 100, // Convert from cents
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
        description: `Item purchased by user ${buyerId}`,
        metadata: {
          orderId: order.id,
          buyerId,
          amount: session.amount_total / 100,
        },
      },
    });

    console.log('Order completed successfully:', order.id);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

/**
 * Handle payment intent success
 * Ensures order is properly persisted and updated
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const { listingId } = paymentIntent.metadata;

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update order with charge ID if not already set
    if (paymentIntent.latest_charge && !order.stripeChargeId) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeChargeId: paymentIntent.latest_charge,
        },
      });
    }

    console.log('Payment intent succeeded for order:', order.id);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle charge dispute creation
 * Marks order as disputed
 */
async function handleChargeDisputeCreated(dispute: any) {
  try {
    const chargeId = dispute.charge;

    // Find order by charge ID
    const order = await prisma.order.findFirst({
      where: { stripeChargeId: chargeId },
    });

    if (!order) {
      console.error('Order not found for dispute charge:', chargeId);
      return;
    }

    // Update order status to disputed
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DISPUTED',
        disputeReason: dispute.reason,
        disputeCreatedAt: new Date(),
      },
    });

    // Create listing history event
    await prisma.listingHistory.create({
      data: {
        listingId: order.listingId,
        eventType: 'DISPUTE',
        eventTitle: 'Payment Dispute',
        description: `Payment dispute created for order ${order.id}`,
        metadata: {
          orderId: order.id,
          disputeId: dispute.id,
          reason: dispute.reason,
        },
      },
    });

    console.log('Order marked as disputed:', order.id);

  } catch (error) {
    console.error('Error handling charge dispute created:', error);
  }
}

/**
 * Handle charge dispute closure
 * Updates order status based on dispute outcome
 */
async function handleChargeDisputeClosed(dispute: any) {
  try {
    const chargeId = dispute.charge;

    // Find order by charge ID
    const order = await prisma.order.findFirst({
      where: { stripeChargeId: chargeId },
    });

    if (!order) {
      console.error('Order not found for dispute charge:', chargeId);
      return;
    }

    let newStatus = 'PAID';

    // Determine new status based on dispute outcome
    if (dispute.status === 'won') {
      newStatus = 'PAID'; // Dispute won, payment confirmed
    } else if (dispute.status === 'lost') {
      newStatus = 'REFUNDED'; // Dispute lost, payment refunded
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        disputeReason: null, // Clear dispute reason
        disputeCreatedAt: null,
      },
    });

    // Create listing history event
    await prisma.listingHistory.create({
      data: {
        listingId: order.listingId,
        eventType: 'DISPUTE_RESOLVED',
        eventTitle: 'Dispute Resolved',
        description: `Dispute ${dispute.status} for order ${order.id}`,
        metadata: {
          orderId: order.id,
          disputeId: dispute.id,
          outcome: dispute.status,
        },
      },
    });

    console.log('Dispute resolved for order:', order.id);

  } catch (error) {
    console.error('Error handling charge dispute closed:', error);
  }
}
