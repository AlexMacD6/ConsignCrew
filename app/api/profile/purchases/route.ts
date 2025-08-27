import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's purchases (orders where they are the buyer)
    const purchases = await prisma.order.findMany({
      where: {
        buyerId: session.user.id,
      },
      include: {
        listing: {
          select: {
            id: true,
            itemId: true,
            title: true,
            photos: true,
            estimatedRetailPrice: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        seller: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend expectations
    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      title: purchase.listing.title,
      listingId: purchase.listing.itemId, // Use itemId for navigation
      sellerName: purchase.seller.name,
      total: purchase.amount,
      status: purchase.status.toLowerCase(),
      purchaseDate: purchase.createdAt,
      stripeSessionId: purchase.stripeCheckoutSessionId,
      trackingNumber: purchase.trackingNumber,
      deliveredAt: purchase.deliveredAt,
      photos: purchase.listing.photos,
      estimatedRetailPrice: purchase.listing.estimatedRetailPrice,
    }));

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases,
    });

  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
