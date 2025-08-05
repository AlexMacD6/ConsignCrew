import { prisma } from '@/lib/prisma';

export interface HistoryEventData {
  eventType: string;
  eventTitle: string;
  description: string;
  metadata?: any;
}

export async function createHistoryEvent(
  listingId: string,
  eventData: HistoryEventData
) {
  try {
    // Find the listing by itemId
    const listing = await prisma.listing.findUnique({
      where: { itemId: listingId },
    });

    if (!listing) {
      console.error('Listing not found for history event:', listingId);
      return null;
    }

    // Create the history event
    const historyEvent = await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        eventType: eventData.eventType,
        eventTitle: eventData.eventTitle,
        description: eventData.description,
        metadata: eventData.metadata || null,
      },
    });

    return historyEvent;
  } catch (error) {
    console.error('Error creating history event:', error);
    return null;
  }
}

// Predefined history events
export const HistoryEvents = {
  LISTING_CREATED: (title: string) => ({
    eventType: 'created',
    eventTitle: 'Listing Created',
    description: `Listing "${title}" was created and is now available for purchase.`,
  }),

  STATUS_CHANGED: (oldStatus: string, newStatus: string) => ({
    eventType: 'status_changed',
    eventTitle: 'Status Updated',
    description: `Listing status changed from ${oldStatus} to ${newStatus}.`,
    metadata: {
      old_value: oldStatus,
      new_value: newStatus,
    },
  }),

  PRICE_CHANGED: (oldPrice: number, newPrice: number) => ({
    eventType: 'price_changed',
    eventTitle: 'Price Updated',
    description: `Listing price changed from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`,
    metadata: {
      old_value: `$${oldPrice.toFixed(2)}`,
      new_value: `$${newPrice.toFixed(2)}`,
    },
  }),

  PRICE_DROP: (oldPrice: number, newPrice: number) => ({
    eventType: 'price_drop',
    eventTitle: 'Price Drop',
    description: `Price dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`,
    metadata: {
      old_value: `$${oldPrice.toFixed(2)}`,
      new_value: `$${newPrice.toFixed(2)}`,
    },
  }),

  PRICE_INCREASE: (oldPrice: number, newPrice: number) => ({
    eventType: 'price_increase',
    eventTitle: 'Price Increase',
    description: `Price increased from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`,
    metadata: {
      old_value: `$${oldPrice.toFixed(2)}`,
      new_value: `$${newPrice.toFixed(2)}`,
    },
  }),

  SOLD: (buyerName?: string) => ({
    eventType: 'sold',
    eventTitle: 'Item Sold',
    description: buyerName 
      ? `Item sold to ${buyerName}.`
      : 'Item has been sold.',
  }),

  IN_TRANSIT: () => ({
    eventType: 'in_transit',
    eventTitle: 'In Transit',
    description: 'Item is now in transit to the buyer.',
  }),

  DELIVERED: () => ({
    eventType: 'delivered',
    eventTitle: 'Delivered',
    description: 'Item has been delivered to the buyer.',
  }),

  VIEWED: (viewCount: number) => ({
    eventType: 'viewed',
    eventTitle: 'Listing Viewed',
    description: `Listing has been viewed ${viewCount} time${viewCount > 1 ? 's' : ''}.`,
    metadata: {
      view_count: viewCount,
    },
  }),

  EDITED: (fieldName: string) => ({
    eventType: 'edited',
    eventTitle: 'Listing Edited',
    description: `${fieldName} was updated.`,
    metadata: {
      field_name: fieldName,
    },
  }),

  REVIEWED: (rating: number, reviewerName?: string) => ({
    eventType: 'reviewed',
    eventTitle: 'Review Added',
    description: reviewerName
      ? `${reviewerName} left a ${rating}-star review.`
      : `A ${rating}-star review was added.`,
    metadata: {
      rating,
      reviewer_name: reviewerName,
    },
  }),

  LOCATION_CHANGED: (oldLocation: string, newLocation: string) => ({
    eventType: 'location_changed',
    eventTitle: 'Location Updated',
    description: `Location changed from ${oldLocation} to ${newLocation}.`,
    metadata: {
      old_value: oldLocation,
      new_value: newLocation,
    },
  }),

  CONDITION_CHANGED: (oldCondition: string, newCondition: string) => ({
    eventType: 'condition_changed',
    eventTitle: 'Condition Updated',
    description: `Condition changed from ${oldCondition} to ${newCondition}.`,
    metadata: {
      old_value: oldCondition,
      new_value: newCondition,
    },
  }),

  RESERVE_MET: (reservePrice: number) => ({
    eventType: 'reserve_met',
    eventTitle: 'Reserve Price Met',
    description: `Reserve price of $${reservePrice.toFixed(2)} has been met.`,
    metadata: {
      reserve_price: reservePrice,
    },
  }),
}; 