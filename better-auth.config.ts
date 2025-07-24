export default {
  // App configuration
  appName: "ConsignCrew",
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "your-secret-key-here",

  // Use in-memory SQLite for dev/testing
  database: {
    provider: 'sqlite',
    url: 'file::memory:?cache=shared',
  },

  // Enable email/password authentication
  emailPassword: {
    enabled: true,
    // Optionally configure email sending for password resets, etc.
  },

  // Enable OAuth providers
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optionally specify scopes, etc.
    },
    facebook: {
      enabled: true,
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // Optionally specify scopes, etc.
    },
    tiktok: {
      enabled: true,
      clientId: process.env.TIKTOK_CLIENT_ID!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
      // Optionally specify scopes, etc.
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },

  // Add any additional configuration here (rate limiting, plugins, etc.)
}; 