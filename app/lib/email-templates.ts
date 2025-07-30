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