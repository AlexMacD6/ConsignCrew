import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHistoryEvent, HistoryEvents } from '@/lib/listing-history';
import { validateGender, validateAgeGroup, validateItemGroupId } from '@/lib/product-specifications';
import { metaPixelAPI } from '@/lib/meta-pixel-api';

// Generate a random 6-character ID using letters and numbers
function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      // Product Specifications (Facebook Shop Fields)
      quantity,
      salePrice,
      salePriceEffectiveDate,
      itemGroupId,
      gender,
      color,
      size,
      ageGroup,
      material,
      pattern,
      style,
      tags,
      itemId, // Add itemId to destructuring
      videoId, // Add videoId to destructuring
      // Treasure fields
      isTreasure,
      treasureReason,
    } = body;

    // Validate required fields
    if (!photos?.hero || !photos?.back || !title || !price || !description) {
      return NextResponse.json({
        error: 'Missing required fields: hero photo, back photo, title, price, description'
      }, { status: 400 });
    }

    // Validate product specifications
    if (gender && !validateGender(gender)) {
      return NextResponse.json({
        error: 'Invalid gender value. Must be one of: male, female, unisex'
      }, { status: 400 });
    }

    if (ageGroup && !validateAgeGroup(ageGroup)) {
      return NextResponse.json({
        error: 'Invalid age group value. Must be one of: newborn, infant, toddler, kids, adult'
      }, { status: 400 });
    }

    if (itemGroupId && !validateItemGroupId(itemGroupId)) {
      return NextResponse.json({
        error: 'Item Group ID must be 50 characters or less'
      }, { status: 400 });
    }

    // Use provided itemId or generate one if not provided
    const finalItemId = itemId || generateRandomId();

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
        itemId: finalItemId,
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
        // Product Specifications (Facebook Shop Fields)
        quantity: quantity || 1,
        salePrice: salePrice ? parseFloat(salePrice) : null,
        salePriceEffectiveDate: salePriceEffectiveDate ? new Date(salePriceEffectiveDate) : null,
        itemGroupId: itemGroupId || null,
        gender: gender || null,
        color: color || null,
        size: size || null,
        ageGroup: ageGroup || 'adult',
        material: material || null,
        pattern: pattern || null,
        style: style || null,
        tags: tags || [],
        // Treasure fields
        isTreasure: isTreasure || false,
        treasureReason: treasureReason || null,
        treasureFlaggedAt: isTreasure ? new Date() : null,
        treasureFlaggedBy: isTreasure ? session.user.id : null,

        // Link video to listing if videoId is provided
        videos: videoId ? {
          connect: {
            id: videoId
          }
        } : undefined,
        priceHistory: {
          create: {
            price: parseFloat(price),
          },
        },
      },
    });

    // Create initial history event for listing creation
    await createHistoryEvent(finalItemId, HistoryEvents.LISTING_CREATED(title));

    // Auto-sync to Facebook catalog if enabled and environment is configured
    let facebookSyncResult = null;
    if (listing.facebookShopEnabled && 
        process.env.META_ACCESS_TOKEN && 
        process.env.META_CATALOG_ID) {
      try {
        console.log(`Auto-syncing new listing ${finalItemId} to Facebook catalog...`);
        
        // Include user data for the sync (required for metaPixelAPI.syncProduct)
        const listingWithUser = await prisma.listing.findUnique({
          where: { id: listing.id },
          include: {
            user: {
              select: {
                name: true,
                id: true
              }
            }
          }
        });

        if (listingWithUser) {
          const syncResult = await metaPixelAPI.syncProduct(listingWithUser);
          
          if (syncResult.success) {
            // Update listing with sync success
            await prisma.listing.update({
              where: { id: listing.id },
              data: {
                metaSyncStatus: 'success',
                metaProductId: syncResult.productId || finalItemId,
                metaCatalogId: process.env.META_CATALOG_ID,
                metaLastSync: new Date(),
                metaErrorDetails: null
              }
            });
            
            facebookSyncResult = {
              success: true,
              productId: syncResult.productId,
              message: 'Successfully synced to Facebook catalog'
            };
            
            console.log(`✅ Auto-synced listing ${finalItemId} to Facebook catalog`);
          } else {
            // Update listing with sync error
            await prisma.listing.update({
              where: { id: listing.id },
              data: {
                metaSyncStatus: 'error',
                metaErrorDetails: syncResult.error || 'Unknown sync error',
                metaLastSync: new Date()
              }
            });
            
            facebookSyncResult = {
              success: false,
              error: syncResult.error,
              message: 'Failed to sync to Facebook catalog'
            };
            
            console.error(`❌ Failed to auto-sync listing ${finalItemId}: ${syncResult.error}`);
          }
        }
      } catch (syncError) {
        console.error('Error during Facebook auto-sync:', syncError);
        
        // Update listing with sync error
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            metaSyncStatus: 'error',
            metaErrorDetails: syncError instanceof Error ? syncError.message : 'Auto-sync failed',
            metaLastSync: new Date()
          }
        });
        
        facebookSyncResult = {
          success: false,
          error: syncError instanceof Error ? syncError.message : 'Auto-sync failed',
          message: 'Facebook auto-sync encountered an error'
        };
      }
    } else {
      console.log('Facebook auto-sync skipped: either disabled or environment not configured');
    }

    return NextResponse.json({
      success: true,
      listing,
      itemId: finalItemId,
      facebookSync: facebookSyncResult
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
            zipCode: true,
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

    // Fetch zip code data for all unique zip codes
    const uniqueZipCodes = [...new Set(listings.map(listing => listing.user.zipCode).filter((zipCode): zipCode is string => zipCode !== null))];
    const zipCodeData = await prisma.zipCode.findMany({
      where: {
        code: {
          in: uniqueZipCodes,
        },
      },
    });

    // Create a map for quick lookup
    const zipCodeMap = new Map(zipCodeData.map(zip => [zip.code, zip.area]));

    // Transform listings to include proper neighborhood data
    const transformedListings = listings.map(listing => {
      const userZipCode = listing.user.zipCode;
      const neighborhood = userZipCode ? zipCodeMap.get(userZipCode) || 'Unknown Area' : 'Unknown Area';
      
      return {
        ...listing,
        neighborhood,
      } as typeof listing & { neighborhood: string };
    });

    return NextResponse.json({
      success: true,
      listings: transformedListings,
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

    // Track changes for history events
    const changes: string[] = [];
    
    if (body.status && body.status !== listing.status) {
      changes.push('status');
      await createHistoryEvent(listingId, HistoryEvents.STATUS_CHANGED(listing.status, body.status));
    }
    
    if (body.price && body.price !== listing.price) {
      changes.push('price');
      if (body.price < listing.price) {
        await createHistoryEvent(listingId, HistoryEvents.PRICE_DROP(listing.price, body.price));
      } else {
        await createHistoryEvent(listingId, HistoryEvents.PRICE_INCREASE(listing.price, body.price));
      }
    }
    
    if (body.condition && body.condition !== listing.condition) {
      changes.push('condition');
      await createHistoryEvent(listingId, HistoryEvents.CONDITION_CHANGED(listing.condition, body.condition));
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

    // Create a general "edited" event if there were changes
    if (changes.length > 0) {
      await createHistoryEvent(listingId, HistoryEvents.EDITED(changes.join(', ')));
    }

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