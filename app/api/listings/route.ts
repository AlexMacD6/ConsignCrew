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
        department,
        category,
        subCategory,
        title,
        condition,
        price: parseFloat(price),
        description,
        zipCode,
        neighborhood,
        brand: brand || null,
        dimensions: dimensions || null,
        serialNumber: serialNumber || null,
        modelNumber: modelNumber || null,
        estimatedRetailPrice: estimatedRetailPrice ? parseFloat(estimatedRetailPrice) : null,
        discountSchedule: discountSchedule || null,
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

    // Only allow fetching active listings for public access
    if (status !== 'active') {
      // For non-active status, require authentication
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const listings = await prisma.listing.findMany({
      where: {
        status,
      },
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