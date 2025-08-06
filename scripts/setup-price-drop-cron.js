#!/usr/bin/env node

/**
 * Setup script for automatic price drop processing
 * 
 * This script helps you set up automatic price drop processing for your TreasureHub application.
 * You can run this manually or set up a cron job to run it automatically.
 * 
 * Usage:
 * 1. Manual execution: node scripts/setup-price-drop-cron.js
 * 2. Cron job setup: Add to your crontab
 *    - For every 5 minutes: */5 * * * * cd /path/to/treasurehub && node scripts/setup-price-drop-cron.js
 *    - For every hour: 0 * * * * cd /path/to/treasurehub && node scripts/setup-price-drop-cron.js
 */

import { processAllPriceDrops } from '../app/lib/discount-schedule.js';

async function main() {
  console.log('🔄 Starting automatic price drop processing...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    const result = await processAllPriceDrops();
    
    console.log('✅ Price drop processing completed!');
    console.log(`📊 Results:`);
    console.log(`   - Processed: ${result.processed} listings`);
    console.log(`   - Dropped: ${result.dropped} prices`);
    console.log(`   - Errors: ${result.errors}`);
    
    if (result.dropped > 0) {
      console.log(`🎉 Successfully dropped ${result.dropped} prices!`);
    } else {
      console.log(`ℹ️  No price drops were needed at this time.`);
    }
    
    if (result.errors > 0) {
      console.log(`⚠️  ${result.errors} errors occurred during processing.`);
    }
    
  } catch (error) {
    console.error('❌ Error during price drop processing:', error);
    process.exit(1);
  }
  
  console.log(`⏰ Completed at: ${new Date().toISOString()}`);
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 