import { sendEmail } from './ses-server';

interface OrderDetails {
  id: string;
  amount: number;
  createdAt: string;
  status: string;
  listing: {
    title: string;
    itemId: string;
    photos?: any;
  };
  buyer: {
    name: string;
    email: string;
  };
  seller?: {
    name: string;
  };
}

/**
 * Send order confirmation email to buyer
 * @param orderDetails - Complete order information
 * @returns Promise with the SES send result
 */
export async function sendOrderConfirmationEmail(orderDetails: OrderDetails) {
  try {
    console.log('Sending order confirmation email to:', orderDetails.buyer.email);
    
    const subject = `Order Confirmation - ${orderDetails.listing.title} (Order #${orderDetails.id.slice(-8).toUpperCase()})`;
    
    const htmlContent = generateOrderConfirmationHTML(orderDetails);
    const textContent = generateOrderConfirmationText(orderDetails);
    
    const result = await sendEmail(
      orderDetails.buyer.email,
      subject,
      htmlContent,
      process.env.CONTACT_FORM_EMAIL, // Reply-to address
      textContent
    );
    
    console.log('Order confirmation email sent successfully:', result.MessageId);
    return result;
    
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}

/**
 * Generate HTML content for order confirmation email
 */
function generateOrderConfirmationHTML(order: OrderDetails): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const orderShortId = order.id.slice(-8).toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - TreasureHub</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .email-container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
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
        .success-icon {
          width: 60px;
          height: 60px;
          background-color: #10b981;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-checkmark {
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        .title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 40px;
        }
        .order-details {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 40px;
        }
        .order-details-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 30px;
          text-align: center;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .detail-section {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
        }
        .detail-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 8px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
        }
        .detail-row:last-child {
          margin-bottom: 0;
        }
        .detail-label {
          font-weight: 500;
          color: #6b7280;
        }
        .detail-value {
          font-weight: 600;
          color: #1f2937;
        }
        .total-amount {
          font-size: 20px;
          font-weight: bold;
          color: #D4AF3D;
        }
        .status-badge {
          background-color: #dcfce7;
          color: #166534;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }
        .next-steps {
          background-color: #f0f9ff;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 30px;
        }
        .next-steps-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 15px;
          background-color: white;
          border-radius: 8px;
        }
        .step:last-child {
          margin-bottom: 0;
        }
        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 14px;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }
        .step-processing {
          background-color: #3b82f6;
        }
        .step-shipping {
          background-color: #8b5cf6;
        }
        .step-delivery {
          background-color: #10b981;
        }
        .step-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }
        .step-content p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background-color: #D4AF3D;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px auto;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #f3f4f6;
        }
        .footer p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .footer-links a {
          color: #D4AF3D;
          text-decoration: none;
          margin: 0 10px;
          font-size: 12px;
        }
        @media (max-width: 600px) {
          .details-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .email-container {
            padding: 20px;
          }
          .title {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/TreasureHub%20Banner%20Logo.png" alt="TreasureHub" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          </div>
          <div class="success-icon">
            <div class="success-checkmark">✓</div>
          </div>
          <h1 class="title">Thank You for Your Purchase!</h1>
          <p class="subtitle">Your order has been confirmed and is being processed.</p>
        </div>

        <!-- Order Details -->
        <div class="order-details">
          <h2 class="order-details-title">Order Details</h2>
          <div class="details-grid">
            <!-- Order Information -->
            <div class="detail-section">
              <h3>Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${orderShortId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${orderDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total:</span>
                <span class="detail-value total-amount">$${order.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge">✓ Payment Confirmed</span>
              </div>
            </div>

            <!-- Item Details -->
            <div class="detail-section">
              <h3>Item Details</h3>
              <div class="detail-row">
                <span class="detail-label">Item:</span>
                <span class="detail-value">${order.listing.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">SKU:</span>
                <span class="detail-value">${order.listing.itemId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Buyer:</span>
                <span class="detail-value">${order.buyer.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${order.buyer.email}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div class="next-steps">
          <h2 class="next-steps-title">What Happens Next?</h2>
          
          <div class="step">
            <div class="step-icon step-processing">📦</div>
            <div class="step-content">
              <h4>Order Processing</h4>
              <p>We're preparing your item for shipment. You'll receive updates as your order progresses.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-icon step-shipping">📍</div>
            <div class="step-content">
              <h4>Shipping & Delivery</h4>
              <p>Once shipped, you'll receive tracking information. Delivery typically takes 1-3 business days.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-icon step-delivery">✅</div>
            <div class="step-content">
              <h4>After Delivery</h4>
              <p>You'll have 24 hours to inspect your item. After that, the order will be finalized.</p>
            </div>
          </div>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/profile" class="cta-button">
            View Order Status
          </a>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Powered by Stripe for secure payment processing</p>
          <p>© ${new Date().getFullYear()} TreasureHub. Exceptional concierge delivery service.</p>
          <div class="footer-links">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/policies/privacy">Privacy Policy</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/policies/terms">Terms of Service</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/contact">Contact</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text content for order confirmation email
 */
function generateOrderConfirmationText(order: OrderDetails): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const orderShortId = order.id.slice(-8).toUpperCase();
  
  return `
TreasureHub - Order Confirmation

Thank You for Your Purchase!
Your order has been confirmed and is being processed.

ORDER DETAILS
=============
Order ID: ${orderShortId}
Date: ${orderDate}
Total: $${order.amount.toFixed(2)}
Status: Payment Confirmed

ITEM DETAILS
============
Item: ${order.listing.title}
SKU: ${order.listing.itemId}
Buyer: ${order.buyer.name}
Email: ${order.buyer.email}

WHAT HAPPENS NEXT?
==================

1. Order Processing
   We're preparing your item for shipment. You'll receive updates as your order progresses.

2. Shipping & Delivery
   Once shipped, you'll receive tracking information. Delivery typically takes 1-3 business days.

3. After Delivery
   You'll have 24 hours to inspect your item. After that, the order will be finalized.

View your order status: ${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/profile

---
Powered by Stripe for secure payment processing
© ${new Date().getFullYear()} TreasureHub. Exceptional concierge delivery service.

Privacy Policy: ${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/policies/privacy
Terms of Service: ${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/policies/terms
Contact: ${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/contact
  `.trim();
}
