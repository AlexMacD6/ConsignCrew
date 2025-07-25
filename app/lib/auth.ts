import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { nextCookies } from 'better-auth/next-js'
// import { stripePlugin } from '@better-auth/stripe' // Uncomment if using Stripe
// import { sesEmailProvider } from 'better-auth/email/ses' // TODO: Add SES provider if available in your better-auth version

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  
  // Basic configuration
  appName: 'ConsignCrew',
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }: { user: any; url: string; token: string }) => {
      // TODO: Replace with actual email sending logic (e.g., AWS SES)
      console.log(`Send verification email to ${user.email} with link: ${url} and token: ${token}`);
    },
    sendResetPassword: async ({ user, url, token }: { user: any; url: string; token: string }) => {
      // TODO: Replace with actual email sending logic (e.g., AWS SES)
      console.log(`Send password reset email to ${user.email} with link: ${url} and token: ${token}`);
    },
    provider: null, // TODO: Add SES provider if available in your better-auth version
  },
  
  // Social OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  // CSRF protection
  csrf: {
    trustedOrigins: [
      'http://localhost:3000',
      'https://consigncrew.com', // Add your production domain
    ],
    expiresIn: 60 * 60 * 24, // 24 hours
  },
  
  // User additional fields
  user: {
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
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
    teams: true,
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

  // Logger for auditing
  logger: {
    level: "info",
    log: (level, message, ...args) => {
      console.log(`[${level}] ${message}`, ...args);
    },
  },
  
  // Ensure account.type is set for credentials and add users to default organization
  callbacks: {
    async beforeAccountCreate(account: any, user: any, provider: any) {
      if (provider === "credentials" || provider === "emailAndPassword") {
        account.type = "credential";
      }
      return account;
    },
    async afterUserCreate(user: any) {
      try {
        // Import here to avoid circular dependencies
        const { addUserToDefaultOrganization } = await import('./organization-utils');
        await addUserToDefaultOrganization(user.id, 'MEMBER');
        console.log('Added new user to default organization:', user.email);
      } catch (error) {
        console.error('Error adding user to default organization:', error);
      }
    }
  },
}) 