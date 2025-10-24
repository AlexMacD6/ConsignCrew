/**
 * Check what columns exist in the backup branch
 * Run with: BACKUP_DATABASE_URL="your-backup-connection-string" node scripts/check-backup-schema.js
 * 
 * Required environment variable:
 * - BACKUP_DATABASE_URL: Connection string to the backup database branch
 */

const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

// Validate required environment variable
if (!process.env.BACKUP_DATABASE_URL) {
  console.error('❌ Error: BACKUP_DATABASE_URL environment variable is required');
  console.error('Usage: BACKUP_DATABASE_URL="your-connection-string" node scripts/check-backup-schema.js');
  process.exit(1);
}

const backupClient = new Client({
  connectionString: process.env.BACKUP_DATABASE_URL,
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





