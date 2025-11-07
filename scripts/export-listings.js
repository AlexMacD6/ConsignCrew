/**
 * Export all listings data from the database
 * Usage: node scripts/export-listings.js [format]
 * Format options: json (default), csv
 * 
 * Examples:
 *   node scripts/export-listings.js json
 *   node scripts/export-listings.js csv
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Format options
const FORMAT = process.argv[2] || 'json'; // 'json' or 'csv'

async function exportListings() {
  try {
    console.log('📦 Fetching all listings from database...');
    
    // Fetch all listings with related data
    const listings = await prisma.listing.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        galleryPhotos: true,
        videos: true,
        inventoryItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${listings.length} listings`);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    if (FORMAT === 'csv') {
      // Export as CSV
      const csvFilePath = path.join(exportsDir, `listings-export-${timestamp}.csv`);
      const csvContent = convertToCSV(listings);
      fs.writeFileSync(csvFilePath, csvContent, 'utf8');
      console.log(`📄 CSV exported to: ${csvFilePath}`);
      console.log(`   File size: ${(fs.statSync(csvFilePath).size / 1024).toFixed(2)} KB`);
    } else {
      // Export as JSON (default)
      const jsonFilePath = path.join(exportsDir, `listings-export-${timestamp}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(listings, null, 2), 'utf8');
      console.log(`📄 JSON exported to: ${jsonFilePath}`);
      console.log(`   File size: ${(fs.statSync(jsonFilePath).size / 1024).toFixed(2)} KB`);
    }

    console.log('\n✨ Export complete!');
    
    // Summary stats
    const statusCounts = listings.reduce((acc, listing) => {
      acc[listing.status] = (acc[listing.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Summary:');
    console.log(`   Total listings: ${listings.length}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error exporting listings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Convert listings array to CSV format
 */
function convertToCSV(listings) {
  if (listings.length === 0) return '';

  // Define CSV headers
  const headers = [
    'ID',
    'Item ID',
    'Title',
    'Description',
    'Price',
    'Sale Price',
    'Status',
    'Condition',
    'Brand',
    'Model Number',
    'Serial Number',
    'Location',
    'Seller Name',
    'Seller Email',
    'Department',
    'Category',
    'Height',
    'Width',
    'Depth',
    'Weight',
    'Photos Count',
    'Videos Count',
    'Views',
    'Created At',
    'Updated At',
    'Available From',
    'Available Until',
  ];

  // Build CSV rows
  const rows = listings.map(listing => {
    return [
      listing.id,
      listing.itemId || '',
      `"${(listing.title || '').replace(/"/g, '""')}"`, // Escape quotes
      `"${(listing.description || '').replace(/"/g, '""')}"`,
      listing.price,
      listing.salePrice || '',
      listing.status,
      listing.condition || '',
      listing.brand || '',
      listing.modelNumber || '',
      listing.serialNumber || '',
      listing.location || '',
      listing.user.name || '',
      listing.user.email,
      listing.department || '',
      listing.category || '',
      listing.height || '',
      listing.width || '',
      listing.depth || '',
      listing.weight || '',
      listing.galleryPhotos?.length || 0,
      listing.videos?.length || 0,
      listing.views || 0,
      listing.createdAt,
      listing.updatedAt,
      listing.availableFrom || '',
      listing.availableUntil || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Run the export
exportListings();
