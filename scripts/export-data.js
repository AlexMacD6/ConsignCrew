const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Starting data export...');
    
    // Create export directory
    const exportDir = path.join(__dirname, '..', 'data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // Export all models
    const models = [
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
      'Zipcode',
      'Video',
      'EbayNotification',
      'EbayItem',
      'EbayNotificationLog',
      'verification',
      'verificationToken'
    ];

    for (const modelName of models) {
      try {
        console.log(`Exporting ${modelName}...`);
        
        // Get all records from the model
        const data = await prisma[modelName].findMany();
        
        // Write to JSON file
        const filePath = path.join(exportDir, `${modelName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✓ Exported ${data.length} records from ${modelName}`);
      } catch (error) {
        console.log(`⚠ Error exporting ${modelName}:`, error.message);
      }
    }

    // Create a summary file
    const summary = {
      exportedAt: new Date().toISOString(),
      models: models,
      note: 'Data exported from production database for migration to new branch'
    };
    
    fs.writeFileSync(
      path.join(exportDir, 'export-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n✅ Data export completed successfully!');
    console.log(`📁 Data saved to: ${exportDir}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
