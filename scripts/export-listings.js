const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportListings() {
  try {
    console.log('Starting listings export...');
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '..', 'data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // Export listings with a raw query to avoid schema issues
    const listings = await prisma.$queryRaw`
      SELECT 
        id, "userId", "itemId", photos, department, category, "subCategory", 
        title, condition, price, description, brand, "serialNumber", "modelNumber", 
        "estimatedRetailPrice", "discountSchedule", status, "createdAt", "updatedAt", 
        views, "videoUrl", "reservePrice", depth, height, width, "facebookBrand", 
        "facebookCategory", "facebookCondition", "facebookGtin", "facebookLastSync", 
        "facebookShopEnabled", "facebookShopId", "facebookSyncStatus", "qualityChecked", 
        "ageGroup", color, gender, "itemGroupId", material, pattern, quantity, 
        "salePrice", "salePriceEffectiveDate", size, style, tags, "isTreasure", 
        "metaCatalogId", "metaErrorDetails", "metaLastSync", "metaProductId", 
        "metaSyncStatus", "treasureFlaggedAt", "treasureFlaggedBy", "treasureReason", 
        "flawData", "googleProductCategory"
      FROM "Listing"
    `;
    
    // Write to JSON file
    const filePath = path.join(exportDir, 'Listing.json');
    fs.writeFileSync(filePath, JSON.stringify(listings, null, 2));
    
    console.log(`✓ Exported ${listings.length} listings`);
    
    // Export zipcodes
    try {
      const zipcodes = await prisma.$queryRaw`
        SELECT * FROM "Zipcode"
      `;
      
      const zipcodePath = path.join(exportDir, 'Zipcode.json');
      fs.writeFileSync(zipcodePath, JSON.stringify(zipcodes, null, 2));
      
      console.log(`✓ Exported ${zipcodes.length} zipcodes`);
    } catch (error) {
      console.log(`⚠ Error exporting zipcodes:`, error.message);
    }
    
    console.log('\n✅ Listings export completed successfully!');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportListings();
