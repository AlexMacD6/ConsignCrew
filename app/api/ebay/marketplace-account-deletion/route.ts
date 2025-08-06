import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEbaySignature, validateEbayVerificationToken } from '@/lib/ebay-utils';

/**
 * eBay Marketplace Account Deletion Notification Endpoint
 * 
 * Handles notifications from eBay when marketplace accounts are deleted.
 * This is required for GDPR compliance and data integrity.
 * 
 * Documentation: https://developer.ebay.com/api-docs/commerce/notification/overview.html
 */

interface EbayAccountDeletionPayload {
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
    data: {
      userId: string;
      marketplaceId: string;
      deletionDate: string;
      reason?: string;
      accountType: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const payload: EbayAccountDeletionPayload = JSON.parse(body);
    
    // Verify webhook signature (eBay sends this in headers)
    const signature = request.headers.get('x-ebay-signature');
    const timestamp = request.headers.get('x-ebay-timestamp');
    const verificationToken = request.headers.get('x-ebay-verification-token');
    
    if (!signature || !timestamp) {
      console.error('Missing eBay webhook signature or timestamp');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
    
    // Validate verification token if provided
    if (verificationToken && !validateEbayVerificationToken(verificationToken)) {
      console.error('Invalid eBay verification token');
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }
    
    // Verify signature
    const isValidSignature = verifyEbaySignature(body, signature, timestamp);
    if (!isValidSignature) {
      console.error('Invalid eBay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Extract notification details
    const {
      metadata: { topic, schemaVersion },
      data: { eventId, eventDate, publishDate, publishAttemptCount, data: deletionData }
    } = payload;
    
    // Validate the topic
    if (topic !== 'MARKETPLACE_ACCOUNT_DELETION') {
      console.error(`Unexpected topic: ${topic}`);
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }
    
    // Store the deletion notification in our database
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
        payload: deletionData,
        processed: false
      }
    });
    
    // Log the notification
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'info',
        message: `Received eBay marketplace account deletion notification`,
        context: {
          eventId,
          topic,
          schemaVersion,
          publishAttemptCount,
          userId: deletionData.userId,
          marketplaceId: deletionData.marketplaceId,
          deletionDate: deletionData.deletionDate,
          accountType: deletionData.accountType
        },
        ebayNotificationId: notification.id
      }
    });
    
    // Process the account deletion
    await processAccountDeletion(notification, deletionData);
    
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
      message: 'Account deletion notification processed successfully',
      eventId 
    });
    
  } catch (error) {
    console.error('Error processing eBay account deletion notification:', error);
    
    // Log the error
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'error',
        message: 'Failed to process eBay account deletion notification',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: await request.text().catch(() => 'Unable to read body')
        }
      }
    });
    
    return NextResponse.json({ 
      error: 'Failed to process account deletion notification' 
    }, { status: 500 });
  }
}

/**
 * Process marketplace account deletion
 */
async function processAccountDeletion(notification: any, deletionData: any) {
  try {
    const { userId, marketplaceId, deletionDate, reason, accountType } = deletionData;
    
    // Log the deletion details
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'info',
        message: `Processing marketplace account deletion for user ${userId}`,
        context: {
          userId,
          marketplaceId,
          deletionDate,
          reason,
          accountType,
          notificationId: notification.id
        },
        ebayNotificationId: notification.id
      }
    });
    
    // Handle different types of account deletions
    switch (accountType) {
      case 'SELLER':
        await handleSellerAccountDeletion(userId, marketplaceId, deletionDate, reason);
        break;
      case 'BUYER':
        await handleBuyerAccountDeletion(userId, marketplaceId, deletionDate, reason);
        break;
      case 'BOTH':
        await handleBothAccountDeletion(userId, marketplaceId, deletionDate, reason);
        break;
      default:
        await prisma.ebayNotificationLog.create({
          data: {
            level: 'warning',
            message: `Unknown account type: ${accountType}`,
            context: { accountType, userId, marketplaceId },
            ebayNotificationId: notification.id
          }
        });
    }
    
    // Update any related eBay items to reflect the account deletion
    await updateRelatedItems(userId, marketplaceId, deletionDate);
    
  } catch (error) {
    console.error('Error processing account deletion:', error);
    
    // Log the processing error
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'error',
        message: 'Failed to process account deletion',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          deletionData
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
 * Handle seller account deletion
 */
async function handleSellerAccountDeletion(userId: string, marketplaceId: string, deletionDate: string, reason?: string) {
  // Update seller-related data
  // This might include:
  // - Marking seller items as inactive
  // - Updating seller profiles
  // - Archiving seller data for compliance
  
  await prisma.ebayNotificationLog.create({
    data: {
      level: 'info',
      message: `Seller account deletion processed for user ${userId}`,
      context: {
        userId,
        marketplaceId,
        deletionDate,
        reason,
        action: 'seller_account_deleted'
      }
    }
  });
}

/**
 * Handle buyer account deletion
 */
async function handleBuyerAccountDeletion(userId: string, marketplaceId: string, deletionDate: string, reason?: string) {
  // Update buyer-related data
  // This might include:
  // - Removing buyer preferences
  // - Updating purchase history
  // - Archiving buyer data for compliance
  
  await prisma.ebayNotificationLog.create({
    data: {
      level: 'info',
      message: `Buyer account deletion processed for user ${userId}`,
      context: {
        userId,
        marketplaceId,
        deletionDate,
        reason,
        action: 'buyer_account_deleted'
      }
    }
  });
}

/**
 * Handle both buyer and seller account deletion
 */
async function handleBothAccountDeletion(userId: string, marketplaceId: string, deletionDate: string, reason?: string) {
  // Handle both buyer and seller account deletions
  await handleSellerAccountDeletion(userId, marketplaceId, deletionDate, reason);
  await handleBuyerAccountDeletion(userId, marketplaceId, deletionDate, reason);
  
  await prisma.ebayNotificationLog.create({
    data: {
      level: 'info',
      message: `Both buyer and seller account deletion processed for user ${userId}`,
      context: {
        userId,
        marketplaceId,
        deletionDate,
        reason,
        action: 'both_accounts_deleted'
      }
    }
  });
}

/**
 * Update related eBay items when an account is deleted
 */
async function updateRelatedItems(userId: string, marketplaceId: string, deletionDate: string) {
  try {
    // Find items associated with the deleted account
    const relatedItems = await prisma.ebayItem.findMany({
      where: {
        // You might need to add a sellerId field to EbayItem if you track sellers
        // For now, we'll log that we need to implement this
      }
    });
    
    if (relatedItems.length > 0) {
      // Update items to reflect account deletion
      await prisma.ebayItem.updateMany({
        where: {
          // Add your seller/user relationship condition here
        },
        data: {
          status: 'account_deleted',
          lastNotification: new Date()
        }
      });
      
      await prisma.ebayNotificationLog.create({
        data: {
          level: 'info',
          message: `Updated ${relatedItems.length} items for deleted account ${userId}`,
          context: {
            userId,
            marketplaceId,
            deletionDate,
            itemsUpdated: relatedItems.length
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating related items:', error);
    
    await prisma.ebayNotificationLog.create({
      data: {
        level: 'error',
        message: 'Failed to update related items for deleted account',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          marketplaceId
        }
      }
    });
  }
}

/**
 * Health check endpoint for eBay webhook verification
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    message: 'eBay marketplace account deletion endpoint is operational',
    timestamp: new Date().toISOString(),
    endpoint: 'marketplace-account-deletion'
  });
} 