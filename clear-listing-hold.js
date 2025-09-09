const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearListingHold() {
  try {
    console.log('🔍 Checking current status...');
    
    // First get the listing ID
    const listing = await prisma.listing.findUnique({
      where: { itemId: 'B6IAJ2' },
      select: {
        id: true,
        itemId: true,
        status: true,
        isHeld: true,
        heldUntil: true,
        title: true
      }
    });
    
    if (!listing) {
      console.log('❌ Listing not found');
      return;
    }
    
    console.log('📋 Current Status:', JSON.stringify(listing, null, 2));
    
    // Clear the hold on the listing
    console.log('🧹 Clearing listing hold...');
    await prisma.listing.update({
      where: { itemId: 'B6IAJ2' },
      data: {
        isHeld: false,
        heldUntil: null,
        status: 'active'
      }
    });
    
    // Find and delete any pending orders for this listing
    console.log('🔍 Looking for pending orders...');
    const pendingOrders = await prisma.order.findMany({
      where: {
        listingId: listing.id,
        status: 'PENDING'
      }
    });
    
    console.log(`📋 Found ${pendingOrders.length} pending orders`);
    
    if (pendingOrders.length > 0) {
      console.log('🗑️ Deleting pending orders...');
      await prisma.order.deleteMany({
        where: {
          listingId: listing.id,
          status: 'PENDING'
        }
      });
      console.log('✅ Deleted pending orders');
    }
    
    // Clear any cart items for this listing (optional)
    console.log('🛒 Clearing cart items...');
    await prisma.cartItem.deleteMany({
      where: {
        listingId: listing.id
      }
    });
    
    console.log('✅ Listing B6IAJ2 is now available for purchase!');
    
    // Verify the changes
    const updatedListing = await prisma.listing.findUnique({
      where: { itemId: 'B6IAJ2' },
      select: {
        itemId: true,
        status: true,
        isHeld: true,
        heldUntil: true
      }
    });
    
    console.log('📋 Updated Status:', JSON.stringify(updatedListing, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

clearListingHold();
