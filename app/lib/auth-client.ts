import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { adminClient } from 'better-auth/client/plugins'
// import { stripeClient } from '@better-auth/stripe/client' // Uncomment if using Stripe

// (Optional) Add user type augmentation here for better DX

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  plugins: [
    organizationClient({ teams: { enabled: true } }),
    adminClient(),
    // stripeClient() // Uncomment and configure if using Stripe
  ],
}) 