import { prisma } from './prisma';

/**
 * Facebook Catalog Sync Service
 * Automatically syncs product changes to Facebook's catalog
 */

export interface FacebookSyncOptions {
  action: 'create' | 'update' | 'delete';
  listingId: string;
  immediate?: boolean; // Whether to sync immediately or batch
}

export interface FacebookProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  availability: string;
  brand?: string;
  category: string;
  images: string[];
  videoUrl?: string;
  url?: string;
  salePrice?: number | null;
}

/**
 * Maps our condition values to Facebook's exact expected format
 * Facebook expects: New, Refurbished, Used (like new), Used (good), Used (fair)
 */
function mapConditionToFacebook(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'new': 'New',
    'new with tags': 'New',
    'new without tags': 'New',
    'refurbished': 'Refurbished',
    'used': 'Used (good)',
    'used like new': 'Used (like new)',
    'used good': 'Used (good)',
    'used fair': 'Used (fair)',
    'used poor': 'Used (fair)',
    'pre-owned': 'Used (good)',
    'second hand': 'Used (good)',
    'vintage': 'Used (good)',
    'antique': 'Used (good)',
    'mint': 'Used (like new)',
    'excellent': 'Used (like new)',
    'very good': 'Used (good)',
    'good': 'Used (good)',
    'fair': 'Used (fair)',
    'poor': 'Used (fair)',
    'acceptable': 'Used (fair)'
  };

  // Convert to lowercase and trim for matching
  const normalizedCondition = condition.toLowerCase().trim();
  
  // Try exact match first
  if (conditionMap[normalizedCondition]) {
    return conditionMap[normalizedCondition];
  }
  
  // Try partial matching for variations
  for (const [key, value] of Object.entries(conditionMap)) {
    if (normalizedCondition.includes(key) || key.includes(normalizedCondition)) {
      return value;
    }
  }
  
  // Default fallback based on common patterns
  if (normalizedCondition.includes('new')) return 'New';
  if (normalizedCondition.includes('refurbish')) return 'Refurbished';
  if (normalizedCondition.includes('like new') || normalizedCondition.includes('mint') || normalizedCondition.includes('excellent')) return 'Used (like new)';
  if (normalizedCondition.includes('good') || normalizedCondition.includes('very good')) return 'Used (good)';
  if (normalizedCondition.includes('fair') || normalizedCondition.includes('poor') || normalizedCondition.includes('acceptable')) return 'Used (fair)';
  
  // Default fallback
  console.log(`⚠️ Unknown condition value: "${condition}", defaulting to "Used (good)"`);
  return 'Used (good)';
}

/**
 * Main sync function that can be called from anywhere in the app
 */
export async function syncListingToFacebook(options: FacebookSyncOptions) {
  try {
    console.log(`🚀 Facebook sync triggered: ${options.action} for listing ${options.listingId}`);
    
    // Get the listing data first to debug what we're working with
    const listing = await prisma.listing.findUnique({
      where: { itemId: options.listingId },
      select: {
        itemId: true,
        title: true,
        price: true,
        quantity: true,
        metaProductId: true,
        metaSyncStatus: true,
        facebookShopEnabled: true
      }
    });

    if (!listing) {
      console.error(`❌ Listing ${options.listingId} not found in database`);
      return { success: false, error: 'Listing not found' };
    }

    console.log(`📋 SYNC DEBUG - Listing ${options.listingId}:`, {
      title: listing.title,
      price: listing.price,
      quantity: listing.quantity,
      metaProductId: listing.metaProductId,
      metaSyncStatus: listing.metaSyncStatus,
      facebookShopEnabled: listing.facebookShopEnabled,
      action: options.action
    });
    
    switch (options.action) {
      case 'create':
        console.log(`🆕 Creating new product in Facebook for listing ${options.listingId}`);
        return await createProductInFacebook(options.listingId);
      case 'update':
        console.log(`🔄 Updating existing product in Facebook for listing ${options.listingId}`);
        return await updateProductInFacebook(options.listingId);
      case 'delete':
        console.log(`🗑️ Deleting product from Facebook for listing ${options.listingId}`);
        return await deleteProductFromFacebook(options.listingId);
      default:
        throw new Error(`Unknown sync action: ${options.action}`);
    }
  } catch (error) {
    console.error('❌ Facebook catalog sync failed:', error);
    // Don't throw - we don't want sync failures to break the main app
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new product in Facebook's catalog
 */
async function createProductInFacebook(listingId: string): Promise<{ success: boolean; facebookId?: string; error?: string }> {
    try {
      // Get listing data from database with price history
      const listing = await prisma.listing.findUnique({
        where: { itemId: listingId },
        include: {
          priceHistory: {
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      });

    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    // Check if we already have a valid Facebook product ID for this listing
    if (listing.metaProductId && listing.metaProductId !== listing.itemId && !isNaN(Number(listing.metaProductId))) {
      console.log(`Listing ${listingId} already has valid Facebook product ID: ${listing.metaProductId}, updating with enhanced fields`);
      // Always update existing products to ensure all fields are filled in
      return await updateProductInFacebook(listingId);
    }
    
    // If no metaProductId, check if product exists in Facebook catalog by retailer_id
    const retailerId = `${listing.itemId}`;
    console.log(`Checking if product with retailer_id ${retailerId} exists in Facebook catalog...`);
    const productExists = await checkProductExistsInFacebook(listingId, retailerId);
    console.log(`Product exists check result: ${productExists}`);
    
    if (productExists) {
      console.log(`Product with retailer_id ${retailerId} already exists in Facebook catalog, but we don't have a valid metaProductId`);
      console.log(`Creating new product instead of updating (this will create a duplicate that you can clean up in Facebook)`);
      // Don't try to update - just create a new product
      // The user can clean up duplicates in Facebook Commerce Manager
    }

          // Debug photos and video data
      console.log('Photos Debug:', {
        photos: listing.photos,
        photosType: typeof listing.photos,
        extractedImages: getImagesFromPhotos(listing.photos)
      });
      
      console.log('Video Debug:', {
        videoUrl: listing.videoUrl,
        extractedVideo: getVideoUrl(listing)
      });

      // Comprehensive listing data debug
      console.log('🔍 LISTING DATA DEBUG:', {
        itemId: listing.itemId,
        title: listing.title,
        price: {
          value: listing.price,
          type: typeof listing.price,
          parsed: Number(listing.price),
          isNaN: isNaN(Number(listing.price))
        },
        quantity: {
          value: listing.quantity,
          type: typeof listing.quantity,
          parsed: Number(listing.quantity),
          isNaN: isNaN(Number(listing.quantity)),
          isZero: listing.quantity === 0,
          isNull: listing.quantity === null,
          isUndefined: listing.quantity === undefined
        },
        description: listing.description,
        brand: listing.brand,
        department: listing.department,
        category: listing.category,
        condition: {
          original: listing.condition,
          mapped: mapConditionToFacebook(listing.condition)
        },
        status: listing.status,
        material: listing.material,
        color: listing.color,
        size: listing.size,
        gender: listing.gender,
        ageGroup: listing.ageGroup,
        dimensions: {
          width: listing.width,
          height: listing.height,
          depth: listing.depth
        }
      });

      // Calculate Facebook sale price based on discount schedule
      const { calculateFacebookSalePrice, isListingActiveForFacebook, getEffectiveFacebookPrice } = await import('./discount-schedule');
      const discountScheduleData = listing.discountSchedule as any;
      const scheduleType = discountScheduleData?.type || 'Classic-60';
      const discountSchedule = (await import('./discount-schedule')).DISCOUNT_SCHEDULES[scheduleType];
      
      // Check if listing should be active for Facebook sync
      if (discountSchedule && !isListingActiveForFacebook(listing.createdAt, discountSchedule, listing.status)) {
        console.log(`🚫 Listing ${listing.itemId} has expired or is inactive - skipping Facebook sync`);
        return { success: false, error: 'Listing expired or inactive' };
      }
      
      let facebookPrice = listing.price;
      let facebookSalePrice = null;
      let shouldUseSalePrice = false;
      
      if (discountSchedule) {
        // Get the original price from price history or current price
        const originalPrice = listing.priceHistory?.[0]?.price || listing.price;
        const salePriceInfo = calculateFacebookSalePrice(
          originalPrice,
          listing.createdAt,
          discountSchedule,
          listing.reservePrice || 0
        );
        
        facebookPrice = salePriceInfo.mainPrice;
        facebookSalePrice = salePriceInfo.salePrice;
        shouldUseSalePrice = salePriceInfo.shouldUseSalePrice;
        
        console.log('💰 Facebook Price Calculation:', {
          originalPrice,
          currentPrice: listing.price,
          facebookPrice,
          facebookSalePrice,
          shouldUseSalePrice,
          scheduleType,
          daysSinceCreation: Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          isActive: isListingActiveForFacebook(listing.createdAt, discountSchedule, listing.status)
        });
      }

      // Prepare product data for Facebook
      const productData: FacebookProductData = {
        id: listing.itemId,
        title: listing.title,
        description: listing.description,
        price: facebookPrice,
        condition: mapConditionToFacebook(listing.condition),
        availability: listing.status === 'active' ? 'in stock' : 'out of stock',
        brand: listing.brand || undefined,
        category: `${listing.department} > ${listing.category}`,
        images: getImagesFromPhotos(listing.photos),
        videoUrl: getVideoUrl(listing),
        url: `${process.env.NEXT_PUBLIC_APP_URL}/list-item/${listing.itemId}`,
        salePrice: facebookSalePrice
      };

          // Call Facebook's API to create product
      console.log('Facebook API Debug:', {
        catalogId: process.env.META_CATALOG_ID,
        accessToken: process.env.META_ACCESS_TOKEN ? `${process.env.META_ACCESS_TOKEN.substring(0, 20)}...` : 'NOT SET',
        url: `https://graph.facebook.com/v18.0/${process.env.META_CATALOG_ID}/products`
      });

      // Debug the actual data being sent to Facebook
      const requestBody = {
        name: productData.title,
        description: productData.description,
        price: Number(productData.price),
        currency: 'USD',
        condition: mapConditionToFacebook(listing.condition),
        availability: productData.availability,
        brand: productData.brand,
        category: productData.category,
        image_url: productData.images[0] || `${process.env.NEXT_PUBLIC_APP_URL}/public/cardboard.jpg`,
        // Add additional images if available (Facebook supports up to 10)
        additional_image_urls: productData.images.slice(1, 10).filter(Boolean),
        retailer_id: listing.itemId,
        // Additional fields to make the product more complete
        quantity: Number(listing.quantity) || 1,
        url: productData.url && !productData.url.includes('localhost') ? productData.url : undefined,
        // Product details
        material: listing.material || undefined,
        color: listing.color || undefined,
        size: listing.size || undefined,
        gender: listing.gender || undefined,
        age_group: listing.ageGroup || 'adult', // Default to adult if not specified
        pattern: listing.pattern || undefined,
        style: listing.style || undefined,
        // Product identifiers
        gtin: listing.serialNumber || listing.modelNumber || undefined,
        mpn: listing.modelNumber || undefined,
        // Additional metadata
        item_group_id: `group_${listing.department}_${listing.category}`,
        // Rich description (can include HTML)
        rich_text_description: productData.description,
        // Dimensions if available
        ...(listing.width && { width: listing.width }),
        ...(listing.height && { height: listing.height }),
        ...(listing.depth && { depth: listing.depth }),
        // Additional Facebook-specific fields
        product_type: `${listing.department} > ${listing.category}`,
        vendor_id: listing.brand || process.env.META_BUSINESS_ID || undefined,
        mobile_link: productData.url && !productData.url.includes('localhost') ? productData.url : undefined,
        // Facebook product category (required for better categorization)
        facebook_product_category: listing.googleProductCategory || `${listing.department} > ${listing.category}`,
        // Custom labels for better organization
        custom_label_0: listing.department || undefined,
        custom_label_1: listing.category || undefined,
        custom_label_2: listing.brand || undefined,
        // Return policy (1 day for all purchases)
        return_policy_days: 1,
        // Additional fields for better product visibility
        allow_preorders: false,
        expiration_date: undefined, // Can be set if needed
        estimated_margin: undefined, // Can be calculated if needed
        rating_average: undefined, // Can be added if you have ratings
        rating_count: undefined,   // Can be added if you have ratings
        // Sale price for discount schedule integration
        ...(productData.salePrice && shouldUseSalePrice && { sale_price: productData.salePrice })
      };

              // Only add URL if it's a public URL (not localhost)
        if (productData.url && !productData.url.includes('localhost')) {
          requestBody.url = productData.url;
        }
        
        // Add video URL if available
        if (productData.videoUrl) {
          (requestBody as any).video_url = productData.videoUrl;
          console.log(`🎥 Adding video to Facebook product: ${productData.videoUrl}`);
        }
        
        // Add sale price if available and should be used
        if (productData.salePrice && shouldUseSalePrice) {
          (requestBody as any).sale_price = productData.salePrice;
          console.log(`💰 Adding sale price to Facebook product: $${productData.salePrice}`);
        }
      
      console.log('📤 REQUEST BODY DEBUG:', {
        fullRequest: requestBody,
        criticalFields: {
          name: requestBody.name,
          price: {
            value: requestBody.price,
            type: typeof requestBody.price,
            isNaN: isNaN(requestBody.price)
          },
          quantity: {
            value: requestBody.quantity,
            type: typeof requestBody.quantity,
            isNaN: isNaN(requestBody.quantity)
          },
          currency: requestBody.currency,
          condition: requestBody.condition,
          availability: requestBody.availability,
          retailer_id: requestBody.retailer_id
        }
      });

      console.log('💰 PRICE VALIDATION:', {
        originalPrice: productData.price,
        parsedPrice: Number(productData.price),
        finalPrice: requestBody.price,
        priceType: typeof requestBody.price,
        isNaN: isNaN(requestBody.price)
      });

      console.log('📦 QUANTITY VALIDATION:', {
        originalQuantity: listing.quantity,
        parsedQuantity: Number(listing.quantity),
        fallbackQuantity: Number(listing.quantity) || 1,
        finalQuantity: requestBody.quantity,
        quantityType: typeof requestBody.quantity,
        isZero: requestBody.quantity === 0,
        isNull: requestBody.quantity === null,
        isUndefined: requestBody.quantity === undefined
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.META_CATALOG_ID}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
        },
        body: JSON.stringify(requestBody)
      });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`✅ Product created in Facebook catalog: ${result.id}`);
    
    // Debug the Facebook API response
    console.log('📥 FACEBOOK API RESPONSE:', {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      result: result,
      headers: Object.fromEntries(response.headers.entries())
    });
    
         // Update local database to mark as synced
     await prisma.listing.update({
       where: { itemId: listingId },
       data: { 
         metaProductId: result.id,
         metaLastSync: new Date(),
         metaSyncStatus: 'synced'
       }
     });

    return { success: true, facebookId: result.id };
  } catch (error) {
    console.error('Failed to create product in Facebook:', error);
    throw error;
  }
}

/**
 * Update an existing product in Facebook's catalog
 */
async function updateProductInFacebook(listingId: string): Promise<{ success: boolean; facebookId?: string; error?: string }> {
    try {
      // Get listing data from database with price history
      const listing = await prisma.listing.findUnique({
        where: { itemId: listingId },
        include: {
          priceHistory: {
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      });

    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

             // Check if metaProductId is actually a real Facebook product ID (numeric) or just the itemId
    if (!listing.metaProductId || listing.metaProductId === listing.itemId || isNaN(Number(listing.metaProductId))) {
      // If no Facebook ID, or if it's just the itemId, create the product instead
      console.log(`Listing ${listingId} has invalid metaProductId: ${listing.metaProductId}, creating new product`);
      return await createProductInFacebook(listingId);
    }

          // Calculate Facebook sale price based on discount schedule
      const { calculateFacebookSalePrice, isListingActiveForFacebook, getEffectiveFacebookPrice } = await import('./discount-schedule');
      const discountScheduleData = listing.discountSchedule as any;
      const scheduleType = discountScheduleData?.type || 'Classic-60';
      const discountSchedule = (await import('./discount-schedule')).DISCOUNT_SCHEDULES[scheduleType];
      
      // Check if listing should be active for Facebook sync
      if (discountSchedule && !isListingActiveForFacebook(listing.createdAt, discountSchedule, listing.status)) {
        console.log(`🚫 Listing ${listing.itemId} has expired or is inactive - skipping Facebook update`);
        return { success: false, error: 'Listing expired or inactive' };
      }
      
      let facebookPrice = listing.price;
      let facebookSalePrice = null;
      let shouldUseSalePrice = false;
      
      if (discountSchedule) {
        // Get the original price from price history or current price
        const originalPrice = listing.priceHistory?.[0]?.price || listing.price;
        const salePriceInfo = calculateFacebookSalePrice(
          originalPrice,
          listing.createdAt,
          discountSchedule,
          listing.reservePrice || 0
        );
        
        facebookPrice = salePriceInfo.mainPrice;
        facebookSalePrice = salePriceInfo.salePrice;
        shouldUseSalePrice = salePriceInfo.shouldUseSalePrice;
        
        console.log('💰 Facebook Update Price Calculation:', {
          originalPrice,
          currentPrice: listing.price,
          facebookPrice,
          facebookSalePrice,
          shouldUseSalePrice,
          scheduleType,
          daysSinceCreation: Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          isActive: isListingActiveForFacebook(listing.createdAt, discountSchedule, listing.status)
        });
      }

      // Prepare updated product data
      const productData: FacebookProductData = {
        id: listing.itemId,
        title: listing.title,
        description: listing.description,
        price: facebookPrice,
        condition: mapConditionToFacebook(listing.condition),
        availability: listing.status === 'active' ? 'in stock' : 'out of stock',
        brand: listing.brand || undefined,
        category: `${listing.department} > ${listing.category}`,
        images: getImagesFromPhotos(listing.photos),
        videoUrl: getVideoUrl(listing),
        url: `${process.env.NEXT_PUBLIC_APP_URL}/list-item/${listing.itemId}`,
        salePrice: facebookSalePrice
      };

      // Debug the listing data being used for update
      console.log('🔍 UPDATE LISTING DATA DEBUG:', {
        itemId: listing.itemId,
        title: listing.title,
        price: {
          value: listing.price,
          type: typeof listing.price,
          parsed: Number(listing.price),
          isNaN: isNaN(Number(listing.price))
        },
        quantity: {
          value: listing.quantity,
          type: typeof listing.quantity,
          parsed: Number(listing.quantity),
          isNaN: isNaN(Number(listing.quantity)),
          isZero: listing.quantity === 0,
          isNull: listing.quantity === null,
          isUndefined: listing.quantity === undefined
        },
        description: listing.description,
        brand: listing.brand,
        department: listing.department,
        category: listing.category,
        condition: {
          original: listing.condition,
          mapped: mapConditionToFacebook(listing.condition)
        },
        status: listing.status
      });

                           // Call Facebook's API to update product
         console.log('Facebook API Update Debug:', {
           metaProductId: listing.metaProductId,
           accessToken: process.env.META_ACCESS_TOKEN ? `${process.env.META_ACCESS_TOKEN.substring(0, 20)}...` : 'NOT SET',
           url: `https://graph.facebook.com/v18.0/${listing.metaProductId}`
         });

                // Debug the actual data being sent to Facebook
        const updateRequestBody = {
          name: productData.title,
          description: productData.description,
          price: productData.price,
          currency: 'USD',
          condition: mapConditionToFacebook(listing.condition),
          availability: productData.availability,
          brand: productData.brand,
          category: productData.category,
                  image_url: productData.images[0] || `${process.env.NEXT_PUBLIC_APP_URL}/public/cardboard.jpg`,
        // Add additional images if available (Facebook supports up to 10)
        additional_image_urls: productData.images.slice(1, 10).filter(Boolean),
        retailer_id: listing.itemId,
          // Additional fields to make the product more complete
          quantity: Number(listing.quantity) || 1,
          url: productData.url && !productData.url.includes('localhost') ? productData.url : undefined,
                  // Product details
        material: listing.material || undefined,
        color: listing.color || undefined,
        size: listing.size || undefined,
        gender: listing.gender || undefined,
        age_group: listing.ageGroup || 'adult', // Default to adult if not specified
        pattern: listing.pattern || undefined,
        style: listing.style || undefined,
          // Product identifiers
          gtin: listing.serialNumber || listing.modelNumber || undefined,
          mpn: listing.modelNumber || undefined,
          // Additional metadata
          item_group_id: `group_${listing.department}_${listing.category}`,
                  // Rich description (can include HTML)
        rich_text_description: productData.description,
        // Dimensions if available
        ...(listing.width && { width: listing.width }),
        ...(listing.height && { height: listing.height }),
        ...(listing.depth && { depth: listing.depth }),
        // Additional Facebook-specific fields
        product_type: `${listing.department} > ${listing.category}`,
        vendor_id: listing.brand || process.env.META_BUSINESS_ID || undefined,
        mobile_link: productData.url && !productData.url.includes('localhost') ? productData.url : undefined,
        // Facebook product category (required for better categorization)
        facebook_product_category: listing.googleProductCategory || `${listing.department} > ${listing.category}`,
        // Custom labels for better organization
        custom_label_0: listing.department || undefined,
        custom_label_1: listing.category || undefined,
        custom_label_2: listing.brand || undefined,
        // Return policy (1 day for all purchases)
        return_policy_days: 1,
        // Additional fields for better product visibility
        allow_preorders: false,
        expiration_date: undefined, // Can be set if needed
        estimated_margin: undefined, // Can be calculated if needed
        rating_average: undefined, // Can be added if you have ratings
        rating_count: undefined,   // Can be added if you have ratings
        // Sale price for discount schedule integration
        ...(productData.salePrice && shouldUseSalePrice && { sale_price: productData.salePrice })
          };

        // Only add URL if it's a public URL (not localhost)
        if (productData.url && !productData.url.includes('localhost')) {
          updateRequestBody.url = productData.url;
        }
        
        // Add video URL if available
        if (productData.videoUrl) {
          (updateRequestBody as any).video_url = productData.videoUrl;
          console.log(`🎥 Adding video to Facebook product update: ${productData.videoUrl}`);
        }
        
        // Add sale price if available and should be used
        if (productData.salePrice && shouldUseSalePrice) {
          (updateRequestBody as any).sale_price = productData.salePrice;
          console.log(`💰 Adding sale price to Facebook product update: $${productData.salePrice}`);
        }
        
        console.log('📤 UPDATE REQUEST BODY DEBUG:', {
          fullRequest: updateRequestBody,
          criticalFields: {
            name: updateRequestBody.name,
            price: {
              value: updateRequestBody.price,
              type: typeof updateRequestBody.price,
              isNaN: isNaN(updateRequestBody.price)
            },
            quantity: {
              value: updateRequestBody.quantity,
              type: typeof updateRequestBody.quantity,
              isNaN: isNaN(updateRequestBody.quantity)
            },
            currency: updateRequestBody.currency,
            condition: updateRequestBody.condition,
            availability: updateRequestBody.availability,
            retailer_id: updateRequestBody.retailer_id
          }
        });

        console.log('💰 UPDATE PRICE VALIDATION:', {
          originalPrice: productData.price,
          parsedPrice: Number(productData.price),
          finalPrice: updateRequestBody.price,
          priceType: typeof updateRequestBody.price,
          isNaN: isNaN(updateRequestBody.price)
        });

        console.log('📦 UPDATE QUANTITY VALIDATION:', {
          originalQuantity: listing.quantity,
          parsedQuantity: Number(listing.quantity),
          fallbackQuantity: Number(listing.quantity) || 1,
          finalQuantity: updateRequestBody.quantity,
          quantityType: typeof updateRequestBody.quantity,
          isZero: updateRequestBody.quantity === 0,
          isNull: updateRequestBody.quantity === null,
          isUndefined: updateRequestBody.quantity === undefined
        });

              const response = await fetch(`https://graph.facebook.com/v18.0/${listing.metaProductId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
          },
          body: JSON.stringify(updateRequestBody)
        });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Facebook API update failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Product updated in Facebook catalog:', {
      metaProductId: listing.metaProductId,
      response: result,
      status: response.status
    });

    // Update local database to mark as synced
    await prisma.listing.update({
      where: { itemId: listingId },
      data: { 
        metaLastSync: new Date(),
        metaSyncStatus: 'synced'
      }
    });
     return { success: true, facebookId: listing.metaProductId };
  } catch (error) {
    console.error('Failed to update product in Facebook:', error);
    throw error;
  }
}

/**
 * Delete a product from Facebook's catalog
 */
async function deleteProductFromFacebook(listingId: string) {
  try {
         // Get listing data to find Facebook catalog ID
     const listing = await prisma.listing.findUnique({
       where: { itemId: listingId },
       select: { metaProductId: true }
     });

     if (!listing?.metaProductId) {
       console.log(`No Facebook catalog ID found for listing ${listingId}, skipping deletion`);
       return { success: true, message: 'No Facebook catalog ID to delete' };
     }

                     // Call Facebook's API to delete product
       const response = await fetch(`https://graph.facebook.com/v18.0/${listing.metaProductId}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
         }
       });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
     }

     console.log(`Product deleted from Facebook catalog: ${listing.metaProductId}`);
     return { success: true, facebookId: listing.metaProductId };
  } catch (error) {
    console.error('Failed to delete product from Facebook:', error);
    throw error;
  }
}

/**
 * Batch sync multiple listings (for efficiency)
 */
export async function batchSyncListings(listingIds: string[], action: 'create' | 'update' | 'delete') {
  console.log(`Batch syncing ${listingIds.length} listings with action: ${action}`);
  
  const results = [];
  for (const listingId of listingIds) {
    try {
      const result = await syncListingToFacebook({ action, listingId });
      results.push({ listingId, ...result });
    } catch (error) {
      results.push({ 
        listingId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`Batch sync complete: ${successCount} successful, ${failureCount} failed`);
  return { results, successCount, failureCount };
}

/**
 * Check if a product already exists in Facebook catalog by retailer_id
 */
async function checkProductExistsInFacebook(listingId: string, retailerId: string): Promise<boolean> {
  try {
    // Search for products with the same retailer_id in the catalog
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.META_CATALOG_ID}/products?retailer_id=${retailerId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.data && data.data.length > 0;
    }
    return false;
  } catch (error) {
    console.log('Error checking if product exists in Facebook:', error);
    return false;
  }
}

/**
 * Get images from photos JSON field
 */
function getImagesFromPhotos(photos: any): string[] {
  if (!photos) return [];

  // Handle different photo formats
  if (Array.isArray(photos)) {
    return photos.filter(Boolean);
  }

  if (typeof photos === 'object') {
    // Try to get all available photos
    const imageUrls = [];
    if (photos.proof) imageUrls.push(photos.proof);
    if (photos.hero) imageUrls.push(photos.hero);
    if (photos.back) imageUrls.push(photos.back);
    if (photos.additional && Array.isArray(photos.additional)) {
      photos.additional.forEach((photo: any) => {
        if (photo) imageUrls.push(photo);
      });
    }
    return imageUrls;
  }

  return [];
}

/**
 * Get video URL from listing data
 * Facebook supports video_url field for product videos
 */
function getVideoUrl(listing: any): string | undefined {
  if (!listing) return undefined;
  
  // Check for videoUrl field first
  if (listing.videoUrl && typeof listing.videoUrl === 'string' && listing.videoUrl.trim()) {
    const videoUrl = listing.videoUrl.trim();
    
    // Validate URL format
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      // Don't include localhost or development URLs
      if (!videoUrl.includes('localhost') && !videoUrl.includes('127.0.0.1')) {
        console.log(`🎥 Video URL found: ${videoUrl}`);
        return videoUrl;
      } else {
        console.log(`⚠️ Skipping localhost video URL: ${videoUrl}`);
      }
    } else {
      console.log(`⚠️ Invalid video URL format: ${videoUrl}`);
    }
  }
  
  // Note: Only videoUrl field is supported in current Listing model
  // Video object structure not available
  
  console.log(`📹 No valid video URL found for listing ${listing.itemId}`);
  return undefined;
}
