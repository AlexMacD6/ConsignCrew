/**
 * Migration Script: Update Existing Listings with Facebook Marketplace Categories
 * 
 * This script updates all existing listings in the database to have proper
 * Facebook Marketplace category mappings based on their current department,
 * category, and subcategory values.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Facebook Marketplace Categories (official list)
const FACEBOOK_CATEGORIES = [
  'Antiques',
  'Appliances',
  'Arts & Crafts',
  'Automotive',
  'Baby & Kids',
  'Beauty & Health',
  'Books & Magazines',
  'Clothing & Accessories',
  'Collectibles',
  'Electronics',
  'Entertainment',
  'Free Stuff',
  'Furniture',
  'Garden & Outdoor',
  'Health & Beauty',
  'Home & Garden',
  'Jewelry & Watches',
  'Music',
  'Office & Business',
  'Pet Supplies',
  'Sporting Goods',
  'Tools & Hardware',
  'Toys & Games',
  'Video Games & Consoles'
];

// TreasureHub to Facebook Category Mapping
const TREASUREHUB_TO_FACEBOOK_MAP = {
  // Direct mappings
  'Furniture': 'Furniture',
  'Electronics': 'Electronics',
  'Sports & Outdoors': 'Sporting Goods',
  'Tools & Hardware': 'Tools & Hardware',
  'Pet Supplies': 'Pet Supplies',
  'Toys & Games': 'Toys & Games',
  'Books & Media': 'Books & Magazines',
  'Automotive Parts & Accessories': 'Automotive',
  'Garden & Outdoor': 'Garden & Outdoor',
  'Office Supplies': 'Office & Business',
  
  // Mapped categories
  'Home & Living': 'Home & Garden',
  'Kitchen & Dining': 'Home & Garden',
  'Beauty & Personal Care': 'Beauty & Health',
  'Art & Collectibles': 'Collectibles',
  
  // Subcategory-based mappings
  'Fashion': 'Clothing & Accessories',
  'Jewelry': 'Jewelry & Watches',
  'Music': 'Music',
  'Video Games': 'Video Games & Consoles',
  'Appliances': 'Appliances',
  'Antiques': 'Antiques',
  'Arts & Crafts': 'Arts & Crafts',
  'Entertainment': 'Entertainment',
  'Baby & Kids': 'Baby & Kids',
  'Health': 'Health & Beauty',
};

// Subcategory to Facebook Category Mapping (for more precise categorization)
const SUBCATEGORY_TO_FACEBOOK_MAP = {
  // Electronics subcategories
  'Computers & Tablets': 'Electronics',
  'Mobile Phones & Accessories': 'Electronics',
  'Audio Equipment': 'Electronics',
  'Cameras & Photo': 'Electronics',
  'Gaming Consoles & Accessories': 'Video Games & Consoles',
  'Smart Home Devices': 'Electronics',
  
  // Furniture subcategories
  'Chairs': 'Furniture',
  'Tables': 'Furniture',
  'Storage & Shelving': 'Furniture',
  'Seating': 'Furniture',
  'Bedroom Furniture': 'Furniture',
  'Office Furniture': 'Office & Business',
  'Outdoor Furniture': 'Garden & Outdoor',
  
  // Home & Living subcategories
  'Home Décor': 'Home & Garden',
  'Lighting': 'Home & Garden',
  'Rugs & Textiles': 'Home & Garden',
  'Candles & Fragrance': 'Home & Garden',
  'Storage & Organization': 'Home & Garden',
  
  // Kitchen & Dining subcategories
  'Cookware': 'Home & Garden',
  'Dinnerware': 'Home & Garden',
  'Small Appliances': 'Appliances',
  'Kitchen Utensils': 'Home & Garden',
  
  // Sports & Outdoors subcategories
  'Camping & Hiking Gear': 'Sporting Goods',
  'Bicycles & Accessories': 'Sporting Goods',
  'Fitness Equipment': 'Sporting Goods',
  'Water Sports Gear': 'Sporting Goods',
  'Team Sports Equipment': 'Sporting Goods',
  
  // Tools & Hardware subcategories
  'Power Tools': 'Tools & Hardware',
  'Hand Tools': 'Tools & Hardware',
  'Tool Storage': 'Tools & Hardware',
  'Safety Equipment': 'Tools & Hardware',
  
  // Beauty & Personal Care subcategories
  'Skincare': 'Beauty & Health',
  'Haircare': 'Beauty & Health',
  'Fragrances': 'Beauty & Health',
  'Grooming Tools': 'Beauty & Health',
  
  // Office Supplies subcategories
  'Stationery & Paper': 'Office & Business',
  'Desk Accessories': 'Office & Business',
  'Office Electronics': 'Electronics',
  
  // Pet Supplies subcategories
  'Beds & Furniture': 'Pet Supplies',
  'Toys & Enrichment': 'Pet Supplies',
  'Grooming & Health': 'Pet Supplies',
  'Bowls & Feeders': 'Pet Supplies',
  
  // Garden & Outdoor subcategories
  'Gardening Tools': 'Garden & Outdoor',
  'Planters & Pots': 'Garden & Outdoor',
  'Outdoor Décor': 'Garden & Outdoor',
  'Grills & Outdoor Cooking': 'Garden & Outdoor',
  
  // Automotive subcategories
  'Interior Accessories': 'Automotive',
  'Exterior Accessories': 'Automotive',
  'Performance Parts': 'Automotive',
  'Car Care & Detailing': 'Automotive',
  
  // Art & Collectibles subcategories
  'Art Prints': 'Arts & Crafts',
  'Paintings': 'Arts & Crafts',
  'Sculptures': 'Arts & Crafts',
  'Vintage Collectibles': 'Collectibles',
  'Memorabilia': 'Collectibles',
  
  // Books & Media subcategories
  'Books': 'Books & Magazines',
  'Vinyl Records': 'Music',
  'CDs & DVDs': 'Entertainment',
  'Video Games': 'Video Games & Consoles',
  
  // Toys & Games subcategories
  'Board Games': 'Toys & Games',
  'Puzzles': 'Toys & Games',
  'Action Figures': 'Toys & Games',
  'Educational Toys': 'Toys & Games',
  'Dolls & Plush': 'Toys & Games',
};

/**
 * Maps a TreasureHub category to the corresponding Facebook Marketplace category
 */
function mapToFacebookCategory(department, category, subCategory) {
  // First, try to map by subcategory for more precise categorization
  if (subCategory && SUBCATEGORY_TO_FACEBOOK_MAP[subCategory]) {
    return SUBCATEGORY_TO_FACEBOOK_MAP[subCategory];
  }
  
  // Then try to map by category
  if (SUBCATEGORY_TO_FACEBOOK_MAP[category]) {
    return SUBCATEGORY_TO_FACEBOOK_MAP[category];
  }
  
  // Finally, try to map by department
  if (TREASUREHUB_TO_FACEBOOK_MAP[department]) {
    return TREASUREHUB_TO_FACEBOOK_MAP[department];
  }
  
  // Fallback to "Home & Garden" if no mapping found
  return 'Home & Garden';
}

async function migrateFacebookCategories() {
  console.log('Starting Facebook Marketplace category migration...');
  
  try {
    // Get all listings that don't have facebookCategory set
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { facebookCategory: null },
          { facebookCategory: '' }
        ]
      },
      select: {
        id: true,
        department: true,
        category: true,
        subCategory: true,
        facebookCategory: true,
        title: true
      }
    });
    
    console.log(`Found ${listings.length} listings to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const listing of listings) {
      try {
        // Map the listing's categories to Facebook category
        const facebookCategory = mapToFacebookCategory(
          listing.department || 'general',
          listing.category || 'general',
          listing.subCategory
        );
        
        // Update the listing with the Facebook category
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            facebookCategory: facebookCategory,
            facebookLastSync: null, // Reset sync status to force re-sync
            facebookSyncStatus: 'pending'
          }
        });
        
        console.log(`✓ Updated listing "${listing.title}" (${listing.id}) → ${facebookCategory}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`✗ Error updating listing ${listing.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\nMigration completed!');
    console.log(`✓ Successfully updated: ${updatedCount} listings`);
    console.log(`✗ Errors: ${errorCount} listings`);
    
    // Get summary statistics
    const totalListings = await prisma.listing.count();
    const listingsWithFacebookCategory = await prisma.listing.count({
      where: {
        facebookCategory: { not: null }
      }
    });
    
    console.log('\nSummary:');
    console.log(`Total listings: ${totalListings}`);
    console.log(`Listings with Facebook category: ${listingsWithFacebookCategory}`);
    console.log(`Coverage: ${((listingsWithFacebookCategory / totalListings) * 100).toFixed(1)}%`);
    
    // Show category distribution
    const categoryStats = await prisma.listing.groupBy({
      by: ['facebookCategory'],
      _count: {
        facebookCategory: true
      },
      where: {
        facebookCategory: { not: null }
      },
      orderBy: {
        _count: {
          facebookCategory: 'desc'
        }
      }
    });
    
    console.log('\nCategory Distribution:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.facebookCategory}: ${stat._count.facebookCategory} listings`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateFacebookCategories()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

export { migrateFacebookCategories }; 