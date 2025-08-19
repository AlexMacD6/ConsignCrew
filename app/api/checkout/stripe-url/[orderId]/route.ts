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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if still within checkout window
    if (new Date() > new Date(order.checkoutExpiresAt)) {
      return NextResponse.json({ 
        error: 'Checkout session has expired',
        code: 'EXPIRED'
      }, { status: 410 });
    }

    // Get the existing Stripe checkout session
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      
      if (checkoutSession.status === 'expired') {
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
      console.error('Error retrieving Stripe session:', stripeError);
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
