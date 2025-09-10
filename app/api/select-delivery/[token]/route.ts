import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/select-delivery/[token]
 * Fetch order details and available time slots using delivery token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Delivery token is required" },
        { status: 400 }
      );
    }

    // Find delivery slots by token (including confirmed ones)
    const deliverySlots = await prisma.deliveryTimeSlot.findMany({
      where: {
        token: token,
        isActive: true,
        status: { in: ["PENDING_SELECTION", "CONFIRMED"] },
      },
      include: {
        order: {
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
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    if (deliverySlots.length === 0) {
      // Check if token exists but is inactive (expired/superseded)
      const inactiveSlots = await prisma.deliveryTimeSlot.findMany({
        where: { token: token },
        include: {
          order: {
            include: {
              buyer: { select: { name: true } },
              listing: { select: { title: true } },
            },
          },
        },
        orderBy: { version: "desc" },
        take: 1,
      });

      if (inactiveSlots.length > 0) {
        const slot = inactiveSlots[0];
        // Check if there's a newer active version
        const newerSlots = await prisma.deliveryTimeSlot.findMany({
          where: {
            orderId: slot.orderId,
            isActive: true,
            version: { gt: slot.version },
          },
          take: 1,
        });

        if (newerSlots.length > 0) {
          return NextResponse.json({
            success: false,
            error: "This delivery selection link has been superseded by a newer one",
            details: {
              reason: "SUPERSEDED",
              customerName: slot.order.buyer.name,
              itemTitle: slot.order.listing.title,
              message: "A newer delivery time selection has been sent to your email. Please use the most recent link.",
            },
          }, { status: 410 }); // 410 Gone
        } else {
          return NextResponse.json({
            success: false,
            error: "This delivery selection link has expired",
            details: {
              reason: "EXPIRED",
              customerName: slot.order.buyer.name,
              itemTitle: slot.order.listing.title,
              message: "This delivery selection has expired. Please contact support for assistance.",
            },
          }, { status: 410 }); // 410 Gone
        }
      }

      return NextResponse.json(
        { success: false, error: "Invalid or expired delivery token" },
        { status: 404 }
      );
    }

    // Get order details from the first slot (all slots belong to same order)
    const order = deliverySlots[0].order;

    // Check if order is in the correct status for delivery scheduling
    const validStatuses = ["AWAITING_DELIVERY_SCHEDULING", "PENDING_SCHEDULING", "SCHEDULED"];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "Order is not available for delivery scheduling" },
        { status: 400 }
      );
    }

    // Check if there's already a confirmed slot
    const confirmedSlot = deliverySlots.find(slot => slot.status === "CONFIRMED");
    
    // Format the time slots for the frontend
    const timeSlots = deliverySlots
      .filter(slot => slot.status === "PENDING_SELECTION") // Only show pending slots for selection
      .map((slot) => ({
        id: slot.id,
        date: slot.date.toISOString().split('T')[0],
        dateLabel: slot.date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        windowId: slot.windowId,
        windowLabel: slot.windowLabel,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

    const orderDetails = {
      id: order.id,
      itemTitle: order.listing.title,
      itemId: order.listing.itemId,
      customerName: order.buyer.name,
      customerEmail: order.buyer.email,
      timeSlots: timeSlots,
      version: deliverySlots[0].version,
      expiresAt: deliverySlots[0].expiresAt,
      confirmedSlot: confirmedSlot ? {
        date: confirmedSlot.date.toISOString().split('T')[0],
        dateLabel: confirmedSlot.date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        windowId: confirmedSlot.windowId,
        windowLabel: confirmedSlot.windowLabel,
        startTime: confirmedSlot.startTime,
        endTime: confirmedSlot.endTime,
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      order: orderDetails,
    });

  } catch (error) {
    console.error("Error fetching delivery schedule:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
