import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dynamic base URL detection to support both domains
function getBaseURL(): string {
  // Priority order: explicit env vars, then dynamic detection, then fallback
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  
  // In browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side: check common production domains
  const host = process.env.VERCEL_URL || process.env.HOST;
  if (host) {
    return `https://${host}`;
  }
  
  // Fallback to primary domain
  return 'https://www.treasurehubclub.com';
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  baseURL: getBaseURL(),
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Add redirect configuration for email verification
    verifyEmailRedirectTo: '/login?verified=success',
    sendVerificationEmail: async ({ user, url, token }: { user: any, url: string, token: string }) => {
      console.log('BetterAuth - Sending verification email to:', user.email);
      console.log('BetterAuth - Verification URL:', url);
      
      try {
        const { sendEmail } = await import('../lib/ses-server');
        
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
                Hi ${user.name || 'there'},
              </p>
              <p style="color: #555; line-height: 1.6;">
                Thank you for signing up for TreasureHub! To complete your registration, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background-color: #D4AF3D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">
                ${url}
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>This email was sent to verify your TreasureHub account.</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, subject, html);
        console.log('BetterAuth - Verification email sent successfully via SES');
        
      } catch (error) {
        console.error('BetterAuth - Error sending verification email:', error);
        throw error;
      }
    },
    sendResetPassword: async ({ user, url, token }: { user: any, url: string, token: string }) => {
      console.log('BetterAuth - Sending password reset email to:', user.email);
      
      try {
        const { sendEmail } = await import('../lib/ses-server');
        
        const subject = 'Reset your TreasureHub password';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #D4AF3D; margin: 0;">TreasureHub</h1>
              <p style="color: #666; margin: 10px 0;">Password Reset Request</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p style="color: #555; line-height: 1.6;">
                Hi ${user.name || 'there'},
              </p>
              <p style="color: #555; line-height: 1.6;">
                We received a request to reset your password for your TreasureHub account. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background-color: #D4AF3D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">
                ${url}
              </p>
              
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>This email was sent from your TreasureHub account.</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, subject, html);
        console.log('BetterAuth - Password reset email sent successfully via SES');
        
      } catch (error) {
        console.error('BetterAuth - Error sending password reset email:', error);
        throw error;
      }
    },
  },
  
  // Social OAuth providers - only enable if credentials are provided
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    }),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET && {
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      },
    }),
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7, // 7 days
  },
  
  // CSRF protection
  csrf: {
    trustedOrigins: [
      'http://localhost:3000',
      'https://treasurehub.club',
    ],
    expiresIn: 60 * 60 * 24, // 24 hours
  },
  
  // User additional fields
  user: {
    additionalFields: {
      name: { type: "string", required: false },
      mobilePhone: { type: "string", required: false },
      preferredContact: { type: "string", required: false },
      shippingAddress: { type: "string", required: false },
      alternatePickup: { type: "string", required: false },
      payoutMethod: { type: "string", required: false },
      payoutAccount: { type: "string", required: false },
      profilePhotoUrl: { type: "string", required: false },
      governmentIdUrl: { type: "string", required: false },
      oauthProvider: { type: "string", required: false },
      oauthProviderId: { type: "string", required: false },
      oauthAccessToken: { type: "string", required: false },
      oauthRefreshToken: { type: "string", required: false },
      oauthExpiresAt: { type: "string", required: false },
      role: { type: "string", required: false, input: false },
    },
  },
  
  // Organization plugin
  organization: {
    teams: {
      enabled: true,
    },
  },
});

export default auth;
