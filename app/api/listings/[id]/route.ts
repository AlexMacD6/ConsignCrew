import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateGender, validateAgeGroup, validateItemGroupId } from "@/lib/product-specifications";
import { checkAndReleaseListingHold } from "@/lib/auto-release-holds";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check and release this specific listing's hold if expired
    await checkAndReleaseListingHold(id);
    
    const { searchParams } = new URL(request.url);
    const isEdit = searchParams.get('edit') === 'true';
    const session = await auth.api.getSession({ headers: request.headers });

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Only require authentication for edit access
    if (isEdit && !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: {
        itemId: id,
      },
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
        videos: {
          select: {
            id: true,
            rawVideoKey: true,
            processedVideoKey: true,
            thumbnailKey: true,
            frameKeys: true,
            duration: true,
            resolution: true,
            status: true,
            originalFilename: true,
            originalSize: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          // Get ALL videos, not just one
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: `Listing with itemId '${id}' not found` },
        { status: 404 }
      );
    }

    // Check ownership only for edit access
    if (isEdit && session?.user?.id && listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 }
      );
    }

    // Look up neighborhood from user's zip code
    let neighborhood = 'Unknown Area';
    if (listing.user.zipCode) {
      const zipCodeRecord = await prisma.zipCode.findFirst({
        where: { code: listing.user.zipCode },
      });
      if (zipCodeRecord) {
        neighborhood = zipCodeRecord.area;
      }
    }

    // Transform the data to include organization information and video
    const transformedListing = {
      ...listing,
      neighborhood, // Add the looked-up neighborhood
      user: {
        ...listing.user,
        organization: listing.user.members[0]?.organization || null,
        organizations: listing.user.members.map(member => member.organization),
      },
      // Only include singular video if there's exactly one video and no videoUrl
      // If there are multiple videos, don't include the singular video field
      video: (listing.videos.length === 1 && !listing.videoUrl) ? listing.videos[0] : null,
    };

    return NextResponse.json({
      success: true,
      listing: transformedListing,
    });

  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Get the existing listing to check ownership
    const existingListing = await prisma.listing.findUnique({
      where: { itemId: id },
      include: { user: true },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: `Listing with itemId '${id}' not found` },
        { status: 404 }
      );
    }

    // Check if the user owns this listing
    if (existingListing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      department,
      category,
      subCategory,
      title,
      price,
      description,
      brand,
      height,
      width,
      depth,
      serialNumber,
      modelNumber,
      estimatedRetailPrice,
      discountSchedule,
      photos,
      videoUrl,
      // Facebook Shop Integration Fields
      facebookShopEnabled,
      facebookBrand,
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


      // Treasure fields
      isTreasure,
      treasureReason,
      
      // Video fields
      videoIds,
    } = body;

    // Debug video IDs
    console.log("🎬 PUT request received videoIds:", videoIds);
    console.log("🎬 VideoIds type:", typeof videoIds, "Array:", Array.isArray(videoIds));
    if (videoIds && Array.isArray(videoIds)) {
      console.log("🎬 VideoIds length:", videoIds.length);
      console.log("🎬 VideoIds content:", videoIds);
      
      // Validate that all video IDs exist in the database
      const existingVideos = await prisma.video.findMany({
        where: {
          id: {
            in: videoIds
          }
        },
        select: {
          id: true
        }
      });
      
      console.log("🎬 Found existing videos:", existingVideos.length);
      console.log("🎬 Existing video IDs:", existingVideos.map(v => v.id));
      
      const existingVideoIds = existingVideos.map(v => v.id);
      const missingVideoIds = videoIds.filter(id => !existingVideoIds.includes(id));
      
      if (missingVideoIds.length > 0) {
        console.error("🚨 Missing video IDs:", missingVideoIds);
        return NextResponse.json({
          error: `Video records not found: ${missingVideoIds.join(', ')}`,
          missingIds: missingVideoIds,
          existingIds: existingVideoIds
        }, { status: 400 });
      }
    }

    // Validate required fields
    if (!title || !price || !facebookCondition || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { itemId: id },
      data: {
        department,
        category,
        subCategory,
        title,
        price: parseFloat(price),
        description,
        brand: brand || null,
        height: height || null,
        width: width || null,
        depth: depth || null,
        serialNumber: serialNumber || null,
        modelNumber: modelNumber || null,
        estimatedRetailPrice: estimatedRetailPrice ? parseFloat(estimatedRetailPrice) : null,
        discountSchedule: discountSchedule || { type: "Classic-60" },
        photos: photos || {},
        // Clear videoUrl if we have multiple videos, otherwise use the provided videoUrl
        videoUrl: (videoIds && Array.isArray(videoIds) && videoIds.length > 0) ? null : (videoUrl || null),
        // Facebook Shop Integration Fields
        facebookShopEnabled: facebookShopEnabled ?? true,
        facebookBrand: facebookBrand || null,
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
        ageGroup: ageGroup || null,
        material: material || null,
        pattern: pattern || null,
        style: style || null,
        tags: tags || [],

        // Treasure fields
        isTreasure: isTreasure || false,
        treasureReason: treasureReason || null,
        updatedAt: new Date(),
        
        // Video relationships - connect multiple videos if provided
        ...(videoIds && Array.isArray(videoIds) && videoIds.length > 0 && {
          videos: {
            set: [], // Clear existing connections first
            connect: videoIds
              .filter((videoId: string) => {
                // Only connect videos that we've already validated exist
                const exists = videoId && typeof videoId === 'string' && videoId.trim() !== '';
                console.log("🎬 Connecting video ID:", videoId, exists ? "✅" : "❌ (invalid)");
                return exists;
              })
              .map((videoId: string) => ({ id: videoId }))
          }
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        videos: true, // Include connected videos in response
      },
    });

    // Debug the updated listing's videos
    console.log("🎬 Updated listing videos:", updatedListing.videos?.length || 0);
    if (updatedListing.videos && updatedListing.videos.length > 0) {
      console.log("🎬 Connected video IDs:", updatedListing.videos.map(v => v.id));
    }

    // Auto-sync to Facebook catalog if enabled
    if (updatedListing.facebookShopEnabled) {
      try {
        console.log(`🔄 Auto-syncing updated listing ${id} to Facebook catalog...`);
        console.log(`📊 Updated listing data being synced:`, {
          itemId: id,
          title: updatedListing.title,
          price: updatedListing.price,
          quantity: updatedListing.quantity,
          facebookShopEnabled: updatedListing.facebookShopEnabled
        });
        
        // Import and call the Facebook sync service
        const { syncListingToFacebook } = await import('../../../lib/facebook-catalog-sync');
        const syncResult = await syncListingToFacebook({
          action: 'update',
          listingId: id
        });
        
        if (syncResult.success) {
          console.log(`✅ Successfully synced updated listing ${id} to Facebook catalog`);
        } else {
          console.error(`❌ Failed to sync updated listing ${id} to Facebook:`, syncResult);
        }
      } catch (error) {
        console.error('❌ Facebook sync failed for updated listing:', error);
        // Don't fail the listing update if sync fails
      }
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });

  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update listing" },
      { status: 500 }
    );
  }
} 