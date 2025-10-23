/**
 * Direct import script - Connects to Neon backup branch and imports data
 * This eliminates the manual export/import step
 * 
 * Run with: node scripts/import-from-backup-branch.js
 */

const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

// Main database (current schema)
const prisma = new PrismaClient();

// Backup database connection
const backupClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Bsjwzn3Kk7Vq@ep-old-bread-aefqou3d-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function importFromBackup() {
  console.log('🔄 Starting direct import from backup branch...\n');

  try {
    // Connect to backup database
    await backupClient.connect();
    console.log('✅ Connected to backup branch\n');

    // Query old data from backup
    const result = await backupClient.query(`
      SELECT 
        id,
        "itemNumber",
        description,
        quantity as "totalQuantity",
        "receiveStatus",
        "receivedQuantity",
        "receivedAt",
        "receivedBy"
      FROM "InventoryItem"
      ORDER BY id
    `);

    const oldData = result.rows;
    console.log(`📊 Found ${oldData.length} items in backup\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of oldData) {
      try {
        const itemId = item.id;
        const totalQty = item.totalQuantity || 0;
        const receivedQty = item.receivedQuantity || 0;

        // Check if item still exists in main database
        const currentItem = await prisma.inventoryItem.findUnique({
          where: { id: itemId },
        });

        if (!currentItem) {
          console.log(`⚠️  Item ${item.itemNumber} no longer exists in main DB, skipping`);
          skipped++;
          continue;
        }

        // Create disposition records based on old data
        // In the old system: if receivedQuantity > 0, those items were marked as RECEIVED
        // The rest (totalQuantity - receivedQuantity) were MANIFESTED
        
        if (receivedQty > 0) {
          // Create RECEIVED disposition for items that were marked as received
          await prisma.inventoryDisposition.create({
            data: {
              inventoryItemId: itemId,
              status: 'RECEIVED',
              quantity: receivedQty,
              notes: null,
              createdBy: item.receivedBy || null,
            },
          });
          created++;
          
          const manifestedQty = totalQty - receivedQty;
          console.log(`✅ Item ${item.itemNumber}: ${receivedQty} RECEIVED${manifestedQty > 0 ? `, ${manifestedQty} manifested` : ''}`);
        } else {
          // Item was never received, so it stays manifested (no dispositions needed)
          console.log(`ℹ️  Item ${item.itemNumber}: Manifested (${totalQty} units)`);
          skipped++;
        }

      } catch (error) {
        console.error(`❌ Error processing item ${item.itemNumber}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`  ✅ Disposition records created: ${created}`);
    console.log(`  ℹ️  Items skipped (manifested or not found): ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`\n✨ Import complete!`);

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await backupClient.end();
    await prisma.$disconnect();
  }
}

importFromBackup()
  .then(() => {
    console.log('\n🎉 Data restoration successful!');
    console.log('You can now refresh your Inventory Receiving page to see the restored data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Data restoration failed:', error);
    process.exit(1);
  });

