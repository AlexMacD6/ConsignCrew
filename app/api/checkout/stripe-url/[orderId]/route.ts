import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

/**
 * Get Stripe checkout URL for an existing order
 * GET /api/checkout/stripe-url/[orderId]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    
    console.log('Stripe URL endpoint: Looking for order:', orderId, 'for user:', session.user.id);
    
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        buyerId: session.user.id 
      },
      include: {
        listing: true
      }
    });

    if (!order) {
      console.log('Stripe URL endpoint: Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('Stripe URL endpoint: Order found:', {
      id: order.id,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      checkoutExpiresAt: order.checkoutExpiresAt
    });

    // Check if still within checkout window
    if (new Date() > new Date(order.checkoutExpiresAt)) {
      return NextResponse.json({ 
        error: 'Checkout session has expired',
        code: 'EXPIRED'
      }, { status: 410 });
    }

    // Get the existing Stripe checkout session
    try {
      console.log('Stripe URL endpoint: Retrieving Stripe session:', order.stripeCheckoutSessionId);
      const checkoutSession = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      
      console.log('Stripe URL endpoint: Stripe session retrieved:', {
        id: checkoutSession.id,
        status: checkoutSession.status,
        url: checkoutSession.url
      });
      
      if (checkoutSession.status === 'expired') {
        console.log('Stripe URL endpoint: Stripe session expired');
        return NextResponse.json({ 
          error: 'Stripe session has expired',
          code: 'STRIPE_EXPIRED'
        }, { status: 410 });
      }
      
      return NextResponse.json({ 
        success: true, 
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      });
    } catch (stripeError) {
      console.error('Stripe URL endpoint: Error retrieving Stripe session:', stripeError);
      return NextResponse.json({ 
        error: 'Failed to retrieve payment session',
        code: 'STRIPE_ERROR'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error getting checkout URL:', error);
    return NextResponse.json(
      { error: 'Failed to get checkout URL' },
      { status: 500 }
    );
  }
}
