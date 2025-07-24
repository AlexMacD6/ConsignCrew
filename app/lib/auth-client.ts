import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  plugins: [
    organizationClient({ teams: true }),
    adminClient(),
  ],
}) 