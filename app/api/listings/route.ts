import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      photos,
      videoUrl,
      department,
      category,
      subCategory,
      title,
      condition,
      price,
      description,
      zipCode,
      neighborhood,
      brand,
      dimensions,
      serialNumber,
      modelNumber,
      estimatedRetailPrice,
      discountSchedule,
      reservePrice,
      height,
      width,
      depth,
      // Facebook Shop Integration Fields
      facebookShopEnabled,
      facebookBrand,
      facebookCategory,
      facebookCondition,
      facebookGtin,
    } = body;

    // Validate required fields
    if (!photos?.hero || !photos?.back || !title || !price || !description) {
      return NextResponse.json({
        error: 'Missing required fields: hero photo, back photo, title, price, description'
      }, { status: 400 });
    }

    // Generate unique item ID
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const itemId = `cc_${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}_${dateStr}_${timeStr}`;

    // Transform photos to use CloudFront URLs instead of S3 keys
    const { getPublicUrl } = await import('../../../src/aws/imageStore');
    
    const transformedPhotos = {
      staged: photos.staged || null, // AI-generated staged photo URL
      hero: photos.hero?.url ? photos.hero.url : (typeof photos.hero === 'string' ? getPublicUrl(photos.hero) : photos.hero),
      back: photos.back?.url ? photos.back.url : (typeof photos.back === 'string' ? getPublicUrl(photos.back) : photos.back),
      proof: photos.proof?.url ? photos.proof.url : (typeof photos.proof === 'string' ? getPublicUrl(photos.proof) : photos.proof),
      additional: photos.additional?.map((photo: any) => 
        photo.url ? photo.url : (typeof photo === 'string' ? getPublicUrl(photo) : photo)
      ) || []
    };
    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        itemId,
        photos: transformedPhotos,
        videoUrl: videoUrl || null,
        department,
        category,
        subCategory,
        title,
        condition,
        price: parseFloat(price),
        reservePrice: reservePrice ? parseFloat(reservePrice) : parseFloat(price) * 0.6,
        description,
        zipCode,
        neighborhood,
        brand: brand || null,
        height: height || null,
        width: width || null,
        depth: depth || null,
        serialNumber: serialNumber || null,
        modelNumber: modelNumber || null,
        estimatedRetailPrice: estimatedRetailPrice ? parseFloat(estimatedRetailPrice) : null,
        discountSchedule: discountSchedule || null,
        // Facebook Shop Integration Fields
        facebookShopEnabled: facebookShopEnabled !== undefined ? facebookShopEnabled : true,
        facebookBrand: facebookBrand || null,
        facebookCategory: facebookCategory || null,
        facebookCondition: facebookCondition || null,
        facebookGtin: facebookGtin || null,
        priceHistory: {
          create: {
            price: parseFloat(price),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing,
      itemId,
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create listing'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userOnly = searchParams.get('userOnly') === 'true';

    // Check authentication for user-specific requests
    let session = null;
    if (userOnly || status !== 'active') {
      session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Build where clause
    const whereClause: any = {};
    
    if (userOnly) {
      whereClause.userId = session!.user.id;
    } else {
      whereClause.status = status;
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            members: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        priceHistory: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Get last 10 price changes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      listings,
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch listings'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('id');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Check if user owns the listing
    const listing = await prisma.listing.findFirst({
      where: {
        itemId: listingId,
        userId: session.user.id,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    // Delete the listing
    await prisma.listing.delete({
      where: {
        id: listing.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete listing'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('id');
    const body = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Check if user owns the listing
    const listing = await prisma.listing.findFirst({
      where: {
        itemId: listingId,
        userId: session.user.id,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });

  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update listing'
    }, { status: 500 });
  }
} 