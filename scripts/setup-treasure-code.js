import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTreasureCode() {
  try {
    console.log('Setting up treasure code...');

    // Check if code already exists
    const existingCode = await prisma.treasureCode.findUnique({
      where: { code: 'AB12CD' },
    });

    if (existingCode) {
      console.log('Treasure code AB12CD already exists');
      console.log('Current status:', {
        isActive: existingCode.isActive,
        currentUses: existingCode.currentUses,
        maxUses: existingCode.maxUses,
      });
      return;
    }

    // Create the treasure code
    const treasureCode = await prisma.treasureCode.create({
      data: {
        code: 'AB12CD',
        isActive: true,
        maxUses: 1, // Only one person can redeem this code
        currentUses: 0,
      },
    });

    console.log('✅ Treasure code created successfully!');
    console.log('Code:', treasureCode.code);
    console.log('Status: Active');
    console.log('Max uses:', treasureCode.maxUses);

  } catch (error) {
    console.error('❌ Error setting up treasure code:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTreasureCode(); 