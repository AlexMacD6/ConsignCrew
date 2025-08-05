import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * eBay Platform Notifications Webhook Endpoint
 * 
 * Receives real-time notifications from eBay about item updates, price changes,
 * and availability status for items we're monitoring via the Browse API.
 * 
 * Documentation: https://developer.ebay.com/api-docs/commerce/notification/overview.html
 */

interface EbayNotificationPayload {
  metadata: {
    topic: string;
    schemaVersion: string;
    deprecationDate?: string;
  };
  data: {
    eventId: string;
    eventDate: string;
    publishDate: string;
    publishAttemptCount: number;
    data: any; // The actual notification data varies by topic
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const payload: EbayNotificationPayload = JSON.parse(body);
    
    // Verify webhook signature (eBay sends this in headers)
    const signature = request.headers.get('x-ebay-signature');
    const timestamp = request.headers.get('x-ebay-timestamp');
    
    if (!signature || !timestamp) {
      console.error('Missing eBay webhook signature or timestamp');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
    
    // TODO: Implement signature verification using eBay's public key
    // const isValidSignature = verifyEbaySignature(body, signature, timestamp);
    // if (!isValidSignature) {
    //   console.error('Invalid eBay webhook signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    // Extract notification details
    const {
      metadata: { topic, schemaVersion },
      data: { eventId, eventDate, publishDate, publishAttemptCount, data: notificationData }
    } = payload;
    
    // Store the notification in our database
    const notification = await prisma.ebayNotification.create({
      data: {
        notificationId: eventId,
        topic,
        dataSchema: schemaVersion,
        dataVersion: schemaVersion,
        eventId,
        eventDate: new Date(eventDate),
        publishDate: new Date(publishDate),
        publishAttemptCount,
        payload: notificationData,
        processed: false
      }
    });
    
    // Log the notification
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'info',
        message: `Received eBay notification: ${topic}`,
        context: {
          eventId,
          topic,
          schemaVersion,
          publishAttemptCount
        },
        ebayNotificationId: notification.id
      }
    });
    
    // Process the notification based on topic
    await processNotification(notification, topic, notificationData);
    
    // Mark as processed
    await prisma.ebayNotification.update({
      where: { id: notification.id },
      data: { 
        processed: true,
        processedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification processed successfully',
      eventId 
    });
    
  } catch (error) {
    console.error('Error processing eBay notification:', error);
    
    // Log the error
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'error',
        message: 'Failed to process eBay notification',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: await request.text().catch(() => 'Unable to read body')
        }
      }
    });
    
    return NextResponse.json({ 
      error: 'Failed to process notification' 
    }, { status: 500 });
  }
}

/**
 * Process different types of eBay notifications
 */
async function processNotification(
  notification: any, 
  topic: string, 
  data: any
) {
  try {
    switch (topic) {
      case 'ITEM_UPDATED':
        await handleItemUpdated(notification, data);
        break;
      case 'ITEM_SOLD':
        await handleItemSold(notification, data);
        break;
      case 'ITEM_ENDED':
        await handleItemEnded(notification, data);
        break;
      case 'PRICE_CHANGED':
        await handlePriceChanged(notification, data);
        break;
      case 'QUANTITY_CHANGED':
        await handleQuantityChanged(notification, data);
        break;
      default:
        await prisma.ebayNotificationLog.create({
          data: {
            level: 'warning',
            message: `Unhandled notification topic: ${topic}`,
            context: { topic, data },
            ebayNotificationId: notification.id
          }
        });
    }
  } catch (error) {
    console.error(`Error processing ${topic} notification:`, error);
    
    // Log the processing error
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'error',
        message: `Failed to process ${topic} notification`,
        context: {
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
          data
        },
        ebayNotificationId: notification.id
      }
    });
    
    // Update notification with error
    await prisma.ebayNotification.update({
      where: { id: notification.id },
      data: { 
        processingError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Handle ITEM_UPDATED notifications
 */
async function handleItemUpdated(notification: any, data: any) {
  const { itemId, title, price, condition, brand, modelNumber, gtin } = data;
  
  // Update or create the eBay item record
  await prisma.ebayItem.upsert({
    where: { ebayItemId: itemId },
    update: {
      title,
      price: parseFloat(price.amount),
      currency: price.currency || 'USD',
      condition,
      brand,
      modelNumber,
      gtin,
      lastNotification: new Date(),
      updatedAt: new Date()
    },
    create: {
      ebayItemId: itemId,
      title,
      price: parseFloat(price.amount),
      currency: price.currency || 'USD',
      condition,
      brand,
      modelNumber,
      gtin,
      lastNotification: new Date()
    }
  });
  
  // Link notification to item
  await prisma.ebayNotification.update({
    where: { id: notification.id },
    data: {
      ebayItem: {
        connect: { ebayItemId: itemId }
      }
    }
  });
}

/**
 * Handle ITEM_SOLD notifications
 */
async function handleItemSold(notification: any, data: any) {
  const { itemId } = data;
  
  await prisma.ebayItem.update({
    where: { ebayItemId: itemId },
    data: {
      status: 'sold',
      lastNotification: new Date()
    }
  });
}

/**
 * Handle ITEM_ENDED notifications
 */
async function handleItemEnded(notification: any, data: any) {
  const { itemId } = data;
  
  await prisma.ebayItem.update({
    where: { ebayItemId: itemId },
    data: {
      status: 'ended',
      lastNotification: new Date()
    }
  });
}

/**
 * Handle PRICE_CHANGED notifications
 */
async function handlePriceChanged(notification: any, data: any) {
  const { itemId, price } = data;
  
  const item = await prisma.ebayItem.findUnique({
    where: { ebayItemId: itemId }
  });
  
  if (item) {
    // Update price and track history
    const priceHistory = item.priceHistory ? 
      Array.isArray(item.priceHistory) ? item.priceHistory : [] : [];
    
    priceHistory.push({
      price: parseFloat(price.amount),
      currency: price.currency || 'USD',
      timestamp: new Date().toISOString()
    });
    
    await prisma.ebayItem.update({
      where: { ebayItemId: itemId },
      data: {
        price: parseFloat(price.amount),
        priceHistory: priceHistory.slice(-10), // Keep last 10 price changes
        lastPriceUpdate: new Date(),
        lastNotification: new Date()
      }
    });
  }
}

/**
 * Handle QUANTITY_CHANGED notifications
 */
async function handleQuantityChanged(notification: any, data: any) {
  const { itemId, quantity } = data;
  
  await prisma.ebayItem.update({
    where: { ebayItemId: itemId },
    data: {
      lastNotification: new Date()
    }
  });
  
  // Log quantity change for potential inventory tracking
  await prisma.ebayNotificationLog.create({
    data: {
      level: 'info',
      message: `Quantity changed for item ${itemId}: ${quantity}`,
      context: { itemId, quantity },
      ebayNotificationId: notification.id
    }
  });
}

/**
 * Health check endpoint for eBay webhook verification
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    message: 'eBay notifications endpoint is operational',
    timestamp: new Date().toISOString()
  });
} 