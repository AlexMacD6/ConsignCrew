/**
 * Centralized email templates with deliverability best practices
 */

export interface EmailTemplateData {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Base email template with proper deliverability features
 */
function getBaseEmailTemplate(content: string, title: string, isTransactional: boolean = true) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
        <!--[if mso]>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, Helvetica, sans-serif; background-color: #f8fafc; line-height: 1.6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #d4af3d 0%, #825e08 100%); padding: 30px 30px 20px 30px; text-align: center;">
                <img src="https://treasurehub.club/TreasureHub%20Centered.png" alt="TreasureHub Logo" style="max-width: 350px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${title}</h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 20px 30px 40px 30px;">
                ${content}
            </div>

            <!-- Footer with Unsubscribe -->
            <div style="background-color: #1e293b; padding: 30px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">TreasureHub Team</p>
                <div style="border-top: 1px solid #334155; padding-top: 15px;">
                    <p style="color: #64748b; margin: 0 0 10px 0; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                        ${isTransactional ? 'This is an automated message. Please do not reply to this email.' : 'You received this email because you signed up for TreasureHub updates.'}
                    </p>
                    ${!isTransactional ? `
                    <p style="color: #64748b; margin: 0; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                        <a href="{{unsubscribe_url}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> | 
                        <a href="https://treasurehub.club" style="color: #64748b; text-decoration: underline;">Visit Website</a>
                    </p>
                    ` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Contact form notification email template
 */
export function getContactFormEmailTemplate(data: EmailTemplateData) {
  const content = `
    <!-- Timestamp at top -->
    <div style="background-color: #f9fafb; border-left: 4px solid #d4af3d; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
            <strong>Received:</strong> ${new Date().toLocaleString()}
        </p>
    </div>

    <!-- Alert Banner -->
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #991b1b; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Action Required</h2>
        <p style="color: #b91c1c; margin: 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">A new contact form submission requires your attention. Please respond within 24 hours.</p>
    </div>

    <!-- Submission Details -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Submission Details</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Name:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${data.name || 'Not provided'}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Email:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                    <a href="mailto:${data.email}" style="color: #1e293b; text-decoration: none;">${data.email}</a>
                </span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Subject:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${data.subject || 'No subject'}</span>
            </div>
        </div>
    </div>

    <!-- Message Content -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Customer Message</h3>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af3d; color: #374151; line-height: 1.7; font-style: italic; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
            ${(data.message || '').replace(/\n/g, '<br>')}
        </div>
    </div>

    <!-- Quick Actions -->
    <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Quick Actions</h3>
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <a href="mailto:${data.email}?subject=Re: ${data.subject}" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Reply to Customer</a>
            <a href="mailto:${data.email}?subject=Re: ${data.subject}&body=Hi ${data.name},%0D%0A%0D%0AThank you for contacting TreasureHub. We have received your message and will get back to you shortly.%0D%0A%0D%0ABest regards,%0D%0ATreasureHub Support Team" style="display: inline-block; background-color: #825e08; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Quick Response</a>
        </div>
    </div>
  `

  return getBaseEmailTemplate(content, 'New Contact Form Submission', true)
}

/**
 * Contact form confirmation email template
 */
export function getContactConfirmationEmailTemplate(data: EmailTemplateData) {
  const content = `
    <!-- Success Message -->
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Thank you for reaching out!</h2>
        <p style="color: #047857; margin: 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">We've successfully received your message and our team will get back to you within 24 hours.</p>
    </div>

    <!-- Message Details Card -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Message Details</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 80px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Name:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${data.name || 'Not provided'}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 80px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Email:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${data.email}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 80px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Subject:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${data.subject || 'No subject'}</span>
            </div>
        </div>
    </div>

    <!-- Message Content -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Your Message</h3>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af3d; font-style: italic; color: #374151; line-height: 1.7; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
            ${(data.message || '').replace(/\n/g, '<br>')}
        </div>
    </div>

    <!-- Next Steps -->
    <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">What's Next?</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
            <li style="margin-bottom: 8px;">Our team will review your message within 24 hours</li>
            <li style="margin-bottom: 8px;">We'll respond directly to your email address</li>
            <li style="margin-bottom: 8px;">For urgent matters, you can reach us at support@treasurehub.club</li>
        </ul>
    </div>

    <!-- Contact Info -->
    <div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Need immediate assistance?</h3>
        <a href="mailto:support@treasurehub.club" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Contact Support</a>
    </div>
  `

  return getBaseEmailTemplate(content, 'Message Received!', true)
}

/**
 * Welcome email template for new subscribers
 */
export function getWelcomeEmailTemplate(data: EmailTemplateData) {
  const content = `
    <!-- Welcome Message -->
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Welcome to TreasureHub!</h2>
        <p style="color: #047857; margin: 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">You're now on the list for early access to our revolutionary consignment platform.</p>
    </div>

    <!-- What to Expect -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">What to Expect</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #d4af3d; font-size: 20px; margin-right: 15px; font-weight: bold;">🎯</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Early Access Updates</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Be the first to know when we launch and get exclusive early access.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #d4af3d; font-size: 20px; margin-right: 15px; font-weight: bold;">💰</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Exclusive Offers</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Special discounts and offers only available to our early access list.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #d4af3d; font-size: 20px; margin-right: 15px; font-weight: bold;">🚀</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Platform Insights</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Behind-the-scenes updates on our platform development.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- CTA Section -->
    <div style="text-align: center; padding: 25px; background-color: #fef3c7; border-radius: 12px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Ready to get started?</h3>
        <p style="color: #92400e; margin: 0 0 20px 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Visit our website to learn more about how TreasureHub will revolutionize consignment.</p>
        <a href="https://treasurehub.club" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Visit TreasureHub</a>
    </div>
  `

  return getBaseEmailTemplate(content, 'Welcome to TreasureHub!', false)
}

/**
 * En Route notification email template
 */
export function getEnRouteEmailTemplate(data: {
  customerName: string;
  orderId: string;
  itemTitle: string;
  itemId: string;
  deliveryNotes?: string;
  phoneNumber?: string;
}) {
  const { customerName, orderId, itemTitle, itemId, deliveryNotes, phoneNumber } = data;
  const orderShortId = orderId.slice(-8).toUpperCase();
  
  const content = `
    <!-- En Route Alert -->
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">🚚 Your order is on the way!</h2>
        <p style="color: #1d4ed8; margin: 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Great news! Your TreasureHub order is now out for delivery and heading your way.</p>
    </div>

    <!-- Order Details -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">📦 Order Details</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Order #:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${orderShortId}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Item:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${itemTitle}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Item ID:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${itemId}</span>
            </div>
        </div>
    </div>

    ${deliveryNotes ? `
    <!-- Delivery Information -->
    <div style="background-color: #fffbe6; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #d4af3d;">
        <h3 style="color: #825e08; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">🕒 Delivery Window</h3>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af3d;">
            <p style="color: #825e08; margin: 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                ${deliveryNotes}
            </p>
        </div>
    </div>
    ` : ''}

    <!-- What to Expect -->
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">What to Expect</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #0ea5e9;">
                <span style="color: #0ea5e9; font-size: 20px; margin-right: 15px; font-weight: bold;">🚚</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Delivery in Progress</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Our delivery team is on their way to your location with your treasure.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #0ea5e9;">
                <span style="color: #0ea5e9; font-size: 20px; margin-right: 15px; font-weight: bold;">📱</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Stay Available</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Please ensure someone is available to receive the delivery during your scheduled window.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #0ea5e9;">
                <span style="color: #0ea5e9; font-size: 20px; margin-right: 15px; font-weight: bold;">✅</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Delivery Confirmation</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">You'll receive a confirmation email once your item has been successfully delivered.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Contact Information -->
    <div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Questions about your delivery?</h3>
        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Our team is here to help if you have any questions or concerns.</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            ${phoneNumber ? `
            <a href="tel:${phoneNumber.replace(/\D/g, '')}" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">📞 Call ${phoneNumber}</a>
            ` : ''}
            <a href="mailto:support@treasurehub.club?subject=Delivery Question - Order ${orderShortId}" style="display: inline-block; background-color: #825e08; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">✉️ Email Support</a>
        </div>
    </div>
  `

  return getBaseEmailTemplate(content, 'Your Order is On the Way!', true)
}

/**
 * Delivery confirmation email template
 */
export function getDeliveryConfirmationEmailTemplate(data: {
  customerName: string;
  orderId: string;
  itemTitle: string;
  itemId: string;
  deliveredAt: string;
  deliveryPhotos?: string[];
  phoneNumber?: string;
  contestPeriodExpiresAt?: string;
}) {
  const { customerName, orderId, itemTitle, itemId, deliveredAt, deliveryPhotos, phoneNumber, contestPeriodExpiresAt } = data;
  const orderShortId = orderId.slice(-8).toUpperCase();
  
  const content = `
    <!-- Delivery Success Alert -->
    <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #15803d; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">✅ Delivery Complete!</h2>
        <p style="color: #166534; margin: 0; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Great news! Your TreasureHub order has been successfully delivered.</p>
    </div>

    <!-- Order Details -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">📦 Order Details</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Order #:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${orderShortId}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Item:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${itemTitle}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Item ID:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${itemId}</span>
            </div>
            
            <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Delivered:</span>
                <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                    ${new Date(deliveredAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric", 
                      month: "long",
                      day: "numeric"
                    })} at ${new Date(deliveredAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}
                </span>
            </div>
        </div>
    </div>

    ${deliveryPhotos && deliveryPhotos.length > 0 ? `
    <!-- Delivery Photos -->
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">📸 Delivery Confirmation Photos</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${deliveryPhotos.map((photo, index) => `
                <div style="background-color: white; padding: 10px; border-radius: 8px; border: 1px solid #e0e7ff;">
                    <img src="${photo}" alt="Delivery Photo ${index + 1}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; display: block;">
                    <p style="text-align: center; margin: 8px 0 0 0; font-size: 12px; color: #6b7280; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Photo ${index + 1}</p>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${contestPeriodExpiresAt ? `
    <!-- Contest Period Notice -->
    <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">⚠️ Important: 24-Hour Review Period</h3>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                Review Period Expires: ${new Date(contestPeriodExpiresAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric", 
                  month: "long",
                  day: "numeric"
                })} at ${new Date(contestPeriodExpiresAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                })}
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                You have 24 hours from delivery to report any issues with your order. After this period, your order will be automatically finalized and the transaction will be complete.
            </p>
        </div>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #f59e0b;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 15px; font-weight: bold;">🔍</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Inspect Your Order</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Please check your delivered item carefully for any damage, missing parts, or discrepancies.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #f59e0b;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 15px; font-weight: bold;">📝</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Report Issues Immediately</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">If there are any problems, please report them within 24 hours using the link below.</p>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/contest-order/${orderId}" style="display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', Arial, Helvetica, sans-serif; margin-right: 15px;">🚨 Report an Issue</a>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                Only use this if there are genuine problems with your order
            </p>
        </div>
    </div>
    ` : ''}

    <!-- Success Message -->
    <div style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">🎉 Thank You for Choosing TreasureHub!</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #10b981;">
                <span style="color: #10b981; font-size: 20px; margin-right: 15px; font-weight: bold;">✅</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Order Complete</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Your treasure has been successfully delivered and your order is now complete.</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #10b981;">
                <span style="color: #10b981; font-size: 20px; margin-right: 15px; font-weight: bold;">⭐</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Share Your Experience</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">We'd love to hear about your TreasureHub experience. Your feedback helps us improve!</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; padding: 15px; background-color: white; border-radius: 8px; border-left: 3px solid #10b981;">
                <span style="color: #10b981; font-size: 20px; margin-right: 15px; font-weight: bold;">🔄</span>
                <div>
                    <h4 style="color: #1e293b; margin: 0 0 5px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Keep Exploring</h4>
                    <p style="color: #6b7280; margin: 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Discover more amazing treasures on our platform. New items are added daily!</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Contact Information -->
    <div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Questions or concerns?</h3>
        <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Our team is here to help with any questions about your delivery.</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            ${phoneNumber ? `
            <a href="tel:${phoneNumber.replace(/\D/g, '')}" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">📞 Call ${phoneNumber}</a>
            ` : ''}
            <a href="mailto:support@treasurehub.club?subject=Delivery Question - Order ${orderShortId}" style="display: inline-block; background-color: #825e08; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">✉️ Email Support</a>
            <a href="https://treasurehub.club" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">🏪 Browse More</a>
        </div>
    </div>
  `

  return getBaseEmailTemplate(content, 'Delivery Confirmed!', true)
} 