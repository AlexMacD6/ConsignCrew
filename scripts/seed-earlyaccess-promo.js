const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEarlyAccessPromo() {
  try {
    console.log('🌱 Seeding EARLYACCESS promo code...');

    // Check if EARLYACCESS promo code already exists
    const existingPromo = await prisma.promoCode.findUnique({
      where: { code: 'EARLYACCESS' }
    });

    if (existingPromo) {
      console.log('✅ EARLYACCESS promo code already exists');
      console.log('Promo Code Details:', {
        id: existingPromo.id,
        code: existingPromo.code,
        name: existingPromo.name,
        type: existingPromo.type,
        value: existingPromo.value,
        isActive: existingPromo.isActive,
        usageCount: existingPromo.usageCount
      });
      return;
    }

    // Create the EARLYACCESS promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code: 'EARLYACCESS',
        name: 'Early Access Free Delivery',
        description: 'Free delivery for early access customers - limited time offer',
        type: 'free_shipping',
        value: 0, // Value is 0 for free shipping type
        isActive: true,
        startDate: new Date(), // Active immediately
        endDate: null, // No end date (unlimited time)
        usageLimit: null, // Unlimited usage
        usageCount: 0
      }
    });

    console.log('✅ Successfully created EARLYACCESS promo code!');
    console.log('Promo Code Details:', {
      id: promoCode.id,
      code: promoCode.code,
      name: promoCode.name,
      type: promoCode.type,
      value: promoCode.value,
      isActive: promoCode.isActive,
      startDate: promoCode.startDate,
      endDate: promoCode.endDate,
      usageLimit: promoCode.usageLimit,
      usageCount: promoCode.usageCount
    });

    console.log('\n🎉 Promo code is ready to use!');
    console.log('Customers can now use code "EARLYACCESS" for free delivery');

  } catch (error) {
    console.error('❌ Error seeding EARLYACCESS promo code:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedEarlyAccessPromo()
  .then(() => {
    console.log('🏁 Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
