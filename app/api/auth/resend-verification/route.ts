import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Clean up any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
      },
    });

    // Generate a new verification token manually
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store the verification token in the database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // Create verification URL
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const productionUrl = baseUrl.replace('http://localhost:3000', 'https://treasurehub.club');
    const verificationUrl = `${productionUrl}/api/auth/[...betterauth]?action=verifyEmail&token=${verificationToken}&identifier=${encodeURIComponent(user.email)}`;

    // Send verification email using SES
    const { sendEmail } = await import('../../../lib/ses-server');
    
    const subject = 'Verify your TreasureHub account';
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Verify your TreasureHub account</title>
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
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7f7f7;">
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #D4AF3D; margin: 0; font-size: 28px; font-weight: bold;">TreasureHub</h1>
                    <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Verify your email address</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Welcome to TreasureHub!</h2>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Hi ${user.name || 'there'},
                    </p>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Thanks for signing up for TreasureHub! To complete your registration, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #D4AF3D;">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
                      If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="color: #D4AF3D; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px; word-break: break-all;">
                      <a href="${verificationUrl}" style="color: #D4AF3D;">${verificationUrl}</a>
                    </p>
                    
                    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
                      This verification link will expire in 24 hours. If you didn't create a TreasureHub account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                    <p style="color: #666; margin: 0; font-size: 12px;">
                      © 2025 TreasureHub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the email
    await sendEmail(user.email, subject, html);

    return NextResponse.json(
      { success: true, message: 'Verification email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
} 