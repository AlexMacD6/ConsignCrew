import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { nextCookies } from 'better-auth/next-js'
// import { stripePlugin } from '@better-auth/stripe' // Uncomment if using Stripe
// import { sesEmailProvider } from 'better-auth/email/ses' // TODO: Add SES provider if available in your better-auth version

console.log('=== BETTERAUTH CONFIGURATION LOADING ===');
console.log('Environment variables:');
console.log('- BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'Set' : 'Not set');
console.log('- BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || 'http://localhost:3000');
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  
  // Basic configuration
  appName: 'TreasureHub',
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    verificationTokenExpiry: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, url, token }: { user: any; url: string; token: string }, request: any) => {
      try {
        console.log('BetterAuth: sendVerificationEmail called for user');
        console.log('BetterAuth: Verification URL generated');
        
        // Use production domain for email verification links
        const productionUrl = url.replace('http://localhost:3000', 'https://treasurehub.club');
        console.log('BetterAuth: Production verification URL generated');
        
        const { sendEmail } = await import('./ses-server');
        
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
                          Hi ${user.name || 'there'},<br><br>
                          Thanks for creating your TreasureHub account! To complete your registration, 
                          please verify your email address by clicking the button below.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td style="text-align: center;">
                              <a href="${productionUrl}" 
                                 style="background-color: #D4AF3D; color: #ffffff; padding: 15px 30px; 
                                        text-decoration: none; border-radius: 5px; display: inline-block; 
                                        font-weight: bold; font-size: 16px; border: none;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #666; font-size: 14px; margin: 20px 0 0 0; line-height: 1.5;">
                          If the button doesn't work, you can copy and paste this link into your browser:<br>
                          <a href="${productionUrl}" style="color: #D4AF3D; word-break: break-all; text-decoration: underline;">${productionUrl}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">This link will expire in 24 hours for security reasons.</p>
                        <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">If you didn't create a TreasureHub account, you can safely ignore this email.</p>
                        <p style="color: #999; font-size: 12px; margin: 0;">
                          Sent from <a href="https://treasurehub.club" style="color: #D4AF3D; text-decoration: none;">treasurehub.club</a>
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
        
        await sendEmail(user.email, subject, html);
        console.log('✅ Verification email sent successfully');
      } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        // Fallback to console log for development
        console.log('📧 Send verification email with link and token');
        throw error; // Re-throw to let BetterAuth handle the error
      }
    },
    sendResetPassword: async ({ user, url, token }: { user: any; url: string; token: string }, request: any) => {
      try {
        console.log('BetterAuth: sendResetPassword called for user');
        console.log('BetterAuth: Reset URL generated');
        
        // Use production domain for password reset links
        const productionUrl = url.replace('http://localhost:3000', 'https://treasurehub.club');
        console.log('BetterAuth: Production reset URL generated');
        
        const { sendEmail } = await import('./ses-server');
        
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
                Hi ${user.name || 'there'},<br><br>
                We received a request to reset your TreasureHub password. Click the button below 
                to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productionUrl}" 
                   style="background-color: #D4AF3D; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; 
                          font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${productionUrl}" style="color: #D4AF3D; word-break: break-all;">${productionUrl}</a>
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, subject, html);
        console.log('Password reset email sent successfully');
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Fallback to console log for development
        console.log('Send password reset email with link and token');
      }
    },
    provider: null, // Using custom email sending with AWS SES
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
    ...(process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET && {
      tiktok: {
        clientId: process.env.TIKTOK_CLIENT_ID,
        clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      },
    }),
  },
  
  // Session configuration - optimized to reduce database queries
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7, // 7 days (increased from 24 hours)
    strategy: 'database', // Use database strategy for better performance
  },
  
  // CSRF protection
  csrf: {
    trustedOrigins: [
      'http://localhost:3000',
      'https://treasurehub.club', // Add your production domain
    ],
    expiresIn: 60 * 60 * 24, // 24 hours
  },
  
  // User additional fields
  user: {
    additionalFields: {
      name: { type: "string", required: false }, // Make optional to see if that fixes the issue
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
    sendInvitationEmail: async ({ user, url, token }: { user: any; url: string; token: string }, request: any) => {
      try {
        console.log('BetterAuth: sendInvitationEmail called for user');
        console.log('BetterAuth: Invitation URL generated');
        
        // Use production domain for invitation links
        const productionUrl = url.replace('http://localhost:3000', 'https://treasurehub.club');
        console.log('BetterAuth: Production invitation URL generated');
        
        const { sendEmail } = await import('./ses-server');
        
        const subject = 'You\'ve been invited to join TreasureHub';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #D4AF3D; margin: 0;">TreasureHub</h1>
              <p style="color: #666; margin: 10px 0;">Organization Invitation</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">You're Invited!</h2>
              <p style="color: #555; line-height: 1.6;">
                Hi there,<br><br>
                You've been invited to join a TreasureHub organization. Click the button below to accept the invitation.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productionUrl}" 
                   style="background-color: #D4AF3D; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; 
                          font-weight: bold; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${productionUrl}" style="color: #D4AF3D; word-break: break-all;">${productionUrl}</a>
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>This invitation will expire in 48 hours.</p>
            </div>
          </div>
        `;
        
        await sendEmail(user.email, subject, html);
        console.log('Organization invitation email sent successfully');
      } catch (error) {
        console.error('Failed to send organization invitation email:', error);
        // Fallback to console log for development
        console.log('Send organization invitation email with link');
      }
    },
  },
  
  // Admin plugin
  admin: {
    enabled: true,
  },

  // Plugins
  plugins: [
    nextCookies(),
    // stripePlugin({ ... }) // Uncomment and configure if using Stripe
  ],

  // Logger for auditing - increased logging for debugging
  logger: {
    level: "debug", // Set to debug to see all BetterAuth logs
    log: (level, message, ...args) => {
      console.log(`[BetterAuth ${level}] ${message}`, ...args);
    },
  },
  
  // Ensure account.type is set for credentials and add users to default organization
  callbacks: {
    async beforeAccountCreate(account: any, user: any, provider: any) {
      console.log('BetterAuth: beforeAccountCreate called with:', { provider, accountType: account.type });
      if (provider === "credentials" || provider === "emailAndPassword") {
        account.type = "credential";
      }
      return account;
    },

    async beforeUserCreate(user: any, provider: any) {
      console.log('beforeUserCreate called with provider:', provider);
      
      // Ensure we only use the name field and remove any firstName/lastName references
      if (user.firstName || user.lastName) {
        // If BetterAuth is trying to use firstName/lastName, combine them into name
        if (!user.name) {
          user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        // Remove the old fields to prevent database errors
        delete user.firstName;
        delete user.lastName;
      }
      
      // Ensure name is required
      if (!user.name) {
        user.name = 'Unknown User';
      }
      
      console.log('Processed user data - name field set');
      return user;
    },

    async afterUserCreate(user: any) {
      console.log('BetterAuth: afterUserCreate called for user');
      try {
        // Import here to avoid circular dependencies
        const { addUserToDefaultOrganization } = await import('./organization-utils');
        await addUserToDefaultOrganization(user.id, 'MEMBER');
        console.log('Added new user to default organization');
      } catch (error) {
        console.error('Error adding user to default organization:', error);
      }
    }
  },
})

console.log('=== BETTERAUTH CONFIGURATION LOADED ===');
console.log('BetterAuth instance created successfully');