import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/ses-server";

const prisma = new PrismaClient();

/**
 * POST /api/select-delivery/[token]/confirm
 * Customer confirms their preferred delivery time slot using token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { selectedSlot } = await request.json();

    if (!token || !selectedSlot) {
      return NextResponse.json(
        { success: false, error: "Delivery token and selected slot are required" },
        { status: 400 }
      );
    }

    // Find the delivery slots by token
    const deliverySlots = await prisma.deliveryTimeSlot.findMany({
      where: {
        token: token,
        isActive: true,
        status: "PENDING_SELECTION",
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
    });

    if (deliverySlots.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired delivery token" },
        { status: 404 }
      );
    }

    const order = deliverySlots[0].order;

    // Check if order is in the correct status
    const validStatuses = ["AWAITING_DELIVERY_SCHEDULING", "PENDING_SCHEDULING"];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "Order is not available for delivery scheduling" },
        { status: 400 }
      );
    }

    // Find the specific selected slot
    const selectedDeliverySlot = deliverySlots.find(slot => 
      slot.windowId === selectedSlot.windowId && 
      slot.date.toISOString().split('T')[0] === selectedSlot.date
    );

    if (!selectedDeliverySlot) {
      return NextResponse.json(
        { success: false, error: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Update the order and slots in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the order status and delivery information
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "SCHEDULED",
          estimatedDeliveryTime: (() => {
            // Create the delivery date/time properly in Central Time
            const [year, month, day] = selectedSlot.date.split('-').map(Number);
            const [hours, minutes] = selectedDeliverySlot.startTime.split(':').map(Number);
            
            // Create date object in local timezone (Central Time for Houston)
            const deliveryDate = new Date(year, month - 1, day, hours, minutes, 0);
            return deliveryDate;
          })(),
          deliveryNotes: `Scheduled for ${selectedSlot.dateLabel} during ${selectedDeliverySlot.windowLabel}`,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: "CUSTOMER_SELECTION",
        },
      });

      // Mark the selected slot as confirmed
      await tx.deliveryTimeSlot.update({
        where: { id: selectedDeliverySlot.id },
        data: {
          status: "CONFIRMED",
          selectedAt: new Date(),
        },
      });

      // Mark other slots for this token as cancelled
      await tx.deliveryTimeSlot.updateMany({
        where: {
          token: token,
          id: { not: selectedDeliverySlot.id },
          status: "PENDING_SELECTION",
        },
        data: {
          status: "CANCELLED",
        },
      });
    });

    // Send confirmation email to customer
    try {
      const subject = `Delivery Confirmed - Order #${order.id.slice(-8).toUpperCase()}`;
      const htmlContent = generateConfirmationEmailHTML({
        customerName: order.buyer.name,
        orderId: order.id,
        itemTitle: order.listing.title,
        itemId: order.listing.itemId,
        selectedSlot: selectedSlot,
      });

      await sendEmail(
        order.buyer.email,
        subject,
        htmlContent
      );

      console.log("Delivery confirmation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Delivery time selected successfully",
      selectedSlot: selectedSlot,
    });

  } catch (error) {
    console.error("Error selecting delivery time:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate confirmation email HTML
 */
function generateConfirmationEmailHTML(data: {
  customerName: string;
  orderId: string;
  itemTitle: string;
  itemId: string;
  selectedSlot: any;
}): string {
  const { customerName, orderId, itemTitle, itemId, selectedSlot } = data;
  const orderShortId = orderId.slice(-8).toUpperCase();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Confirmed</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .email-container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
        }
        .logo {
            text-align: center;
            margin-bottom: 10px;
        }
        .logo img {
            max-width: 300px;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .confirmation-box {
            background-color: #d4edda;
            border: 2px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .delivery-details {
            background-color: #fffbe6;
            border: 2px solid #D4AF3D;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .order-info {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://treasurehub.club'}/TreasureHub%20Banner%20Logo.png" 
                     alt="TreasureHub" />
            </div>
            <h1 style="color: #28a745;">Delivery Confirmed!</h1>
        </div>

        <div class="confirmation-box">
            <h2 style="color: #155724; margin-top: 0;">✅ Your delivery time has been confirmed</h2>
            <p style="color: #155724; margin-bottom: 0;">Thank you for selecting your preferred delivery window.</p>
        </div>

        <div class="order-info">
            <h3>📦 Order Details</h3>
            <p><strong>Order #:</strong> ${orderShortId}</p>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Item ID:</strong> ${itemId}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
        </div>

        <div class="delivery-details">
            <h3 style="color: #825e08; margin-top: 0;">🚚 Scheduled Delivery</h3>
            <p style="font-size: 18px; font-weight: bold; color: #825e08; margin: 10px 0;">
                ${selectedSlot.dateLabel}
            </p>
            <p style="font-size: 16px; color: #825e08; margin: 10px 0;">
                ${selectedSlot.windowLabel}
            </p>
        </div>

        <div style="margin: 25px 0;">
            <h4>📞 Need Help?</h4>
            <p>If you have any questions about your delivery, please contact us:</p>
            <p><strong>Phone:</strong> <a href="tel:+17138993656" style="color: #D4AF3D; text-decoration: none;">(713) 899-3656</a></p>
        </div>

        <div class="footer">
            <p>This confirmation was sent regarding your TreasureHub order. Please keep this email for your records.</p>
            <p>© ${new Date().getFullYear()} TreasureHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}
