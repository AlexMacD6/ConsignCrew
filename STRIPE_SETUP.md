# Stripe Integration Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/

# Test keys (for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production keys (for production)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Platform account ID (for future Stripe Connect integration)
STRIPE_PLATFORM_ACCOUNT_ID=acct_...
```

## Stripe Dashboard Configuration

### 1. Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Use test keys for development, live keys for production

### 2. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test the Integration

1. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`

## Database Migration

Run the database migration to create the Order table:

```bash
npx prisma migrate dev --name add_orders_table
```

## Testing the Flow

1. **Create a listing** in your app
2. **Click "Buy It Now"** on a listing page
3. **Complete checkout** with test card
4. **Verify webhook** receives events
5. **Check database** for order creation
6. **Verify listing status** changes to "SOLD"

## Future Enhancements

### Stripe Connect Integration

The code includes hooks for future Stripe Connect implementation:

- Seller onboarding with Connect accounts
- Automatic payouts to sellers
- Platform fee handling
- Multi-party payment flows

### Order Management

- Admin dashboard for order status updates
- Automated delivery confirmation
- Return and refund handling
- Dispute management

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint URL matches exactly

2. **Checkout session creation fails**
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check listing exists and is available

3. **Orders not created**
   - Check webhook endpoint is accessible
   - Verify webhook events are configured
   - Check database connection

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=stripe:*
```

## Security Notes

- Never expose `STRIPE_SECRET_KEY` in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper authentication for order updates
- Validate all input data before processing

