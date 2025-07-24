import { defineConfig } from 'better-auth';

export default defineConfig({
  // Use Prisma as the database adapter
  database: {
    provider: 'prisma',
    url: process.env.DATABASE_URL,
  },

  // Enable email/password authentication
  auth: {
    emailPassword: {
      enabled: true,
      // Optionally configure email sending for password resets, etc.
    },
    // Enable Google OAuth
    providers: [
      {
        id: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Optionally specify scopes, etc.
      },
    ],
  },

  // Add any additional configuration here (rate limiting, plugins, etc.)
}); 