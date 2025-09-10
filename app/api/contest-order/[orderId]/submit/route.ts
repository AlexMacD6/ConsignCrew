import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/contest-order/[orderId]/submit
 * Submit a dispute/contest for an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { reason, description, contactMethod } = await request.json();

    if (!orderId || !reason || !description) {
      return NextResponse.json(
        { success: false, error: "Order ID, reason, and description are required" },
        { status: 400 }
      );
    }

    // Find the order
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

    // Validate order status and contest period
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { success: false, error: "Only delivered orders can be contested" },
        { status: 400 }
      );
    }

    if (order.disputeReason) {
      return NextResponse.json(
        { success: false, error: "A dispute has already been filed for this order" },
        { status: 400 }
      );
    }

    if (order.contestPeriodExpiresAt && new Date() > order.contestPeriodExpiresAt) {
      return NextResponse.json(
        { success: false, error: "The contest period has expired" },
        { status: 410 }
      );
    }

    // Create dispute reason string
    const reasonLabels: Record<string, string> = {
      damaged: "Item was damaged during delivery",
      missing_parts: "Missing parts or accessories",
      wrong_item: "Wrong item delivered",
      not_as_described: "Item not as described",
      delivery_issues: "Delivery problems",
      other: "Other issue",
    };

    const disputeReason = `${reasonLabels[reason] || reason}: ${description}`;

    // Update order with dispute information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DISPUTED",
        disputeReason: disputeReason,
        disputeCreatedAt: new Date(),
        statusUpdatedAt: new Date(),
        statusUpdatedBy: "CUSTOMER_DISPUTE",
      },
    });

    // TODO: Send notification email to admin team about the dispute
    console.log(`Dispute filed for order ${orderId}: ${disputeReason}`);
    console.log(`Customer prefers contact via: ${contactMethod}`);

    return NextResponse.json({
      success: true,
      message: "Dispute submitted successfully",
      disputeId: updatedOrder.id,
    });

  } catch (error) {
    console.error("Error submitting dispute:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit dispute" },
      { status: 500 }
    );
  }
}
