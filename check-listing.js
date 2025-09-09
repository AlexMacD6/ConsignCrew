const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkListing() {
  try {
    const result = await prisma.listing.findUnique({
      where: { itemId: 'B6IAJ2' },
      select: {
        itemId: true,
        status: true,
        isHeld: true,
        heldUntil: true,
        title: true
      }
    });
    
    console.log('Listing Status:', JSON.stringify(result, null, 2));
    
    // Also check for any pending orders
    const orders = await prisma.order.findMany({
      where: {
        listingId: result?.id || 0,
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true,
        checkoutExpiresAt: true,
        createdAt: true
      }
    });
    
    console.log('Pending Orders:', JSON.stringify(orders, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

checkListing();
