const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('Starting data import...');
    
    const exportDir = path.join(__dirname, '..', 'data-export');
    if (!fs.existsSync(exportDir)) {
      console.error('❌ Export directory not found. Please run export-data.js first.');
      return;
    }

    // Import order matters due to foreign key constraints
    const importOrder = [
      'user',
      'Organization', 
      'Member',
      'Invitation',
      'Team',
      'TeamMember',
      'session',
      'account',
      'AiResponse',
      'EarlyAccessSignup',
      'Question',
      'Listing',
      'ListingHistory',
      'PriceHistory',
      'Contact',
      'TreasureRedemption',
      'TreasureDrop',
      'Video',
      'EbayNotification',
      'EbayItem',
      'EbayNotificationLog',
      'verification',
      'verificationToken'
    ];

    for (const modelName of importOrder) {
      try {
        const filePath = path.join(exportDir, `${modelName}.json`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠ Skipping ${modelName} - file not found`);
          continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!data || data.length === 0) {
          console.log(`⚠ Skipping ${modelName} - no data`);
          continue;
        }

        console.log(`Importing ${modelName}...`);
        
        // Clear existing data for this model
        await prisma[modelName].deleteMany({});
        
        // Import data
        if (data.length === 1) {
          // Single record
          await prisma[modelName].create({ data: data[0] });
        } else {
          // Multiple records
          await prisma[modelName].createMany({ data });
        }
        
        console.log(`✓ Imported ${data.length} records to ${modelName}`);
        
      } catch (error) {
        console.log(`⚠ Error importing ${modelName}:`, error.message);
      }
    }

    console.log('\n✅ Data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
