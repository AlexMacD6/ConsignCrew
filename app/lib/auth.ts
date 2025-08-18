import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
