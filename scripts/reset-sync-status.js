import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSyncStatus() {
  try {
    console.log('🔄 Resetting all Facebook sync statuses...');
    
    // Reset all listings to a clean state
    const result = await prisma.listing.updateMany({
      where: {
        facebookShopEnabled: true
      },
      data: {
        metaSyncStatus: null,
        metaLastSync: null,
        metaErrorDetails: null
        // Keep metaProductId as is - we'll let the new logic handle it
      }
    });

    console.log(`✅ Reset sync status for ${result.count} listings`);
    console.log('Now you can run the Facebook catalog sync again!');

  } catch (error) {
    console.error('Error resetting sync status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSyncStatus();




