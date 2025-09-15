import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/ses-server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'User is already verified' }, { status: 400 });
    }
    
    // Create a verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });
    
    // Create new verification token
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: expires
      }
    });
    
    // Send verification email using dynamic domain detection
    function getVerificationBaseUrl(): string {
      if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
      if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
      
      // Check Vercel environment
      const host = process.env.VERCEL_URL || process.env.HOST;
      if (host) return `https://${host}`;
      
      // Support both production domains
      return 'https://www.treasurehubclub.com';
    }
    
    const verificationUrl = `${getVerificationBaseUrl()}/api/auth/verify?token=${token}`;
    const subject = 'Verify your TreasureHub account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF3D; margin: 0;">TreasureHub</h1>
          <p style="color: #666; margin: 10px 0;">Verify your email address</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Welcome to TreasureHub!</h2>
          <p style="color: #555; line-height: 1.6;">
            Hi ${user.name || 'there'},<br><br>
            Thanks for creating your TreasureHub account! To complete your registration, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #D4AF3D; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; 
                      font-weight: bold; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #D4AF3D; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create a TreasureHub account, you can safely ignore this email.</p>
        </div>
      </div>
    `;
    
    await sendEmail(user.email, subject, html);
    
    console.log('Manual verification email sent successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully',
      token: verificationToken.token // For debugging purposes
    });
    
  } catch (error) {
    console.error('Error sending manual verification email:', error);
    return NextResponse.json({ 
      error: 'Failed to send verification email' 
    }, { status: 500 });
  }
} 