import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { stripeClient } from '@better-auth/stripe/client'
import { organizationClient } from 'better-auth/client/plugins'

// export const { signIn, signOut, useSession } = createAuthClient({
export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
	plugins: [
		organizationClient(),
		stripeClient({
			subscription: true, // Enable subscription management
		}),
		inferAdditionalFields({
			user: {
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
					input: false, // Ensures field cannot be set client-side
				},
				verified: {
					type: 'boolean',
					required: false,
					defaultValue: false,
					input: false, // Ensures field cannot be set client-side
				},
				policiesAcceptedAt: {
					type: 'date',
					required: false,
					input: false,
				},
				role: {
					type: 'string',
					required: true,
					options: ['OPERATOR', 'PROVIDER', 'PROVIDER_ADMIN', 'SUPERADMIN'],
					input: false, // Ensures field cannot be set client-side
				},
				operatorId: {
					type: 'string',
					required: false,
					input: false, // Ensures field cannot be set client-side
				},
				providerId: {
					type: 'string',
					required: false,
					input: false, // Ensures field cannot be set client-side
				},
				providerAdminRequest: {
					type: 'string',
					required: false,
					defaultValue: null,
					options: [null, 'PENDING', 'GRANTED', 'DENIED'],
					input: false, // Ensures field cannot be set client-side
				},
				// TODO: Add remaining fields
			},
		}),
	],
})
