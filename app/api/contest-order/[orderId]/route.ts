import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/contest-order/[orderId]
 * Fetch order details for contest/dispute page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order with buyer and listing details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is in DELIVERED status
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { 
          success: false, 
          error: "This order is not eligible for contest. Only delivered orders can be contested." 
        },
        { status: 400 }
      );
    }

    // Check if there's already a dispute
    if (order.disputeReason) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A dispute has already been filed for this order." 
        },
        { status: 400 }
      );
    }

    // Check if contest period has expired
    if (order.contestPeriodExpiresAt && new Date() > order.contestPeriodExpiresAt) {
      return NextResponse.json(
        { 
          success: false, 
          error: "The contest period for this order has expired." 
        },
        { status: 410 }
      );
    }

    const orderDetails = {
      id: order.id,
      itemTitle: order.listing.title,
      itemId: order.listing.itemId,
      customerName: order.buyer.name,
      customerEmail: order.buyer.email,
      deliveredAt: order.deliveredAt?.toISOString(),
      contestPeriodExpiresAt: order.contestPeriodExpiresAt?.toISOString(),
      status: order.status,
      deliveryPhotos: order.deliveryPhotos as string[] || [],
    };

    return NextResponse.json({
      success: true,
      order: orderDetails,
    });

  } catch (error) {
    console.error("Error fetching contest order details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
