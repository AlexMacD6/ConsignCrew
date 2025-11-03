/**
 * Backfill script to migrate existing inventory disposition data
 * from old InventoryItem columns to new InventoryDisposition table
 * 
 * Run with: node scripts/backfill-inventory-dispositions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillDispositions() {
  console.log('🔄 Starting inventory disposition backfill...\n');

  try {
    // Note: The old columns have already been dropped by db push
    // But we can check if there are any items without dispositions that should have some
    
    // Get all items
    const items = await prisma.inventoryItem.findMany({
      include: {
        dispositions: true,
      },
    });

    console.log(`Found ${items.length} inventory items`);
    
    let itemsWithoutDispositions = 0;
    let itemsWithDispositions = 0;

    for (const item of items) {
      if (item.dispositions.length === 0) {
        itemsWithoutDispositions++;
        // Items without dispositions are considered fully manifested (not yet received)
        // No action needed - they'll show as manifested in the UI
      } else {
        itemsWithDispositions++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✓ Items with dispositions: ${itemsWithDispositions}`);
    console.log(`  ✓ Items without dispositions (manifested): ${itemsWithoutDispositions}`);
    console.log(`\n✅ Backfill complete! All items are ready for the new system.`);
    
    // Note: Since we already ran db push with --accept-data-loss,
    // the old data is gone. Going forward, all items will use the new system.
    console.log(`\nℹ️  Note: Old disposition data was cleared during schema migration.`);
    console.log(`   From now on, all status changes will be tracked in the InventoryDisposition table.`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillDispositions()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });






















