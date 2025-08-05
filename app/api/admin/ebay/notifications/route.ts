import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subscribeToEbayNotifications, getEbaySubscriptions } from '@/lib/ebay-utils';

/**
 * Admin endpoint for managing eBay Platform Notifications
 * 
 * Provides functionality to:
 * - View notification history and logs
 * - Subscribe to new notification topics
 * - Monitor eBay item tracking
 * - View subscription status
 */

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated", 
        message: "Please log in to access admin features" 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        members: { 
          where: { role: { in: ['ADMIN', 'OWNER'] } } 
        } 
      }
    });

    if (!user?.members.length) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Admin access required" 
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const topic = searchParams.get('topic');
    const processed = searchParams.get('processed');
    const level = searchParams.get('level'); // For logs

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (topic) where.topic = topic;
    if (processed !== null) where.processed = processed === 'true';

    // Get notifications
    const [notifications, totalNotifications] = await Promise.all([
      prisma.ebayNotification.findMany({
        where,
        include: {
          ebayItem: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Limit logs per notification
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.ebayNotification.count({ where })
    ]);

    // Get logs if requested
    let logs = null;
    if (level) {
      const logWhere: any = {};
      if (level) logWhere.level = level;
      
      logs = await prisma.ebayNotificationLog.findMany({
        where: logWhere,
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }

    // Get summary statistics
    const stats = await prisma.ebayNotification.groupBy({
      by: ['topic', 'processed'],
      _count: {
        id: true
      }
    });

    // Get eBay item summary
    const itemStats = await prisma.ebayItem.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        logs,
        pagination: {
          page,
          limit,
          total: totalNotifications,
          pages: Math.ceil(totalNotifications / limit)
        },
        stats,
        itemStats
      }
    });

  } catch (error) {
    console.error('Error fetching eBay notifications:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Failed to fetch notifications" 
    }, { status: 500 });
  }
}

/**
 * Subscribe to new eBay notification topics
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated", 
        message: "Please log in to access admin features" 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        members: { 
          where: { role: { in: ['ADMIN', 'OWNER'] } } 
        } 
      }
    });

    if (!user?.members.length) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Admin access required" 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, topics, webhookUrl } = body;

    switch (action) {
      case 'subscribe':
        if (!topics || !Array.isArray(topics) || !webhookUrl) {
          return NextResponse.json({ 
            error: "Missing required fields", 
            message: "topics array and webhookUrl are required" 
          }, { status: 400 });
        }

        const subscription = await subscribeToEbayNotifications(topics, webhookUrl);
        if (!subscription) {
          return NextResponse.json({ 
            error: "Failed to subscribe", 
            message: "Could not create eBay notification subscription" 
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: "Successfully subscribed to eBay notifications",
          data: subscription
        });

      case 'get_subscriptions':
        const subscriptions = await getEbaySubscriptions();
        return NextResponse.json({
          success: true,
          data: subscriptions
        });

      default:
        return NextResponse.json({ 
          error: "Invalid action", 
          message: "Supported actions: subscribe, get_subscriptions" 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing eBay notifications:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Failed to manage notifications" 
    }, { status: 500 });
  }
} 