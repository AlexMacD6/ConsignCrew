const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample data for creating test listings
const sampleData = {
  departments: ['Electronics', 'Furniture', 'Clothing', 'Home & Garden', 'Sports'],
  categories: {
    'Electronics': ['Smartphones', 'Laptops', 'Audio', 'Gaming', 'Cameras'],
    'Furniture': ['Living Room', 'Bedroom', 'Office', 'Outdoor', 'Kitchen'],
    'Clothing': ['Men', 'Women', 'Kids', 'Accessories', 'Shoes'],
    'Home & Garden': ['Tools', 'Decor', 'Garden', 'Kitchen', 'Bathroom'],
    'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Winter Sports']
  },
  brands: ['Apple', 'Samsung', 'Nike', 'Adidas', 'IKEA', 'Sony', 'LG', 'Canon', 'Dell', 'HP'],
  conditions: ['new', 'used like new', 'used good', 'used fair', 'refurbished'],
  materials: ['Plastic', 'Metal', 'Wood', 'Fabric', 'Glass', 'Leather', 'Ceramic'],
  colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Silver', 'Gold', 'Brown', 'Gray', 'Pink']
};

// Generate random item ID
function generateItemId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random price between min and max
function generatePrice(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Generate random date within a range
function generateDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Generate sample photos object
function generatePhotos() {
  return {
    hero: { url: 'https://placehold.co/800x600/4A90E2/FFFFFF?text=Hero+Photo' },
    back: { url: 'https://placehold.co/800x600/50E3C2/FFFFFF?text=Back+Photo' },
    staged: { url: 'https://placehold.co/800x600/F5A623/FFFFFF?text=Staged+Photo' },
    proof: { url: 'https://placehold.co/800x600/D0021B/FFFFFF?text=Proof+Photo' },
    additional: [
      { url: 'https://placehold.co/600x400/9013FE/FFFFFF?text=Additional+1' },
      { url: 'https://placehold.co/600x400/417505/FFFFFF?text=Additional+2' }
    ]
  };
}

// Generate test listings with different discount schedules and creation dates
async function createTestListings() {
  console.log('🚀 Starting to create test listings for discount schedule testing...\n');

  const testListings = [
    // Turbo-30 Schedule - Different creation dates
    {
      itemId: generateItemId(),
      title: 'iPhone 15 Pro Max - 256GB - Space Black',
      description: 'Brand new iPhone 15 Pro Max in perfect condition. Includes original box and accessories.',
      price: 1199.99,
      reservePrice: 899.99,
      department: 'Electronics',
      category: 'Smartphones',
      subCategory: 'Apple',
      condition: 'new',
      brand: 'Apple',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(0), // Created today - 100% price
      estimatedRetailPrice: 1299.99
    },
    {
      itemId: generateItemId(),
      title: 'MacBook Air M2 - 13-inch - 8GB RAM - 256GB SSD',
      description: 'Excellent condition MacBook Air with M2 chip. Perfect for work and school.',
      price: 999.99,
      reservePrice: 749.99,
      department: 'Electronics',
      category: 'Laptops',
      subCategory: 'Apple',
      condition: 'used like new',
      brand: 'Apple',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(3), // Created 3 days ago - 95% price
      estimatedRetailPrice: 1199.99
    },
    {
      itemId: generateItemId(),
      title: 'Samsung 65" QLED 4K Smart TV',
      description: 'Amazing picture quality with Quantum Dot technology. Great for movie nights.',
      price: 899.99,
      reservePrice: 674.99,
      department: 'Electronics',
      category: 'TVs',
      subCategory: 'Smart TVs',
      condition: 'refurbished',
      brand: 'Samsung',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(6), // Created 6 days ago - 90% price
      estimatedRetailPrice: 1299.99
    },
    {
      itemId: generateItemId(),
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      description: 'Industry-leading noise cancellation with exceptional sound quality.',
      price: 349.99,
      reservePrice: 262.49,
      department: 'Electronics',
      category: 'Audio',
      subCategory: 'Headphones',
      condition: 'used good',
      brand: 'Sony',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(9), // Created 9 days ago - 85% price
      estimatedRetailPrice: 399.99
    },
    {
      itemId: generateItemId(),
      title: 'Nike Air Jordan 1 Retro High OG',
      description: 'Classic Air Jordan 1 in Chicago colorway. Limited edition release.',
      price: 299.99,
      reservePrice: 224.99,
      department: 'Clothing',
      category: 'Shoes',
      subCategory: 'Sneakers',
      condition: 'new',
      brand: 'Nike',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(15), // Created 15 days ago - 75% price
      estimatedRetailPrice: 399.99
    },
    {
      itemId: generateItemId(),
      title: 'IKEA Ektorp 3-Seat Sofa - Beige',
      description: 'Comfortable and stylish sofa perfect for any living room.',
      price: 599.99,
      reservePrice: 449.99,
      department: 'Furniture',
      category: 'Living Room',
      subCategory: 'Sofas',
      condition: 'used good',
      brand: 'IKEA',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(21), // Created 21 days ago - 65% price
      estimatedRetailPrice: 799.99
    },
    {
      itemId: generateItemId(),
      title: 'Canon EOS R6 Mark II Mirrorless Camera',
      description: 'Professional-grade camera with 24.2MP sensor and 4K video.',
      price: 2499.99,
      reservePrice: 1874.99,
      department: 'Electronics',
      category: 'Cameras',
      subCategory: 'Mirrorless',
      condition: 'used like new',
      brand: 'Canon',
      discountSchedule: { type: 'Turbo-30' },
      createdAt: generateDate(30), // Created 30 days ago - EXPIRED (60% price)
      estimatedRetailPrice: 2999.99
    },

    // Classic-60 Schedule - Different creation dates
    {
      itemId: generateItemId(),
      title: 'Dell XPS 15 Laptop - 15.6" 4K - 32GB RAM - 1TB SSD',
      description: 'Powerful workstation laptop perfect for content creation and development.',
      price: 1899.99,
      reservePrice: 1424.99,
      department: 'Electronics',
      category: 'Laptops',
      subCategory: 'Workstation',
      condition: 'refurbished',
      brand: 'Dell',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(0), // Created today - 100% price
      estimatedRetailPrice: 2499.99
    },
    {
      itemId: generateItemId(),
      title: 'Adidas Ultraboost 22 Running Shoes',
      description: 'Premium running shoes with responsive Boost midsole technology.',
      price: 179.99,
      reservePrice: 134.99,
      department: 'Clothing',
      category: 'Shoes',
      subCategory: 'Running',
      condition: 'new',
      brand: 'Adidas',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(7), // Created 7 days ago - 90% price
      estimatedRetailPrice: 199.99
    },
    {
      itemId: generateItemId(),
      title: 'LG 77" OLED 4K Smart TV - C3 Series',
      description: 'Stunning OLED display with perfect blacks and infinite contrast.',
      price: 2499.99,
      reservePrice: 1874.99,
      department: 'Electronics',
      category: 'TVs',
      subCategory: 'OLED',
      condition: 'new',
      brand: 'LG',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(14), // Created 14 days ago - 80% price
      estimatedRetailPrice: 3499.99
    },
    {
      itemId: generateItemId(),
      title: 'Leather Recliner Chair - Brown',
      description: 'Premium leather recliner with power controls and USB charging.',
      price: 799.99,
      reservePrice: 599.99,
      department: 'Furniture',
      category: 'Living Room',
      subCategory: 'Recliners',
      condition: 'used good',
      brand: 'Unknown',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(21), // Created 21 days ago - 75% price
      estimatedRetailPrice: 1199.99
    },
    {
      itemId: generateItemId(),
      title: 'Gaming PC - RTX 4080 - 32GB RAM - 2TB NVMe',
      description: 'High-end gaming PC capable of 4K gaming at 120+ FPS.',
      price: 2999.99,
      reservePrice: 2249.99,
      department: 'Electronics',
      category: 'Gaming',
      subCategory: 'Desktops',
      condition: 'used like new',
      brand: 'Custom',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(35), // Created 35 days ago - 65% price
      estimatedRetailPrice: 3999.99
    },
    {
      itemId: generateItemId(),
      title: 'KitchenAid Stand Mixer - Professional 600 Series',
      description: 'Professional-grade stand mixer with 6-quart bowl and 10-speed motor.',
      price: 399.99,
      reservePrice: 299.99,
      department: 'Home & Garden',
      category: 'Kitchen',
      subCategory: 'Appliances',
      condition: 'refurbished',
      brand: 'KitchenAid',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(49), // Created 49 days ago - 55% price
      estimatedRetailPrice: 599.99
    },
    {
      itemId: generateItemId(),
      title: 'Patio Furniture Set - 6-Piece - Wicker',
      description: 'Beautiful outdoor furniture set perfect for entertaining.',
      price: 899.99,
      reservePrice: 674.99,
      department: 'Furniture',
      category: 'Outdoor',
      subCategory: 'Patio',
      condition: 'used good',
      brand: 'Unknown',
      discountSchedule: { type: 'Classic-60' },
      createdAt: generateDate(60), // Created 60 days ago - EXPIRED (50% price)
      estimatedRetailPrice: 1299.99
    },

    // No discount schedule (for comparison)
    {
      itemId: generateItemId(),
      title: 'Wireless Bluetooth Speaker - Portable',
      description: 'Compact portable speaker with 20-hour battery life.',
      price: 89.99,
      reservePrice: 67.49,
      department: 'Electronics',
      category: 'Audio',
      subCategory: 'Speakers',
      condition: 'new',
      brand: 'Unknown',
      discountSchedule: null, // No discount schedule
      createdAt: generateDate(5),
      estimatedRetailPrice: 119.99
    },
    {
      itemId: generateItemId(),
      title: 'Coffee Table - Modern Design - Glass Top',
      description: 'Contemporary coffee table with tempered glass top and metal legs.',
      price: 299.99,
      reservePrice: 224.99,
      department: 'Furniture',
      category: 'Living Room',
      subCategory: 'Tables',
      condition: 'used like new',
      brand: 'Unknown',
      discountSchedule: null, // No discount schedule
      createdAt: generateDate(10),
      estimatedRetailPrice: 399.99
    }
  ];

  let createdCount = 0;
  let errorCount = 0;

  for (const listingData of testListings) {
    try {
      // Create the listing
      const listing = await prisma.listing.create({
        data: {
          userId: 'AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit', // Real user ID from database
          itemId: listingData.itemId,
          photos: listingData.photos || generatePhotos(),
          department: listingData.department,
          category: listingData.category,
          subCategory: listingData.subCategory,
          title: listingData.title,
          condition: listingData.condition,
          price: listingData.price,
          reservePrice: listingData.reservePrice,
          description: listingData.description,
          brand: listingData.brand,
          estimatedRetailPrice: listingData.estimatedRetailPrice,
          discountSchedule: listingData.discountSchedule,
          status: 'active',
          quantity: 1,
          facebookShopEnabled: true,
          createdAt: listingData.createdAt,
          // Add some random dimensions (as strings)
          height: (Math.floor(Math.random() * 100) + 10).toString(),
          width: (Math.floor(Math.random() * 100) + 10).toString(),
          depth: (Math.floor(Math.random() * 50) + 5).toString(),
          // Add random material and color
          material: sampleData.materials[Math.floor(Math.random() * sampleData.materials.length)],
          color: sampleData.colors[Math.floor(Math.random() * sampleData.colors.length)],
          // Add price history
          priceHistory: {
            create: {
              price: listingData.price,
            },
          },
        },
      });

             // Calculate expected sale price based on discount schedule
       let salePriceInfo = '';
       const daysSinceCreation = Math.floor((Date.now() - listingData.createdAt.getTime()) / (1000 * 60 * 60 * 24));
       if (listingData.discountSchedule) {
         const schedule = listingData.discountSchedule.type;
        
        if (schedule === 'Turbo-30') {
          if (daysSinceCreation >= 30) {
            salePriceInfo = 'EXPIRED (60% of original)';
          } else if (daysSinceCreation >= 24) {
            salePriceInfo = '60% of original';
          } else if (daysSinceCreation >= 21) {
            salePriceInfo = '65% of original';
          } else if (daysSinceCreation >= 18) {
            salePriceInfo = '70% of original';
          } else if (daysSinceCreation >= 15) {
            salePriceInfo = '75% of original';
          } else if (daysSinceCreation >= 12) {
            salePriceInfo = '80% of original';
          } else if (daysSinceCreation >= 9) {
            salePriceInfo = '85% of original';
          } else if (daysSinceCreation >= 6) {
            salePriceInfo = '90% of original';
          } else if (daysSinceCreation >= 3) {
            salePriceInfo = '95% of original';
          } else {
            salePriceInfo = '100% of original (no sale price)';
          }
        } else if (schedule === 'Classic-60') {
          if (daysSinceCreation >= 60) {
            salePriceInfo = 'EXPIRED (50% of original)';
          } else if (daysSinceCreation >= 56) {
            salePriceInfo = '50% of original';
          } else if (daysSinceCreation >= 49) {
            salePriceInfo = '55% of original';
          } else if (daysSinceCreation >= 42) {
            salePriceInfo = '60% of original';
          } else if (daysSinceCreation >= 35) {
            salePriceInfo = '65% of original';
          } else if (daysSinceCreation >= 28) {
            salePriceInfo = '70% of original';
          } else if (daysSinceCreation >= 21) {
            salePriceInfo = '75% of original';
          } else if (daysSinceCreation >= 14) {
            salePriceInfo = '80% of original';
          } else if (daysSinceCreation >= 7) {
            salePriceInfo = '90% of original';
          } else {
            salePriceInfo = '100% of original (no sale price)';
          }
        }
      } else {
        salePriceInfo = 'No discount schedule';
      }

      console.log(`✅ Created: ${listingData.title}`);
      console.log(`   Item ID: ${listingData.itemId}`);
      console.log(`   Price: $${listingData.price} | Reserve: $${listingData.reservePrice}`);
      console.log(`   Schedule: ${listingData.discountSchedule?.type || 'None'}`);
      console.log(`   Created: ${daysSinceCreation} days ago`);
      console.log(`   Sale Price: ${salePriceInfo}`);
      console.log(`   Status: ${listing.status}\n`);

      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating listing "${listingData.title}":`, error.message);
      errorCount++;
    }
  }

  console.log(`\n🎉 Seed script completed!`);
  console.log(`✅ Created: ${createdCount} listings`);
  console.log(`❌ Errors: ${errorCount} listings`);
  console.log(`\n📊 Test Scenarios Created:`);
  console.log(`   • Turbo-30: 7 listings (various stages including expired)`);
  console.log(`   • Classic-60: 7 listings (various stages including expired)`);
  console.log(`   • No Schedule: 2 listings (for comparison)`);
  console.log(`\n🧪 Testing Instructions:`);
  console.log(`   1. Check Facebook catalog sync for listings with different schedules`);
  console.log(`   2. Verify sale prices activate after first discount interval`);
  console.log(`   3. Confirm expired listings are not synced to Facebook`);
  console.log(`   4. Monitor console logs for price calculation debugging`);
}

// Run the seed script
async function main() {
  try {
    await createTestListings();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  main();
}

module.exports = { createTestListings };
