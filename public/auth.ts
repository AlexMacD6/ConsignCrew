import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { stripe } from '@better-auth/stripe'
import Stripe from 'stripe'
import { organization } from 'better-auth/plugins'

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/ses'
import { getBetterAuthPlans } from '@/lib/subscription-plans'

// Create a Stripe client
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-05-28.basil',
})

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),

	// Add session configuration to prevent rapid requests
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 24 hours - only update session once per day
	},

	// Add CSRF configuration to fix token mismatch issues
	csrf: {
		// Allow localhost for development
		trustedOrigins: [
			'http://localhost:3000',
			'http://127.0.0.1:3000',
			'http://localhost:49880',
			'http://127.0.0.1:49880',
			// Add your production domain here
			'https://rigconcierge.com',
			'https://www.rigconcierge.com',
		],
		// Increase token expiration to reduce conflicts
		expiresIn: 60 * 60 * 24, // 24 hours
	},

	plugins: [
		nextCookies(),
		organization({
			schema: {
				organization: {
					modelName: 'Provider', // Map the organization table to the existing Provider table
					fields: {
						id: 'id',
						name: 'name',
						slug: 'slug',
					},
				},
			},
		}),
		stripe({
			stripeClient,
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			createCustomerOnSignUp: false, // Disable because the subscription will belong to the provider organization

			subscription: {
				enabled: true,
				plans: getBetterAuthPlans(),
				// This ensures only Provider users can manage subscriptions for their organization
				// TODO: Note that this does not currently leverage the organizations plugin
				authorizeReference: async ({ user, referenceId, action }): Promise<boolean> => {
					console.log('🔒 [STRIPE AUTH] Authorization check:', {
						userId: user?.id,
						userEmail: user?.email,
						referenceId,
						action,
						userProviderId: user?.providerId,
						hasUser: !!user,
					})

					// Handle webhook scenarios where user context might not be available
					// During webhook processing, better-auth may not have user context
					if (!user) {
						console.log('🔒 [STRIPE AUTH] Webhook/system context detected, checking provider existence')
						if (referenceId) {
							const provider = await prisma.provider.findUnique({
								where: { id: referenceId },
							})
							console.log('🔒 [STRIPE AUTH] Provider lookup result:', {
								referenceId,
								providerFound: !!provider,
								providerName: provider?.name,
								stripeCustomerId: provider?.stripeCustomerId,
							})
							const authorized = !!provider
							console.log('🔒 [STRIPE AUTH] Webhook authorization result:', authorized)
							return authorized
						}
						return false
					}

					// Handle user-initiated actions (frontend)
					if (user) {
						let authorized = false

						// For organization billing, only allow provider-based subscriptions
						if (referenceId && referenceId !== user.id) {
							// Verify the referenceId is a valid provider
							const provider = await prisma.provider.findUnique({
								where: { id: referenceId },
							})

							// Check if user is associated with this provider AND has the right role
							if (provider && user.providerId === referenceId) {
								// Only PROVIDER and PROVIDER_ADMIN roles can manage subscriptions
								if (['PROVIDER', 'PROVIDER_ADMIN'].includes(user.role || '')) {
									authorized = true
								}
							}
						}

						console.log('🔒 [STRIPE AUTH] User authorization result:', {
							authorized,
							userRole: user.role,
							userProviderId: user.providerId,
							requestedReferenceId: referenceId,
						})
						return authorized
					}

					console.log('🔒 [STRIPE AUTH] Authorization failed - no user context and not webhook')
					return false
				},

				// Add comprehensive subscription event handling with logging
				onSubscriptionComplete: async ({ subscription, user }: any) => {
					console.log('✅ [STRIPE] Subscription onSubscriptionComplete called:', {
						subscriptionId: subscription.id,
						plan: subscription.plan,
						referenceId: subscription.referenceId,
						stripeCustomerId: subscription.stripeCustomerId,
						stripeSubscriptionId: subscription.stripeSubscriptionId,
						status: subscription.status,
						userId: user?.id,
						userEmail: user?.email,
					})
				},

				onSubscriptionUpdate: async ({ subscription, user }: any) => {
					console.log('🔄 [STRIPE] Subscription onSubscriptionUpdate called:', {
						subscriptionId: subscription.id,
						plan: subscription.plan,
						referenceId: subscription.referenceId,
						stripeCustomerId: subscription.stripeCustomerId,
						stripeSubscriptionId: subscription.stripeSubscriptionId,
						status: subscription.status,
						userId: user?.id,
						userEmail: user?.email,
					})
				},

				onSubscriptionCancel: async ({ subscription, user }: any) => {
					console.log('❌ [STRIPE] Subscription onSubscriptionCancel called:', {
						subscriptionId: subscription.id,
						plan: subscription.plan,
						referenceId: subscription.referenceId,
						userId: user?.id,
						userEmail: user?.email,
					})
				},
			},

			// Add global webhook event logging
			webhook: {
				onEvent: async (event: Stripe.Event) => {
					console.log('🪝 [STRIPE WEBHOOK] Event received:', {
						type: event.type,
						id: event.id,
						created: new Date(event.created * 1000).toISOString(),
						livemode: event.livemode,
						object: event.data.object.object,
						// Log specific data based on event type
						...(event.type.includes('subscription') && {
							subscriptionData: {
								id: (event.data.object as any).id,
								status: (event.data.object as any).status,
								customer: (event.data.object as any).customer,
								items: (event.data.object as any).items?.data?.map((item: any) => ({
									price: item.price?.id,
									product: item.price?.product,
								})),
							},
						}),
						...(event.type.includes('checkout') && {
							checkoutData: {
								id: (event.data.object as any).id,
								status: (event.data.object as any).status,
								customer: (event.data.object as any).customer,
								client_reference_id: (event.data.object as any).client_reference_id,
								subscription: (event.data.object as any).subscription,
							},
						}),
					})
				},
			},
		}),
	],

	user: {
		additionalFields: {
			firstName: {
				type: 'string',
				required: false,
			},
			lastName: {
				type: 'string',
				required: false,
			},
			phone: {
				type: 'string',
				required: false,
			},
			title: {
				type: 'string',
				required: false,
			},
			dateOfBirth: {
				type: 'date',
				required: false,
			},
			yearsOfExperience: {
				type: 'number',
				required: false,
			},
			/**
			 * Operator Domain ID (was areasOfExpertise)
			 * References OperatorDomain model
			 */
			operatorDomainId: {
				type: 'string',
				required: false,
			},
			verified: {
				type: 'boolean',
				required: false,
				defaultValue: false,
			},
			operatorId: {
				type: 'string',
				required: false,
			},
			providerId: {
				type: 'string',
				required: false,
			},
			providerAdminRequest: {
				type: 'string',
				required: false,
				defaultValue: null,
				options: [null, 'PENDING', 'GRANTED', 'DENIED'],
			},
			role: {
				type: 'string',
				required: false,
				defaultValue: 'OPERATOR',
				options: ['OPERATOR', 'PROVIDER', 'SUPERADMIN'],
			},
			policiesAcceptedAt: {
				type: 'date',
				required: false,
			},
		},
	},

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		authSignIn: true,

		sendResetPassword: async ({ user, url, token }, request) => {
			// Debugging
			console.log('Sending reset password email to', user.email)
			console.log('Reset password URL', url)
			console.log('Reset password token', token)
			console.log('Request', request)

			// TODO: Check operator domain is valid

			await sendEmail(user.email, 'Reset Password', `Click the link below to reset your password: ${url}`)
		},
	},

	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }, request) => {
			// Debugging
			console.log('Sending verification email to', user.email)
			console.log('Verification URL', url)
			console.log('Verification token', token)
			console.log('Request', request)

			// TODO: Check operator domain is valid

			await sendEmail(
				user.email,
				'Welcome to RigConcierge - Please Verify Your Email',
				`
					<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Welcome to RigConcierge!</h1>
					
					<p style="font-size: 16px; color: #555; margin-bottom: 20px;">
						To complete your registration and access all features, please verify your email address by clicking the link below:
					</p>

					<a href="${url}" style="display: inline-block; background-color: #FFCC00; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-bottom: 20px;">
						Verify Email Address
					</a>

					<p style="font-size: 14px; color: #666; margin-bottom: 20px;">
						If you did not create an account with RigConcierge, you can safely ignore this email.
					</p>

					<p style="font-size: 16px; color: #555;">
						Best regards,<br>
						The RigConcierge Team
					</p>
				`,
			)
		},
	},
})
