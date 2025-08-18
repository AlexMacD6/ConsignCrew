import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Search Orders API
 * 
 * GET /api/orders/search?sessionId=cs_test_...
 * 
 * Used by the order thanks page to find order details by Stripe session ID
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find order by Stripe checkout session ID
    const order = await prisma.order.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        listing: {
          select: {
            title: true,
            photos: true,
            itemId: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this order
    const isAdmin = session.user.role === 'admin';
    const isBuyer = order.buyerId === session.user.id;
    const isSeller = order.sellerId === session.user.id;

    if (!isAdmin && !isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error searching orders:', error);
    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}
