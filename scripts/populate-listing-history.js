import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateListingHistory() {
  try {
    console.log('Starting to populate listing history...');

    // Get all existing listings
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        itemId: true,
        title: true,
        status: true,
        price: true,
        condition: true,
        neighborhood: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`Found ${listings.length} listings to process`);

    for (const listing of listings) {
      console.log(`Processing listing: ${listing.itemId} - ${listing.title}`);

      // Check if history already exists for this listing
      const existingHistory = await prisma.listingHistory.findFirst({
        where: { listingId: listing.id },
      });

      if (existingHistory) {
        console.log(`History already exists for ${listing.itemId}, skipping...`);
        continue;
      }

      // Create initial "created" event
      await prisma.listingHistory.create({
        data: {
          listingId: listing.id,
          eventType: 'created',
          eventTitle: 'Listing Created',
          description: `Listing "${listing.title}" was created and is now available for purchase.`,
        },
      });

      // Create status event if not "active"
      if (listing.status !== 'active') {
        await prisma.listingHistory.create({
          data: {
            listingId: listing.id,
            eventType: 'status_changed',
            eventTitle: 'Status Updated',
            description: `Listing status changed from active to ${listing.status}.`,
            metadata: {
              old_value: 'active',
              new_value: listing.status,
            },
          },
        });
      }

      console.log(`Created history events for ${listing.itemId}`);
    }

    console.log('Listing history population completed successfully!');
  } catch (error) {
    console.error('Error populating listing history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateListingHistory(); 