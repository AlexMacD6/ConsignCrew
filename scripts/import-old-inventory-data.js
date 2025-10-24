/**
 * Import script to restore inventory disposition data from Neon backup
 * 
 * INSTRUCTIONS:
 * 1. Go to Neon Console → Your Project → Branches
 * 2. Create a new branch from a restore point BEFORE the migration (or use an existing backup)
 * 3. Connect to that branch and run the query from: scripts/export-old-inventory-data.sql
 * 4. Copy the results and save as: scripts/old-inventory-data.json (as a JSON array)
 * 5. Run this script: node scripts/import-old-inventory-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importOldData() {
  console.log('🔄 Starting inventory data import from backup...\n');

  try {
    // Read the exported data
    const dataPath = path.join(__dirname, 'old-inventory-data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Error: old-inventory-data.json not found!');
      console.log('\nPlease:');
      console.log('1. Go to Neon Console and create a branch from backup');
      console.log('2. Run the query from scripts/export-old-inventory-data.sql');
      console.log('3. Save the results as scripts/old-inventory-data.json');
      process.exit(1);
    }

    const oldData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Found ${oldData.length} items in backup data\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of oldData) {
      try {
        const itemId = item.id;
        const totalQty = item.totalquantity || 0;
        const receivedQty = item.receivedquantity || 0;
        const disposition = item.disposition; // 'TRASH' or 'USE' or null
        const dispositionQty = item.dispositionquantity || 0;
        const dispositionNotes = item.dispositionnotes;

        // Check if item still exists
        const currentItem = await prisma.inventoryItem.findUnique({
          where: { id: itemId },
        });

        if (!currentItem) {
          console.log(`⚠️  Item ${item.itemnumber} no longer exists, skipping`);
          skipped++;
          continue;
        }

        // Create disposition records based on old data
        const dispositionsToCreate = [];

        // Calculate quantities
        const normalReceived = receivedQty - dispositionQty; // Items received but not dispositioned
        const manifested = totalQty - receivedQty; // Items not yet received

        // Add RECEIVED disposition if there were normally received items
        if (normalReceived > 0) {
          dispositionsToCreate.push({
            inventoryItemId: itemId,
            status: 'RECEIVED',
            quantity: normalReceived,
            notes: null,
            createdBy: item.receivedby || null,
          });
        }

        // Add disposition record if there was one
        if (dispositionQty > 0 && disposition) {
          dispositionsToCreate.push({
            inventoryItemId: itemId,
            status: disposition, // 'TRASH' or 'USE'
            quantity: dispositionQty,
            notes: dispositionNotes,
            createdBy: item.dispositionby || null,
          });
        }

        // Create all disposition records
        if (dispositionsToCreate.length > 0) {
          await prisma.inventoryDisposition.createMany({
            data: dispositionsToCreate,
          });
          created += dispositionsToCreate.length;
          console.log(`✅ Item ${item.itemnumber}: Created ${dispositionsToCreate.length} disposition(s)`);
        } else if (receivedQty === 0) {
          // Item was never received, so it stays manifested (no dispositions needed)
          console.log(`ℹ️  Item ${item.itemnumber}: Manifested (no dispositions)`);
          skipped++;
        }

      } catch (error) {
        console.error(`❌ Error processing item ${item.itemnumber}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`  ✅ Disposition records created: ${created}`);
    console.log(`  ℹ️  Items skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`\n✨ Import complete!`);

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importOldData()
  .then(() => {
    console.log('\n🎉 Data restoration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Data restoration failed:', error);
    process.exit(1);
  });













