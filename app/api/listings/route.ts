import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHistoryEvent, HistoryEvents } from '@/lib/listing-history';
import { validateGender, validateAgeGroup, validateItemGroupId } from '@/lib/product-specifications';
import { metaPixelAPI } from '@/lib/meta-pixel-api';
import { trackCatalogUpdate, trackProductStatusChange } from '@/lib/meta-pixel-client';
import { autoReleaseExpiredHolds } from '@/lib/auto-release-holds';

// Generate a unique random 6-character ID using letters and numbers
async function generateUniqueRandomId(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 15; // Increased attempts
  
  console.log('Starting unique ID generation...');
  
  while (attempts < maxAttempts) {
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log(`Attempt ${attempts + 1}: Generated ID: ${result}`);
    
    try {
      // Check if this ID already exists in the database
      const existingListing = await prisma.listing.findUnique({
        where: { itemId: result },
        select: { id: true }
      });
      
      if (!existingListing) {
        console.log(`✅ Found unique ID: ${result} after ${attempts + 1} attempts`);
        return result; // Found a unique ID
      } else {
        console.log(`❌ ID ${result} already exists, retrying...`);
      }
    } catch (dbError) {
      console.error(`Database error checking ID ${result}:`, dbError);
      // Continue to next attempt if database check fails
    }
    
    attempts++;
  }
  
  // If we can't find a unique ID after max attempts, use timestamp-based ID
  console.log(`⚠️ Could not find unique ID after ${maxAttempts} attempts, using timestamp-based ID`);
  const timestamp = Date.now().toString(36).slice(-6).toUpperCase();
  const randomChars = Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const fallbackId = `F${randomChars}${timestamp}`;
  
  console.log(`Generated fallback ID: ${fallbackId}`);
  return fallbackId;
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
      price,
      description,
      brand,
      dimensions,
      serialNumber,
      modelNumber,
      estimatedRetailPrice,
      discountSchedule,
      deliveryCategory,
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
      // Inventory relationship fields
      inventoryItemId,
      inventoryListId,
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
    let finalItemId;
    if (itemId) {
      finalItemId = itemId;
    } else {
      try {
        finalItemId = await generateUniqueRandomId();
        console.log(`Generated unique itemId: ${finalItemId}`);
      } catch (error) {
        console.error('Error generating unique itemId:', error);
        // Fallback to timestamp-based ID if generation fails
        finalItemId = `FALLBACK_${Date.now().toString(36).toUpperCase()}`;
        console.log(`Using fallback itemId: ${finalItemId}`);
      }
    }

    // Transform photos to use CloudFront URLs instead of S3 keys
    const { getPublicUrl } = await import('@/lib/aws-image-store');
    
    const transformedPhotos = {
      staged: photos.staged || null, // AI-generated staged photo URL
      hero: photos.hero?.url ? photos.hero.url : (typeof photos.hero === 'string' ? getPublicUrl(photos.hero) : photos.hero),
      back: photos.back?.url ? photos.back.url : (typeof photos.back === 'string' ? getPublicUrl(photos.back) : photos.back),
      proof: photos.proof?.url ? photos.proof.url : (typeof photos.proof === 'string' ? getPublicUrl(photos.proof) : photos.proof),
      additional: photos.additional?.map((photo: any) => 
        photo.url ? photo.url : (typeof photo === 'string' ? getPublicUrl(photo) : photo)
      ) || []
    };



    console.log(`Attempting to create listing with itemId: ${finalItemId}`);
    
    let listing;
    try {
      listing = await prisma.listing.create({
        data: {
          userId: session.user.id,
          itemId: finalItemId,
          photos: transformedPhotos,
          videoUrl: videoUrl || null,
          department,
          category,
          subCategory,
          title,
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
          deliveryCategory: deliveryCategory || "NORMAL",
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
          // Inventory relationships
          inventoryItems: inventoryItemId ? {
            connect: { id: inventoryItemId }
          } : undefined,
          inventoryLists: inventoryListId ? {
            connect: { id: inventoryListId }
          } : undefined,
          priceHistory: {
            create: {
              price: parseFloat(price),
            },
          },
        },
      });
      console.log(`✅ Listing created successfully with ID: ${listing.id}`);
    } catch (createError) {
      console.error('❌ Error creating listing:', createError);
      if (createError instanceof Error && createError.message.includes('Unique constraint failed')) {
        console.error(`Duplicate itemId detected: ${finalItemId}`);
        // Try to generate a new ID and retry once
        try {
          const newItemId = await generateUniqueRandomId();
          console.log(`Retrying with new itemId: ${newItemId}`);
          
          listing = await prisma.listing.create({
            data: {
              userId: session.user.id,
              itemId: newItemId,
              photos: transformedPhotos,
              videoUrl: videoUrl || null,
              department,
              category,
              subCategory,
              title,
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
              deliveryCategory: deliveryCategory || "NORMAL",
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
              // Inventory relationships
              inventoryItems: inventoryItemId ? {
                connect: { id: inventoryItemId }
              } : undefined,
              inventoryLists: inventoryListId ? {
                connect: { id: inventoryListId }
              } : undefined,
              priceHistory: {
                create: {
                  price: parseFloat(price),
                },
              },
            },
          });
          console.log(`✅ Listing created successfully on retry with ID: ${listing.id}`);
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw new Error(`Failed to create listing after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      } else {
        throw createError;
      }
    }

    // Create initial history event for listing creation
    await createHistoryEvent(finalItemId, HistoryEvents.LISTING_CREATED(title));

    // Auto-sync to Facebook catalog if enabled
    if (listing.facebookShopEnabled) {
      try {
        console.log(`🎯 Auto-syncing new listing ${finalItemId} to Facebook catalog...`);
        console.log(`📊 Listing data being synced:`, {
          itemId: finalItemId,
          title: listing.title,
          price: listing.price,
          quantity: listing.quantity,
          facebookShopEnabled: listing.facebookShopEnabled
        });
        
        // Import and call the Facebook sync service
        const { syncListingToFacebook } = await import('@/lib/facebook-catalog-sync');
        const syncResult = await syncListingToFacebook({
          action: 'create',
          listingId: finalItemId
        });
        
        if (syncResult.success) {
          console.log(`✅ Successfully synced listing ${finalItemId} to Facebook catalog`);
        } else {
          console.error(`❌ Failed to sync listing ${finalItemId} to Facebook:`, syncResult);
        }
      } catch (error) {
        console.error('❌ Facebook sync failed for new listing:', error);
                // Don't fail the listing creation if sync fails
      }
    }

        return NextResponse.json({
      success: true,
      listing,
      itemId: finalItemId
    });

  } catch (error) {
    console.error('❌ Error creating listing:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create listing';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        errorMessage = 'Listing ID already exists. Please try again.';
        statusCode = 409; // Conflict
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = 'Invalid user or video reference.';
        statusCode = 400; // Bad Request
      } else if (error.message.includes('Invalid value')) {
        errorMessage = 'Invalid data provided for listing.';
        statusCode = 400; // Bad Request
      } else {
        errorMessage = error.message;
      }
    }
    
    console.error(`Returning error: ${errorMessage} (Status: ${statusCode})`);
    
    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auto-release any expired holds before querying listings
    await autoReleaseExpiredHolds();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    // Remove pagination limits to allow frontend sorting to work properly
    // With only 65 total listings, we can load all at once
    const limit = parseInt(searchParams.get('limit') || '1000'); // High limit to get all
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
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
      // For public listings, default to showing ACTIVE and PROCESSING (not SOLD)
      if (status === 'active') {
        whereClause.status = {
          in: ['active', 'processing'] // Exclude sold items by default
        };
        console.log('Listings API: Showing active and processing listings (excluding sold)');
      } else {
        whereClause.status = status;
      }
    }

    console.log('Listings API: Where clause:', JSON.stringify(whereClause, null, 2));
    console.log('Listings API: Pagination params - page:', page, 'limit:', limit, 'offset:', offset);
    
    // Get total count for pagination
    const totalCount = await prisma.listing.count({
      where: whereClause,
    });
    
    console.log('Listings API: Total count from database:', totalCount);
    
    // If no listings found with the current filter, let's debug by checking all listings
    if (totalCount === 0) {
      const allListingsCount = await prisma.listing.count();
      console.log('DEBUG: Total listings in database (no filter):', allListingsCount);
      
      if (allListingsCount > 0) {
        const statusCounts = await prisma.listing.groupBy({
          by: ['status'],
          _count: { id: true }
        });
        console.log('DEBUG: Listings by status:', statusCounts);
      }
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
            // Removed nested members/organizations for performance
          },
        },
        // Removed priceHistory for performance - can be loaded separately if needed
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 1000), // Allow all listings for proper frontend sorting
      skip: offset,
    });

    console.log('Listings API: Found', listings.length, 'listings');
    console.log('Listings API: Statuses:', listings.map(l => ({ id: l.itemId, status: l.status })));

    // Fetch zip code data for all unique zip codes (optimized)
    const uniqueZipCodes = [...new Set(listings.map(listing => listing.user.zipCode).filter((zipCode): zipCode is string => zipCode !== null))];
    
    // Only fetch zip codes if we have any and limit the query
    const zipCodeData = uniqueZipCodes.length > 0 ? await prisma.zipCode.findMany({
      where: {
        code: {
          in: uniqueZipCodes.slice(0, 50), // Limit to 50 zip codes for performance
        },
      },
      select: {
        code: true,
        area: true,
        type: true,
        // Only select needed fields
      }
    }) : [];

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
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
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
    
    if (body.facebookCondition && body.facebookCondition !== listing.facebookCondition) {
      changes.push('condition');
      await createHistoryEvent(listingId, HistoryEvents.CONDITION_CHANGED(listing.facebookCondition || 'unknown', body.facebookCondition));
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