import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// User lands here from Stripe cancel_url with ?session_id=cs_xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.redirect(new URL('/listings', request.url));
    }

    const order = await prisma.order.findFirst({
      where: { stripeCheckoutSessionId: sessionId },
      include: { listing: true },
    });

    if (order && order.status === 'PENDING') {
      // Mark as cancelled and release listing
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED', statusUpdatedAt: new Date(), statusUpdatedBy: 'buyer' },
        }),
        prisma.listing.update({
          where: { id: order.listingId },
          data: { status: 'active', isHeld: false, heldUntil: null },
        }),
        prisma.listingHistory.create({
          data: {
            listingId: order.listingId,
            eventType: 'CHECKOUT_CANCELLED',
            eventTitle: 'Checkout Cancelled',
            description: 'Buyer cancelled checkout; item released',
            metadata: { orderId: order.id, stripeSessionId: sessionId },
          },
        }),
      ]);
    }

    // Redirect back to the listing page (or listings fallback)
    const redirectUrl = order
      ? new URL(`/list-item/${order.listing.itemId}`, request.url)
      : new URL('/listings', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    // On error, send user back to listings
    return NextResponse.redirect(new URL('/listings', request.url));
  }
}


