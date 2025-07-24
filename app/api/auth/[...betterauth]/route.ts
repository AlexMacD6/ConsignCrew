import { betterAuthHandler } from 'better-auth/next';

// This catch-all route handles all Better Auth authentication endpoints (sign in, sign up, callback, etc.)
export { betterAuthHandler as GET, betterAuthHandler as POST }; 