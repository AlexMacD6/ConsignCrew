import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { metaPixelAPI } from '@/lib/meta-pixel-api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Fetch the listing with user data
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if listing is enabled for Facebook Shop
    if (!listing.facebookShopEnabled) {
      return NextResponse.json({ 
        error: 'Listing is not enabled for Facebook Shop',
        success: false 
      }, { status: 400 });
    }

    // Sync product to Meta's catalog
    const syncResult = await metaPixelAPI.syncProduct(listing);

    if (syncResult.success) {
      // Update listing with Meta product ID and sync status
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          metaProductId: syncResult.productId,
          metaLastSync: new Date(),
          metaSyncStatus: 'success',
          metaErrorDetails: null,
        },
      });

      return NextResponse.json({
        success: true,
        productId: syncResult.productId,
        message: 'Product synced successfully to Meta catalog'
      });
    } else {
      // Update listing with error status
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          metaLastSync: new Date(),
          metaSyncStatus: 'error',
          metaErrorDetails: syncResult.error,
        },
      });

      return NextResponse.json({
        success: false,
        error: syncResult.error,
        message: 'Failed to sync product to Meta catalog'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error syncing product to Meta:', error);
    return NextResponse.json({
      error: 'Failed to sync product to Meta',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Fetch the listing to get Meta product ID
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { metaProductId: true }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!listing.metaProductId) {
      return NextResponse.json({ 
        error: 'Product not synced to Meta catalog',
        success: false 
      }, { status: 400 });
    }

    // Delete product from Meta's catalog
    const deleteResult = await metaPixelAPI.deleteProduct(listing.metaProductId);

    if (deleteResult.success) {
      // Update listing to remove Meta product ID
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          metaProductId: null,
          metaLastSync: new Date(),
          metaSyncStatus: 'deleted',
          metaErrorDetails: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Product removed from Meta catalog successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: deleteResult.error,
        message: 'Failed to remove product from Meta catalog'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error removing product from Meta:', error);
    return NextResponse.json({
      error: 'Failed to remove product from Meta',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 