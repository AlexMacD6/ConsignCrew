import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '../../../lib/auth';

// Use the official Next.js handler for BetterAuth
export const { GET, POST } = toNextJsHandler(auth.handler); 