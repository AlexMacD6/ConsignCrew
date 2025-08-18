import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Search for order by session ID
 * 
 * GET /api/orders/search?sessionId=session_id
 */
export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error searching for order:', error);
    return NextResponse.json(
      { error: 'Failed to search for order' },
      { status: 500 }
    );
  }
}