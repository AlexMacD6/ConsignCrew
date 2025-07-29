/**
 * Server-only SES utility to avoid client-side bundling issues
 * This file should only be imported in server-side code (API routes, server actions)
 */

// Create SES client with explicit credentials and no default providers
const createSESClient = async () => {
    const { SESClient } = await import('@aws-sdk/client-ses')
    return new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        // Completely disable the default credential provider chain
        credentialDefaultProvider: () => () => Promise.resolve({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }),
        // Disable retries to prevent credential provider chain loading
        maxAttempts: 1,
    })
}

/**
 * Send an email using AWS SES
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content of the email body
 * @param replyTo - Optional reply-to address
 * @returns Promise with the SES send result
 */
export async function sendEmail(
    to: string, 
    subject: string, 
    html: string, 
    replyTo?: string
) {
    // Validate required environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials not configured')
    }

    const fromEmail = process.env.AWS_SES_DEFAULT_FROM_EMAIL || 'noreply@treasurehub.club'
    
    // Use the provided HTML directly since our email templates already include branding
    const emailHtml = html

    try {
        console.log(`Sending email to ${to} with subject: ${subject}`)
        
        // Dynamically import AWS SDK components
        const { SendEmailCommand } = await import('@aws-sdk/client-ses')
        const ses = await createSESClient() // Use the async client factory
        
        const command = new SendEmailCommand({
            Source: fromEmail,
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: emailHtml,
                        Charset: 'UTF-8',
                    },
                },
            },
            ...(replyTo && {
                ReplyToAddresses: [replyTo],
            }),
        })
        
        const result = await ses.send(command)
        console.log('Email sent successfully:', result)
        return result
    } catch (error) {
        console.error('Failed to send email:', error)
        // Detailed error logging
        if (error instanceof Error) {
            console.error('Error name:', error.name)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Send a contact form notification email
 * @param formData - The contact form data
 * @returns Promise with the email send result
 */
export async function sendContactFormEmail(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
}) {
    const { name, email, subject, message } = formData
    
    const emailSubject = `Contact Form: ${subject}`
    
    const htmlContent = `
        <h2 style="color: #1f2937;">New Contact Form Submission</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
            Sent from TreasureHub Contact Form<br>
            Timestamp: ${new Date().toLocaleString()}
        </p>
    `
    
    const toEmail = process.env.CONTACT_FORM_EMAIL || 'support@treasurehub.club'
    
    return await sendEmail(toEmail, emailSubject, htmlContent, email)
} 