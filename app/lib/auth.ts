import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { admin } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/prisma'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const ses = new SESClient({ region: process.env.AWS_REGION })

async function sendEmail(to: string, subject: string, html: string) {
  await ses.send(new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: html } },
      Subject: { Data: subject },
    },
    Source: process.env.SES_FROM_EMAIL!,
  }))
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    nextCookies(),
    organization({ teams: true }),
    admin(),
  ],
  user: {
    additionalFields: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
      mobilePhone: { type: 'string', required: false },
      preferredContact: { type: 'string', required: true },
      shippingAddress: { type: 'string', required: true },
      alternatePickup: { type: 'string', required: false },
      payoutMethod: { type: 'string', required: true },
      payoutAccount: { type: 'string', required: true },
      profilePhotoUrl: { type: 'string', required: false },
      governmentIdUrl: { type: 'string', required: false },
      role: { type: 'string', required: false, defaultValue: 'USER', options: ['USER', 'ADMIN'] },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    authSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, 'Reset your password', `<p>Click <a href='${url}'>here</a> to reset your password.</p>`)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, 'Verify your email', `<p>Click <a href='${url}'>here</a> to verify your email.</p>`)
    },
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      enabled: true,
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
    tiktok: {
      enabled: true,
      clientId: process.env.TIKTOK_CLIENT_ID!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    },
  },
}) 