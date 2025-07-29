'use server'

import { z } from 'zod'
import { sendEmail } from './ses-server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { prisma } from './prisma'

// Define validation schema for contact form
const contactSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Valid email address is required' }),
    subject: z.string().min(1, { message: 'Subject is required' }),
    message: z.string().min(1, { message: 'Message is required' }),
})

export type ContactFormData = z.infer<typeof contactSchema>

// Create interface for response
interface ContactResponse {
    success: boolean
    message: string
}

// Simple in-memory rate limiting store
// In production, you'd want to use Redis or a database
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_MAX_ATTEMPTS = 3 // Maximum attempts per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour window

/**
 * Get client IP address from request headers
 */
async function getClientIP(): Promise<string> {
    try {
        const headersList = await headers()
        // Try various headers that might contain the real IP
        const forwarded = headersList.get('x-forwarded-for')
        const realIP = headersList.get('x-real-ip')
        const cfConnectingIP = headersList.get('cf-connecting-ip')
        
        if (forwarded) {
            return forwarded.split(',')[0].trim()
        }
        if (realIP) {
            return realIP
        }
        if (cfConnectingIP) {
            return cfConnectingIP
        }
        
        // Fallback to a default for development
        return 'unknown'
    } catch (error) {
        console.warn('Could not get client IP:', error)
        return 'unknown'
    }
}

/**
 * Check if IP is rate limited
 */
function isRateLimited(ip: string): { limited: boolean; remainingAttempts: number; resetTime: number } {
    const now = Date.now()
    const record = rateLimitStore.get(ip)
    
    if (!record) {
        // First request from this IP
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return { limited: false, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS }
    }
    
    // Check if window has expired
    if (now > record.resetTime) {
        // Reset the counter
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return { limited: false, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS }
    }
    
    // Check if limit exceeded
    if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
        return { limited: true, remainingAttempts: 0, resetTime: record.resetTime }
    }
    
    // Increment counter
    record.count++
    rateLimitStore.set(ip, record)
    
    return { limited: false, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - record.count, resetTime: record.resetTime }
}

/**
 * Clean up expired rate limit records (run periodically)
 */
function cleanupRateLimitStore() {
    const now = Date.now()
    for (const [ip, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(ip)
        }
    }
}

/**
 * Server action to handle contact form submissions
 * Sends email notification to support team with rate limiting
 */
export async function submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    try {
        // Clean up expired records
        cleanupRateLimitStore()
        
        // Get client IP and check rate limiting
        const clientIP = await getClientIP()
        const rateLimit = isRateLimited(clientIP)
        
        if (rateLimit.limited) {
            const resetTime = new Date(rateLimit.resetTime).toLocaleString()
            return {
                success: false,
                message: `Too many contact form submissions. Please try again after ${resetTime}.`,
            }
        }
        
        // Validate form data
        const validatedData = contactSchema.parse(formData)

        // Save contact form submission to database
        const contactRecord = await prisma.contact.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                subject: validatedData.subject,
                message: validatedData.message,
                ipAddress: clientIP,
            },
        })

        // Log the contact form submission with IP
        console.log('Contact form submission:', {
            id: contactRecord.id,
            name: validatedData.name,
            email: validatedData.email,
            subject: validatedData.subject,
            message: validatedData.message,
            ip: clientIP,
            remainingAttempts: rateLimit.remainingAttempts,
            timestamp: new Date().toISOString(),
        })

        // Prepare email content for support
        const supportEmailHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Contact Form Submission - TreasureHub</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, Helvetica, sans-serif; background-color: #f8fafc; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo -->
                    <div style="background: linear-gradient(135deg, #d4af3d 0%, #825e08 100%); padding: 30px 30px 20px 30px; text-align: center;">
                        <img src="https://treasurehub.club/TreasureHub Centered.png" alt="TreasureHub Logo" style="max-width: 350px; height: auto; margin-bottom: 15px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">New Contact Form Submission</h1>
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 20px 30px 40px 30px;">
                        <!-- Timestamp at top -->
                        <div style="background-color: #f9fafb; border-left: 4px solid #d4af3d; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500; font-family: 'Poppins', Arial, Helvetica, sans-serif;"><strong>Received:</strong> ${new Date().toLocaleString()}</p>
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
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.name}</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                                    <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Email:</span>
                                    <a href="mailto:${validatedData.email}" style="color: #825e08; font-weight: 600; margin-left: 10px; text-decoration: none; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.email}</a>
                                </div>
                                
                                <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                                    <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Subject:</span>
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.subject}</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                                    <span style="color: #6b7280; font-weight: 500; min-width: 100px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Location:</span>
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Unknown</span>
                                </div>
                            </div>
                        </div>

                        <!-- Message Content -->
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Customer Message</h3>
                            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af3d; color: #374151; line-height: 1.7; font-style: italic; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                                ${validatedData.message.replace(/\n/g, '<br>')}
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #f59e0b;">
                            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Quick Actions</h3>
                            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                                <a href="mailto:${validatedData.email}?subject=Re: ${validatedData.subject}" style="display: inline-block; background-color: #d4af3d; color: #1e293b; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Reply to Customer</a>
                                <a href="mailto:${validatedData.email}?subject=Re: ${validatedData.subject}&body=Hi ${validatedData.name},%0D%0A%0D%0AThank you for contacting TreasureHub. We have received your message and will get back to you shortly.%0D%0A%0D%0ABest regards,%0D%0ATreasureHub Support Team" style="display: inline-block; background-color: #825e08; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Quick Response</a>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #1e293b; padding: 30px; text-align: center;">
                        <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">TreasureHub Support Team</p>
                        <div style="border-top: 1px solid #334155; padding-top: 15px;">
                            <p style="color: #64748b; margin: 0; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">This is an automated notification from the contact form system.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `

        // Send notification email to support
        await sendEmail(
            'support@treasurehub.club',
            `Contact Form: ${validatedData.subject}`,
            supportEmailHtml,
            validatedData.email
        )

        // Send confirmation email to user
        const userEmailHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Message Received - TreasureHub</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, Helvetica, sans-serif; background-color: #f8fafc; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo -->
                    <div style="background: linear-gradient(135deg, #d4af3d 0%, #825e08 100%); padding: 30px 30px 20px 30px; text-align: center;">
                        <img src="https://treasurehub.club/TreasureHub Centered.png" alt="TreasureHub Logo" style="max-width: 350px; height: auto; margin-bottom: 15px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Message Received!</h1>
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 20px 30px 40px 30px;">
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
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.name}</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                                    <span style="color: #6b7280; font-weight: 500; min-width: 80px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Email:</span>
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.email}</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; padding: 12px; background-color: white; border-radius: 8px; border-left: 3px solid #d4af3d;">
                                    <span style="color: #6b7280; font-weight: 500; min-width: 80px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Subject:</span>
                                    <span style="color: #1e293b; font-weight: 600; margin-left: 10px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${validatedData.subject}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Message Content -->
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Your Message</h3>
                            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af3d; font-style: italic; color: #374151; line-height: 1.7; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                                ${validatedData.message.replace(/\n/g, '<br>')}
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
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #1e293b; padding: 30px; text-align: center;">
                        <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">Thank you for choosing TreasureHub</p>
                        <div style="border-top: 1px solid #334155; padding-top: 15px;">
                            <p style="color: #64748b; margin: 0; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `

        // Try to send confirmation email to user, but don't fail if it doesn't work
        try {
            await sendEmail(
                validatedData.email,
                `Message Received: ${validatedData.subject}`,
                userEmailHtml,
                'support@treasurehub.club'
            )
            console.log(`Confirmation email sent to user: ${validatedData.email}`)
        } catch (userEmailError) {
            console.warn(`Could not send confirmation email to user ${validatedData.email}:`, userEmailError)
            // Don't throw the error - the form submission is still successful
            // The support team will still receive the notification
        }

        // Revalidate the contact page to show success message
        revalidatePath('/contact')

        return {
            success: true,
            message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
        }
    } catch (error) {
        console.error('Contact form submission error:', error)
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0]
            return {
                success: false,
                message: firstError.message,
            }
        }

        // Handle SES-specific errors
        if (error instanceof Error) {
            if (error.message?.includes('AWS credentials not configured')) {
                return {
                    success: false,
                    message: 'Email service not configured. Please try again later.',
                }
            }
            
            if (error.message?.includes('MessageRejected')) {
                return {
                    success: false,
                    message: 'Email address not verified or rejected. Please try again.',
                }
            }
            
            if (error.message?.includes('MailFromDomainNotVerified')) {
                return {
                    success: false,
                    message: 'Sender domain not verified. Please try again later.',
                }
            }
        }

        return {
            success: false,
            message: 'There was an error submitting your message. Please try again.',
        }
    }
} 