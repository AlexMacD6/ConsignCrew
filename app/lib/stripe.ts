import Stripe from 'stripe';
import { getDisplayPrice } from './price-calculator';

/**
 * Stripe configuration for TreasureHub
 * 
 * For now, all payments go to the platform Stripe account.
 * Future: Will add Stripe Connect for seller payouts
 */

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Platform account ID (for future Connect integration)
export const PLATFORM_ACCOUNT_ID = process.env.STRIPE_PLATFORM_ACCOUNT_ID;

// Stripe Connect configuration (for future use)
export const STRIPE_CONNECT_CONFIG = {
  // Future: Platform fee percentage
  platformFeePercent: 0.10, // 10% platform fee
  
  // Future: Minimum transfer amount
  minTransferAmount: 100, // $1.00 minimum
  
  // Future: Transfer schedule
  transferSchedule: 'manual', // or 'automatic'
};

/**
 * Create a Stripe Checkout Session for a listing purchase
 * 
 * @param listing - The listing being purchased
 * @param buyerId - The buyer's user ID
 * @param successUrl - URL to redirect to on successful payment
 * @param cancelUrl - URL to redirect to on cancelled payment
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(
  listing: any,
  buyerId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: listing.description,
              images: listing.photos?.hero ? [listing.photos.hero] : [],
              metadata: {
                listingId: listing.itemId,
                sellerId: listing.userId,
              },
            },
            unit_amount: Math.round(getDisplayPrice(listing).price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: listing.itemId,
        buyerId,
        sellerId: listing.userId,
        sku: listing.itemId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Future: Add application_fee_amount for platform fees
      // application_fee_amount: Math.round(listing.price * STRIPE_CONNECT_CONFIG.platformFeePercent * 100),
    });

    return session;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

/**
 * Future: Create a Stripe Connect account for a seller
 * This will be used when implementing seller payouts
 */
export async function createSellerConnectAccount(sellerId: string, email: string) {
  // TODO: Implement when adding Stripe Connect
  throw new Error('Stripe Connect not yet implemented');
}

/**
 * Create a Stripe customer for a buyer
 * 
 * @param email - The buyer's email address
 * @param name - The buyer's full name
 * @param mobilePhone - Optional mobile phone number
 * @returns Stripe Customer object
 */
export async function createStripeCustomer(
  email: string,
  name: string,
  mobilePhone?: string
) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone: mobilePhone,
      metadata: {
        source: 'treasurehub_registration'
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Future: Transfer funds to seller after order finalization
 * This will be used when implementing seller payouts
 */
export async function transferToSeller(orderId: string, amount: number) {
  // TODO: Implement when adding Stripe Connect
  throw new Error('Stripe Connect not yet implemented');
}
