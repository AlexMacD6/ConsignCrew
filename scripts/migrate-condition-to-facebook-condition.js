/**
 * Migration script to populate facebookCondition from condition field
 * and standardize condition values across all listings
 */

const { PrismaClient } = require('@prisma/client');

async function migrateConditionFields() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting condition field migration...');
    
    // Get all listings that have condition but no facebookCondition
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { facebookCondition: null },
          { facebookCondition: '' }
        ],
        condition: {
          not: null
        }
      },
      select: {
        id: true,
        itemId: true,
        condition: true,
        facebookCondition: true
      }
    });

    console.log(`📋 Found ${listings.length} listings to migrate`);

    if (listings.length === 0) {
      console.log('✅ No listings need migration');
      return;
    }

    let updated = 0;
    for (const listing of listings) {
      try {
        // Standardize the condition value
        const standardizedCondition = standardizeCondition(listing.condition);
        
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            facebookCondition: standardizedCondition
          }
        });

        console.log(`✅ Updated ${listing.itemId}: "${listing.condition}" → "${standardizedCondition}"`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${listing.itemId}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed: ${updated}/${listings.length} listings updated`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Standardize condition values to match Facebook's accepted values
 */
function standardizeCondition(condition) {
  if (!condition) return 'used';
  
  const normalized = condition.toLowerCase().trim();
  
  // Map various condition values to Facebook's accepted values
  const conditionMap = {
    // New conditions
    'new': 'new',
    'brand new': 'new',
    'new with tags': 'new',
    'new in box': 'new',
    'new with defects': 'new',
    'open box': 'new',
    
    // Like New conditions  
    'like new': 'like new',
    'excellent': 'like new',
    'mint': 'like new',
    'perfect': 'like new',
    
    // Good conditions
    'good': 'good',
    'very good': 'good',
    'great': 'good',
    
    // Fair conditions
    'fair': 'fair',
    'okay': 'fair',
    'acceptable': 'fair',
    
    // Poor conditions
    'poor': 'poor',
    'damaged': 'poor',
    'broken': 'poor',
    'for parts': 'poor',
    
    // Used (default)
    'used': 'used',
    'pre-owned': 'used',
    'previously owned': 'used',
    'second hand': 'used',
    'secondhand': 'used',
    
    // Refurbished
    'refurbished': 'refurbished',
    'renewed': 'refurbished',
    'restored': 'refurbished'
  };

  return conditionMap[normalized] || 'used';
}

// Run the migration
migrateConditionFields();
