import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMetaProductIds() {
  try {
    console.log('🔍 Finding listings with invalid metaProductId values...');
    
    // Find listings where metaProductId equals itemId (invalid)
    const invalidListings = await prisma.listing.findMany({
      where: {
        metaProductId: {
          not: null
        },
        facebookShopEnabled: true
      },
      select: {
        id: true,
        itemId: true,
        metaProductId: true,
        title: true
      }
    });

    console.log(`Found ${invalidListings.length} listings with metaProductId values`);

    let fixedCount = 0;
    for (const listing of invalidListings) {
      // Check if metaProductId is invalid (equals itemId or not numeric)
      if (listing.metaProductId === listing.itemId || isNaN(Number(listing.metaProductId))) {
        console.log(`❌ Invalid metaProductId for ${listing.itemId}: "${listing.metaProductId}" (should be numeric Facebook ID)`);
        
        // Reset the invalid metaProductId
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            metaProductId: null,
            metaSyncStatus: null,
            metaLastSync: null,
            metaErrorDetails: null
          }
        });
        
        console.log(`✅ Reset metaProductId for ${listing.itemId}`);
        fixedCount++;
      } else {
        console.log(`✅ Valid metaProductId for ${listing.itemId}: ${listing.metaProductId}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} invalid metaProductId values`);
    console.log('Now you can run the Facebook catalog sync again!');

  } catch (error) {
    console.error('Error fixing metaProductId values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMetaProductIds();
