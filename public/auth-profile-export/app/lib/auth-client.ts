import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { adminClient } from 'better-auth/client/plugins'
// import { stripeClient } from '@better-auth/stripe/client' // Uncomment if using Stripe

// (Optional) Add user type augmentation here for better DX

// Dynamic base URL for client-side auth
function getClientBaseURL(): string {
  // In browser, always use current origin to support both domains
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side fallback
  return process.env.BETTER_AUTH_URL || 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  plugins: [
    organizationClient({ 
      teams: { 
        enabled: true 
      } 
    }),
    adminClient(),
    // stripeClient() // Uncomment and configure if using Stripe
  ],
}) 