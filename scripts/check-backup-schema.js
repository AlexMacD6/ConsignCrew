/**
 * Check what columns exist in the backup branch
 * Run with: node scripts/check-backup-schema.js
 */

const { Client } = require('pg');

const backupClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Bsjwzn3Kk7Vq@ep-old-bread-aefqou3d-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function checkSchema() {
  try {
    await backupClient.connect();
    console.log('✅ Connected to backup branch\n');

    // Get column information
    const result = await backupClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'InventoryItem'
      ORDER BY ordinal_position
    `);

    console.log('📋 Columns in InventoryItem table:\n');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Check if InventoryDisposition table exists
    const tableCheck = await backupClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'InventoryDisposition'
      )
    `);

    console.log(`\n📋 InventoryDisposition table exists: ${tableCheck.rows[0].exists}`);

    if (tableCheck.rows[0].exists) {
      const count = await backupClient.query(`SELECT COUNT(*) FROM "InventoryDisposition"`);
      console.log(`   Records in InventoryDisposition: ${count.rows[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await backupClient.end();
  }
}

checkSchema();





