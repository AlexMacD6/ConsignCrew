# Data Migration Guide

This directory contains exported data from the production database that can be imported into the new branch with inventory models.

## Files Exported

- **user.json** - User accounts and profiles
- **Organization.json** - Organization data
- **Member.json** - Organization memberships
- **Invitation.json** - Organization invitations
- **Team.json** - Team data
- **TeamMember.json** - Team memberships
- **session.json** - User sessions
- **account.json** - Authentication accounts
- **AiResponse.json** - AI response data
- **EarlyAccessSignup.json** - Early access signups
- **Question.json** - Questions data
- **Listing.json** - Product listings
- **ListingHistory.json** - Listing history
- **PriceHistory.json** - Price history
- **Contact.json** - Contact form submissions
- **TreasureRedemption.json** - Treasure redemption data
- **TreasureDrop.json** - Treasure drop data
- **Video.json** - Video uploads
- **EbayNotification.json** - eBay notifications
- **EbayItem.json** - eBay items
- **EbayNotificationLog.json** - eBay notification logs
- **verification.json** - Verification data
- **verificationToken.json** - Verification tokens

## Migration Process

### Step 1: Export from Production (Completed)
```bash
# On production branch with old database
node scripts/export-data.js
node scripts/export-listings.js
```

### Step 2: Switch to New Branch
```bash
git checkout new-branch-with-inventory
```

### Step 3: Import to New Database
```bash
# On new branch with fresh database
node scripts/import-data.js
```

## Notes

- The import script handles foreign key constraints by importing in the correct order
- Existing data in the new database will be cleared before import
- The new database includes additional inventory models that don't exist in the old data
- Some models may have schema differences - the import script handles these gracefully

## Troubleshooting

If you encounter import errors:
1. Check that the new database schema matches the expected models
2. Verify that all required fields are present in the exported data
3. Check the console output for specific error messages
4. Ensure the Prisma client is generated with the new schema
