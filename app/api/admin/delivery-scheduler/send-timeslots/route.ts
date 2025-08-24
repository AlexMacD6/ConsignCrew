import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface TimeSlot {
  date: string;
  dateLabel: string;
  windowId: string;
  windowLabel: string;
  startTime: string;
  endTime: string;
}

interface EmailData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  timeSlots: TimeSlot[];
  itemTitle: string;
  itemId: string;
}

export async function POST(request: NextRequest) {
  try {
    const emailData: EmailData = await request.json();

    // Validate required fields
    if (!emailData.customerEmail || !emailData.timeSlots || emailData.timeSlots.length === 0) {
      return NextResponse.json(
        { error: "Missing required email data" },
        { status: 400 }
      );
    }

    // Generate the selection URL (you'll need to create this page)
    const selectionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://treasurehub.store"}/delivery-schedule/${emailData.orderId}`;

    // Create HTML email template
    const htmlBody = generateEmailHTML(emailData, selectionUrl);
    const textBody = generateEmailText(emailData, selectionUrl);

    // Configure SES email parameters
    const emailParams = {
      Source: process.env.SES_FROM_EMAIL || process.env.AWS_SES_VERIFIED_EMAIL || "your-verified-email@gmail.com",
      Destination: {
        ToAddresses: [emailData.customerEmail],
      },
      Message: {
        Subject: {
          Data: `Choose Your Delivery Time - Order #${emailData.orderId.slice(-8).toUpperCase()}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    };

    // Send email via SES
    const command = new SendEmailCommand(emailParams);
    const result = await sesClient.send(command);

    return NextResponse.json({
      success: true,
      messageId: result.MessageId,
      message: "Time slot email sent successfully",
    });

  } catch (error: any) {
    console.error("Error sending time slot email:", error);
    
    // Handle specific SES errors
    let errorMessage = "Failed to send email";
    let statusCode = 500;
    
    if (error?.name === "MessageRejected") {
      if (error.message?.includes("Email address is not verified")) {
        errorMessage = "Sender email address not verified in SES. Please verify the sender email address.";
        statusCode = 400;
      }
    } else if (error?.name === "InvalidParameterValue") {
      errorMessage = "Invalid email parameters. Please check email addresses.";
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        sesError: error?.name || "Unknown"
      },
      { status: statusCode }
    );
  }
}

function generateEmailHTML(emailData: EmailData, selectionUrl: string): string {
  const orderShortId = emailData.orderId.slice(-8).toUpperCase();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Choose Your Delivery Time</title>
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
            font-size: 24px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
        }
        .order-info {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .time-slot {
            background-color: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        .time-slot:hover {
            border-color: #6366f1;
            background-color: #f0f4ff;
        }
        .slot-day {
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
        }
        .slot-time {
            color: #6b7280;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background-color: #6366f1;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🏪 TreasureHub</div>
            <h1>Choose Your Delivery Time</h1>
            <p>We're ready to deliver your treasure!</p>
        </div>

        <div class="order-info">
            <h3>📦 Order Details</h3>
            <p><strong>Order #:</strong> ${orderShortId}</p>
            <p><strong>Item:</strong> ${emailData.itemTitle}</p>
            <p><strong>Item ID:</strong> ${emailData.itemId}</p>
        </div>

        <div class="highlight">
            <p><strong>⏰ Please select your preferred delivery time from the options below:</strong></p>
        </div>

        <h3>📅 Available Delivery Windows</h3>
        
        ${emailData.timeSlots.map(slot => `
            <div class="time-slot">
                <div class="slot-day">${slot.dateLabel}</div>
                <div class="slot-time">${slot.windowLabel}</div>
            </div>
        `).join('')}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${selectionUrl}" class="cta-button">
                Select Your Delivery Time →
            </a>
        </div>

        <div class="highlight">
            <p><strong>🚚 Important:</strong> Please respond within 24 hours to secure your preferred time slot. Delivery windows are limited and assigned on a first-come, first-served basis.</p>
        </div>

        <div style="margin-top: 25px;">
            <h4>📞 Need Help?</h4>
            <p>If you have any questions or need to discuss alternative arrangements, please don't hesitate to contact us.</p>
        </div>

        <div class="footer">
            <p>This email was sent regarding your TreasureHub order. If you believe you received this email in error, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} TreasureHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

function generateEmailText(emailData: EmailData, selectionUrl: string): string {
  const orderShortId = emailData.orderId.slice(-8).toUpperCase();
  
  return `
🏪 TreasureHub - Choose Your Delivery Time

Hi ${emailData.customerName},

We're ready to deliver your treasure! Please select your preferred delivery time from the available options.

📦 ORDER DETAILS
Order #: ${orderShortId}
Item: ${emailData.itemTitle}
Item ID: ${emailData.itemId}

📅 AVAILABLE DELIVERY WINDOWS:
${emailData.timeSlots.map(slot => `• ${slot.dateLabel} - ${slot.windowLabel}`).join('\n')}

🔗 SELECT YOUR TIME:
${selectionUrl}

🚚 IMPORTANT: Please respond within 24 hours to secure your preferred time slot. Delivery windows are limited and assigned on a first-come, first-served basis.

📞 NEED HELP?
If you have any questions or need to discuss alternative arrangements, please don't hesitate to contact us.

---
© ${new Date().getFullYear()} TreasureHub. All rights reserved.
This email was sent regarding your TreasureHub order.
`;
}
