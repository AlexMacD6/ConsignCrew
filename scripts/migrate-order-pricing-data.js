/**
 * Migration script to populate new Order pricing fields from existing JSON data
 * Run with: node scripts/migrate-order-pricing-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateOrderPricingData() {
  console.log('🚀 Starting migration of order pricing data...');
  
  try {
    // Get all orders that have shippingAddress data but missing new fields
    const ordersToMigrate = await prisma.order.findMany({
      where: {
        AND: [
          { shippingAddress: { not: null } },
          { subtotal: null } // Only migrate orders that haven't been migrated yet
        ]
      },
      select: {
        id: true,
        shippingAddress: true,
        amount: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${ordersToMigrate.length} orders to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of ordersToMigrate) {
      try {
        const shippingAddress = order.shippingAddress;
        const priceBreakdown = shippingAddress?.priceBreakdown;

        if (!priceBreakdown) {
          console.log(`⚠️  Order ${order.id}: No priceBreakdown found, skipping`);
          skippedCount++;
          continue;
        }

        // Extract data from JSON with fallbacks
        const updateData = {
          subtotal: parseFloat(priceBreakdown.subtotal) || null,
          deliveryFee: parseFloat(priceBreakdown.deliveryFee) || 0,
          taxAmount: parseFloat(priceBreakdown.tax) || null,
          taxRate: parseFloat(priceBreakdown.taxRate) || null,
          deliveryMethod: priceBreakdown.deliveryMethod || null,
          deliveryCategory: priceBreakdown.deliveryCategory || null,
          promoCode: priceBreakdown.promoCode || null,
          promoDiscountAmount: parseFloat(priceBreakdown.promoDiscount) || null,
          promoDiscountType: priceBreakdown.promoDiscountType || null,
          isMultiItem: Boolean(priceBreakdown.isMultiItem) || false
        };

        // Update the order with new field data
        await prisma.order.update({
          where: { id: order.id },
          data: updateData
        });

        migratedCount++;
        
        // Log progress every 10 orders
        if (migratedCount % 10 === 0) {
          console.log(`✅ Migrated ${migratedCount} orders...`);
        }

        // Log details for first few orders
        if (migratedCount <= 5) {
          console.log(`📝 Order ${order.id}:`, {
            subtotal: updateData.subtotal,
            deliveryFee: updateData.deliveryFee,
            taxAmount: updateData.taxAmount,
            promoCode: updateData.promoCode,
            promoDiscountType: updateData.promoDiscountType
          });
        }

      } catch (error) {
        console.error(`❌ Error migrating order ${order.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migratedCount} orders`);
    console.log(`⚠️  Skipped (no data): ${skippedCount} orders`);
    console.log(`❌ Errors: ${errorCount} orders`);

    // Verify migration results
    const verificationResults = await prisma.order.aggregate({
      _count: {
        id: true,
        subtotal: true,
        deliveryFee: true,
        taxAmount: true,
        promoCode: true
      }
    });

    console.log('\n📊 Verification Results:');
    console.log(`Total orders: ${verificationResults._count.id}`);
    console.log(`Orders with subtotal: ${verificationResults._count.subtotal}`);
    console.log(`Orders with deliveryFee: ${verificationResults._count.deliveryFee}`);
    console.log(`Orders with taxAmount: ${verificationResults._count.taxAmount}`);
    console.log(`Orders with promoCode: ${verificationResults._count.promoCode}`);

    // Show sample of migrated data
    const sampleOrders = await prisma.order.findMany({
      where: { subtotal: { not: null } },
      select: {
        id: true,
        subtotal: true,
        deliveryFee: true,
        taxAmount: true,
        promoCode: true,
        promoDiscountType: true,
        amount: true
      },
      take: 3
    });

    console.log('\n📋 Sample migrated orders:');
    sampleOrders.forEach(order => {
      console.log(`Order ${order.id}:`);
      console.log(`  Subtotal: $${order.subtotal}`);
      console.log(`  Delivery: $${order.deliveryFee}`);
      console.log(`  Tax: $${order.taxAmount}`);
      console.log(`  Total: $${order.amount}`);
      console.log(`  Promo: ${order.promoCode || 'None'} (${order.promoDiscountType || 'N/A'})`);
      console.log('');
    });

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateOrderPricingData()
    .then(() => {
      console.log('✨ Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrderPricingData };
