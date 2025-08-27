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

    // Check if Stripe checkout session exists
    if (!order.stripeCheckoutSessionId) {
      console.log('Stripe URL endpoint: No Stripe session ID found, creating new session');
      
      try {
        // Validate required data before creating session
        if (!order.amount || order.amount <= 0) {
          throw new Error(`Invalid order amount: ${order.amount}`);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log('Stripe URL endpoint: Creating session with data:', {
          orderId: order.id,
          amount: order.amount,
          title: order.listing.title,
          appUrl
        });

        // Create new Stripe checkout session
        const stripeSession = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: order.listing.title,
                  description: `Order #${order.id}`,
                  images: [], // Remove images for now to avoid potential URL issues
                  metadata: {
                    listingId: order.listing.itemId,
                    orderId: order.id,
                  },
                },
                unit_amount: Math.round(order.amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          metadata: {
            orderId: order.id,
            listingId: order.listingId,
            buyerId: session.user.id,
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${order.id}`,
          // Remove expires_at for now to avoid timestamp issues
          // expires_at: Math.floor(new Date(order.checkoutExpiresAt).getTime() / 1000),
        });

        // Update order with new Stripe session ID
        await prisma.order.update({
          where: { id: order.id },
          data: { stripeCheckoutSessionId: stripeSession.id },
        });

        console.log('Stripe URL endpoint: Created new Stripe session:', stripeSession.id);
        
        return NextResponse.json({ 
          success: true, 
          checkoutUrl: stripeSession.url,
          sessionId: stripeSession.id
        });
      } catch (stripeError) {
        console.error('Stripe URL endpoint: Error creating new Stripe session:', stripeError);
        console.error('Stripe URL endpoint: Error details:', {
          message: stripeError?.message,
          type: stripeError?.type,
          code: stripeError?.code,
          param: stripeError?.param
        });
        return NextResponse.json({ 
          error: `Failed to create payment session: ${stripeError?.message || 'Unknown error'}`,
          code: 'STRIPE_CREATE_ERROR'
        }, { status: 500 });
      }
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
