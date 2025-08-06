# eBay Platform Notifications Setup Guide

## Overview

This guide walks you through setting up eBay Platform Notifications to receive real-time webhooks from eBay's Browse API. This integration allows TreasureHub to monitor item updates, price changes, and availability status for market research and competitive pricing.

## Prerequisites

1. **eBay Developer Account**: You need an eBay Developer account with API access
2. **Production Domain**: Your webhook endpoint must be publicly accessible (HTTPS required)
3. **Environment Variables**: eBay credentials must be configured

## Step 1: eBay Developer Setup

### 1.1 Create eBay Developer Application

1. Go to [eBay Developer Portal](https://developer.ebay.com/)
2. Sign in with your eBay account
3. Navigate to "My Account" → "Application Keys"
4. Click "Create a New Application"
5. Fill in the application details:
   - **Application Name**: `TreasureHub Notifications`
   - **Application Type**: `Web Application`
   - **Description**: `Platform notifications for market research`
6. Save the application

### 1.2 Configure Application Settings

1. In your application settings, note down:
   - **App ID (Client ID)**
   - **Cert ID (Client Secret)**
   - **Client Secret**

2. Configure OAuth scopes:
   - `https://api.ebay.com/oauth/api_scope`
   - `https://api.ebay.com/oauth/api_scope/commerce.notification.readonly`

3. Set redirect URIs (if needed for OAuth):
   - `https://treasurehub.club/api/auth/ebay/callback`

## Step 2: Environment Configuration

### 2.1 Add Environment Variables

Add the following variables to your `.env` file and Vercel environment:

```bash
# eBay Platform Notifications Configuration
EBAY_APP_ID=your_ebay_app_id_here
EBAY_CERT_ID=your_ebay_certificate_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here
EBAY_NOTIFICATION_ENDPOINT_URL=https://treasurehub.club/api/ebay/notifications
EBAY_SANDBOX_MODE=true
```

### 2.2 Update Production Settings

For production deployment:
1. Set `EBAY_SANDBOX_MODE=false`
2. Ensure `EBAY_NOTIFICATION_ENDPOINT_URL` points to your production domain
3. Configure all environment variables in Vercel dashboard

## Step 3: Database Migration

### 3.1 Run Prisma Migration

The eBay notification models have been added to the schema. Run the migration:

```bash
npx prisma migrate dev --name add_ebay_notifications
```

### 3.2 Verify Migration

Check that the following tables were created:
- `EbayNotification` - Stores received notifications
- `EbayItem` - Tracks items we're monitoring
- `EbayNotificationLog` - Audit trail for debugging

## Step 4: Webhook Endpoint Setup

### 4.1 Verify Endpoint Accessibility

Your webhook endpoints are available at:

**Main Notifications Endpoint:**
- **Development**: `http://localhost:3000/api/ebay/notifications`
- **Production**: `https://treasurehub.club/api/ebay/notifications`

**Marketplace Account Deletion Endpoint (GDPR Compliance):**
- **Development**: `http://localhost:3000/api/ebay/marketplace-account-deletion`
- **Production**: `https://treasurehub.club/api/ebay/marketplace-account-deletion`

### 4.2 Test Endpoint Health

Test the main notifications endpoint health check:
```bash
curl https://treasurehub.club/api/ebay/notifications
```

Expected response:
```json
{
  "status": "healthy",
  "message": "eBay notifications endpoint is operational",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Test the marketplace account deletion endpoint health check:
```bash
curl https://treasurehub.club/api/ebay/marketplace-account-deletion
```

Expected response:
```json
{
  "status": "healthy",
  "message": "eBay marketplace account deletion endpoint is operational",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoint": "marketplace-account-deletion"
}
```

## Step 5: eBay Notification Subscription

### 5.1 Subscribe to Notifications

Use the admin API to subscribe to notification topics:

```bash
curl -X POST https://treasurehub.club/api/admin/ebay/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "action": "subscribe",
    "topics": ["ITEM_UPDATED", "PRICE_CHANGED", "ITEM_SOLD", "ITEM_ENDED"],
    "webhookUrl": "https://treasurehub.club/api/ebay/notifications"
  }'
```

### 5.2 Available Notification Topics

**Item-Related Topics:**
- `ITEM_UPDATED` - Item details, price, or availability changed
- `ITEM_SOLD` - Item was sold
- `ITEM_ENDED` - Item listing ended
- `PRICE_CHANGED` - Item price was modified
- `QUANTITY_CHANGED` - Available quantity changed

**Account-Related Topics (GDPR Compliance):**
- `MARKETPLACE_ACCOUNT_DELETION` - Marketplace account was deleted (requires separate endpoint)

## Step 6: GDPR Compliance and Account Deletion

### 6.1 Marketplace Account Deletion Notifications

eBay requires a separate endpoint for handling marketplace account deletion notifications to comply with GDPR and other privacy regulations. This endpoint:

- Receives notifications when users delete their eBay marketplace accounts
- Processes different account types (SELLER, BUYER, BOTH)
- Updates related data to maintain compliance
- Logs all deletion activities for audit purposes

### 6.2 Account Deletion Processing

The system handles three types of account deletions:

1. **SELLER Account Deletion**: Updates seller-related data and marks items as inactive
2. **BUYER Account Deletion**: Removes buyer preferences and updates purchase history
3. **BOTH Account Deletion**: Handles both buyer and seller account deletions

### 6.3 Data Retention and Compliance

- All account deletion notifications are logged for audit compliance
- Related items are updated to reflect account deletion status
- Data is processed according to GDPR requirements
- Audit trails are maintained for regulatory compliance

## Step 7: Testing the Integration

### 7.1 Sandbox Testing

1. Set `EBAY_SANDBOX_MODE=true` in your environment
2. Use eBay's sandbox environment for testing
3. Monitor the admin dashboard for received notifications

### 7.2 Production Deployment

1. Set `EBAY_SANDBOX_MODE=false`
2. Deploy to production
3. Subscribe to notifications using production eBay API
4. Monitor webhook delivery and processing

## Step 8: Monitoring and Management

### 8.1 Admin Dashboard

Access the eBay notifications admin panel:
- **URL**: `/admin/ebay/notifications`
- **Features**:
  - View notification history
  - Monitor processing status
  - View eBay item tracking
  - Access audit logs

### 8.2 API Endpoints

#### View Notifications
```bash
GET /api/admin/ebay/notifications?page=1&limit=20&topic=ITEM_UPDATED
```

#### Subscribe to Topics
```bash
POST /api/admin/ebay/notifications
{
  "action": "subscribe",
  "topics": ["ITEM_UPDATED", "PRICE_CHANGED"],
  "webhookUrl": "https://treasurehub.club/api/ebay/notifications"
}
```

#### Get Subscriptions
```bash
POST /api/admin/ebay/notifications
{
  "action": "get_subscriptions"
}
```

## Step 9: Integration with AI Service

### 9.1 Market Research

The eBay notifications integrate with the AI service to provide market data:

1. **AI Service Phase 1** generates `ebayQuery` for items
2. **Browse API** searches for similar items
3. **Notifications** track price changes and availability
4. **Market Analysis** helps with pricing decisions

### 9.2 Price Monitoring

When price changes are detected:
1. Notification is received and stored
2. Price history is updated
3. Alerts can be triggered for significant changes
4. Market data is available for AI pricing recommendations

## Step 10: Troubleshooting

### Common Issues

1. **Webhook Not Receiving Notifications**
   - Verify endpoint is publicly accessible
   - Check eBay subscription status
   - Review webhook signature verification

2. **Authentication Errors**
   - Verify eBay credentials are correct
   - Check OAuth token generation
   - Ensure proper scopes are configured

3. **Database Errors**
   - Run Prisma migrations
   - Check database connection
   - Verify schema changes

### Debug Tools

1. **Notification Logs**: Check `/api/admin/ebay/notifications?level=error`
2. **Health Check**: Test endpoint accessibility
3. **Subscription Status**: Verify active subscriptions

### Support Resources

- [eBay Developer Documentation](https://developer.ebay.com/api-docs/commerce/notification/overview.html)
- [eBay Browse API Guide](https://developer.ebay.com/api-docs/buy/browse/overview.html)
- [Webhook Best Practices](https://developer.ebay.com/api-docs/commerce/notification/guides/webhook-best-practices)

## Security Considerations

1. **Webhook Signature Verification**: Implement proper signature validation
2. **Rate Limiting**: Protect against webhook spam
3. **IP Whitelisting**: Consider restricting to eBay's IP ranges
4. **Data Encryption**: Ensure sensitive data is encrypted at rest

## Next Steps

1. **Implement Signature Verification**: Complete the TODO in `ebay-utils.ts`
2. **Add Price Alerts**: Create notifications for significant price changes
3. **Market Analysis Dashboard**: Build UI for viewing market data
4. **Automated Pricing**: Use market data to suggest optimal pricing

## Success Criteria

- [ ] Webhook endpoint receives notifications successfully
- [ ] Notifications are stored and processed correctly
- [ ] Admin dashboard displays notification data
- [ ] eBay item tracking works properly
- [ ] Integration with AI service provides market insights
- [ ] Price changes trigger appropriate alerts
- [ ] System maintains data integrity under load 