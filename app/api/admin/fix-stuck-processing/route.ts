import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to immediately fix listings stuck in PROCESSING status
 * This will reset any listings that are in processing status but not properly held
 * 
 * GET /api/admin/fix-stuck-processing
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may need to adjust this based on your admin logic)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const now = new Date();
    let fixedCount = 0;

    // Find listings stuck in PROCESSING status
    const stuckProcessingListings = await prisma.listing.findMany({
      where: {
        status: 'processing',
        OR: [
          { isHeld: false },
          { heldUntil: null },
          { heldUntil: { lt: now } }
        ]
      },
      include: {
        Order: {
          where: {
            status: 'PENDING',
            checkoutExpiresAt: { lt: now }
          }
        }
      }
    });

    for (const listing of stuckProcessingListings) {
      try {
        // Update listing back to active
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            status: 'active',
            isHeld: false,
            heldUntil: null,
            updatedAt: new Date(),
          },
        });

        // Cancel any expired orders for this listing
        if (listing.Order.length > 0) {
          await prisma.order.updateMany({
            where: {
              listingId: listing.id,
              status: 'PENDING',
              checkoutExpiresAt: { lt: now }
            },
            data: {
              status: 'CANCELLED',
              updatedAt: new Date(),
            },
          });
        }

        // Create listing history event
        await prisma.listingHistory.create({
          data: {
            listingId: listing.id,
            eventType: 'STATUS_RESET',
            eventTitle: 'Processing Status Reset',
            description: 'Listing was stuck in processing status and has been manually reset to active',
            metadata: {
              resetAt: now.toISOString(),
              reason: 'Manual admin cleanup of stuck processing status',
              adminUserId: session.user.id,
            },
          },
        });

        fixedCount++;
      } catch (error) {
        console.error(`Error fixing listing ${listing.id}:`, error);
      }
    }

    console.log(`Fixed ${fixedCount} listings stuck in processing status`);

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${fixedCount} listings stuck in processing status`,
      fixedCount,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Error fixing stuck processing listings:', error);
    return NextResponse.json(
      { error: 'Failed to fix stuck processing listings' },
      { status: 500 }
    );
  }
}

// Also allow POST for form submissions
export const POST = GET;
