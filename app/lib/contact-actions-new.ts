'use server'

import { z } from 'zod'
import { sendEmail } from './ses-server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { prisma } from './prisma'
import { getContactFormEmailTemplate, getContactConfirmationEmailTemplate } from './email-templates'

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

export async function submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    try {
        // Clean up expired rate limit records
        cleanupRateLimitStore()
        
        // Get client IP for rate limiting
        const clientIP = await getClientIP()
        
        // Check rate limiting
        const rateLimit = isRateLimited(clientIP)
        if (rateLimit.limited) {
            const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString()
            return {
                success: false,
                message: `Too many attempts. Please try again after ${resetTime}.`
            }
        }
        
        // Validate form data
        const validatedData = contactSchema.parse(formData)
        
        // Log the submission for monitoring
        console.log('Contact form submission:', {
            name: validatedData.name,
            email: validatedData.email,
            subject: validatedData.subject,
            ip: clientIP,
            remainingAttempts: rateLimit.remainingAttempts,
            timestamp: new Date().toISOString(),
        })

        // Generate email templates using centralized system
        const supportEmailHtml = getContactFormEmailTemplate(validatedData)
        const userEmailHtml = getContactConfirmationEmailTemplate(validatedData)

        // Send notification email to support
        await sendEmail(
            'support@treasurehub.club',
            `Contact Form: ${validatedData.subject}`,
            supportEmailHtml,
            validatedData.email
        )

        // Try to send confirmation email to user, but don't fail if it doesn't work
        try {
            await sendEmail(
                validatedData.email,
                'Message Received - TreasureHub',
                userEmailHtml
            )
        } catch (userEmailError) {
            console.warn('Failed to send confirmation email to user:', userEmailError)
            // Don't fail the entire operation if user email fails
        }

        // Save to database for tracking
        try {
            await prisma.contact.create({
                data: {
                    name: validatedData.name,
                    email: validatedData.email,
                    subject: validatedData.subject,
                    message: validatedData.message,
                    ipAddress: clientIP,
                },
            })
        } catch (dbError) {
            console.warn('Failed to save contact form to database:', dbError)
            // Don't fail the entire operation if database save fails
        }

        // Revalidate the contact page to show success state
        revalidatePath('/contact')

        return {
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
        }
        
    } catch (error) {
        console.error('Contact form submission error:', error)
        
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0]
            return {
                success: false,
                message: firstError?.message || 'Invalid form data'
            }
        }
        
        return {
            success: false,
            message: 'Something went wrong. Please try again later.'
        }
    }
} 