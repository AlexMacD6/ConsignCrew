const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function seedReviewToTip() {
  try {
    console.log('🌱 Seeding Review-to-Tip feature...');

    // Default Google Reviews URL for TreasureHub
    const defaultGoogleReviewsUrl = 'https://g.page/r/TreasureHub/review';

    // Seed initial drivers
    const driversToCreate = [
      {
        initials: 'ARM',
        fullName: 'Alexander Raymond MacDonald',
        email: 'alex@treasurehub.club',
        phone: '+1-234-567-8900',
        googleReviewsUrl: defaultGoogleReviewsUrl,
        isActive: true,
      },
      {
        initials: 'JD',
        fullName: 'John Doe',
        email: 'john@treasurehub.club',
        phone: '+1-234-567-8901',
        googleReviewsUrl: defaultGoogleReviewsUrl,
        isActive: true,
      },
      {
        initials: 'JS',
        fullName: 'Jane Smith',
        email: 'jane@treasurehub.club',
        phone: '+1-234-567-8902',
        googleReviewsUrl: defaultGoogleReviewsUrl,
        isActive: true,
      },
    ];

    for (const driverData of driversToCreate) {
      try {
        // Check if driver already exists
        const existingDriver = await prisma.driver.findUnique({
          where: { initials: driverData.initials },
        });

        if (existingDriver) {
          console.log(`✅ Driver ${driverData.initials} (${driverData.fullName}) already exists`);
          continue;
        }

        // Create new driver
        const driver = await prisma.driver.create({
          data: driverData,
        });

        console.log(`✅ Created driver: ${driver.fullName} (${driver.initials})`);
        console.log(`   📱 QR URL: treasurehub.club/review/${driver.initials.toLowerCase()}`);
      } catch (error) {
        console.error(`❌ Error creating driver ${driverData.initials}:`, error.message);
      }
    }

    // Optional: Create some sample review scans for testing
    console.log('\n📊 Creating sample data for testing...');
    
    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
    });

    if (drivers.length > 0) {
      // Create sample review scans for the first driver
      const testDriver = drivers[0];
      
      const sampleScans = [
        {
          driverId: testDriver.id,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          driverId: testDriver.id,
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Android 13; Mobile)',
          scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      ];

      for (const scanData of sampleScans) {
        const scan = await prisma.reviewScan.create({
          data: scanData,
        });
        console.log(`✅ Created sample scan for ${testDriver.initials}`);
      }

      // Create a sample confirmed review with bonus
      const reviewScan = await prisma.reviewScan.create({
        data: {
          driverId: testDriver.id,
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          scannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
      });

      const googleReview = await prisma.googleReview.create({
        data: {
          reviewScanId: reviewScan.id,
          rating: 5,
          reviewText: 'Exceptional delivery service! TreasureHub exceeded all expectations.',
          reviewerName: 'Happy Customer',
          bonusAwarded: true,
        },
      });

      const bonus = await prisma.reviewBonus.create({
        data: {
          driverId: testDriver.id,
          googleReviewId: googleReview.id,
          bonusAmount: 5.00,
          paymentStatus: 'pending',
        },
      });

      // Update driver stats
      await prisma.driver.update({
        where: { id: testDriver.id },
        data: {
          totalReviews: 1,
          totalBonusEarned: 5.00,
        },
      });

      console.log(`✅ Created sample 5-star review and $5 bonus for ${testDriver.initials}`);
    }

    console.log('\n🎉 Review-to-Tip feature seeded successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit /admin/review-to-tip to manage drivers and bonuses');
    console.log('2. Test QR codes at treasurehub.club/review/arm');
    console.log('3. Generate QR codes for driver cards');
    console.log('4. Set up proper Google Reviews URL in driver settings');

  } catch (error) {
    console.error('❌ Error seeding Review-to-Tip feature:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedReviewToTip();
