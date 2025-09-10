import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/cron/finalize-orders
 * Automatically finalize orders after 24-hour contest period expires
 * This should be called by a cron job or scheduled task
 */
export async function GET(request: NextRequest) {
  try {
    // Find all delivered orders where contest period has expired and no dispute exists
    const ordersToFinalize = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        contestPeriodExpiresAt: {
          lte: new Date(), // Contest period has expired
        },
        disputeReason: null, // No dispute filed
      },
      include: {
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            itemId: true,
            title: true,
          },
        },
      },
    });

    console.log(`Found ${ordersToFinalize.length} orders ready for finalization`);

    const finalizedOrders = [];

    // Process each order
    for (const order of ordersToFinalize) {
      try {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "FINALIZED",
            finalizedAt: new Date(),
            statusUpdatedAt: new Date(),
            statusUpdatedBy: "SYSTEM_AUTO_FINALIZE",
          },
        });

        finalizedOrders.push({
          orderId: order.id,
          orderShortId: order.id.slice(-8).toUpperCase(),
          customerName: order.buyer.name,
          itemTitle: order.listing.title,
          finalizedAt: updatedOrder.finalizedAt,
        });

        console.log(`Order ${order.id} automatically finalized`);
      } catch (error) {
        console.error(`Failed to finalize order ${order.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully finalized ${finalizedOrders.length} orders`,
      finalizedOrders: finalizedOrders,
      processedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in auto-finalization process:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process auto-finalization",
        processedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/finalize-orders
 * Manual trigger for finalization process (for testing or manual runs)
 */
export async function POST(request: NextRequest) {
  // Same logic as GET, but can be triggered manually
  return GET(request);
}
