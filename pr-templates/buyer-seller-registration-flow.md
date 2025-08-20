# Buyer/Seller Registration Flow with Stripe Integration

## Changelog

- Enhanced registration flow with buyer/seller selection
  - Created buyer/seller selection interface similar to RigConcierge design
  - Added two-step registration process: account type selection → registration form
  - Implemented responsive design with proper mobile/desktop layouts
  - Added visual indicators and icons for better user experience

- Implemented Stripe customer creation for buyers
  - Added `stripeCustomerId` field to user model for storing Stripe customer IDs
  - Added `userType` field to user model to track buyer/seller status
  - Integrated Stripe customer creation during buyer registration
  - Added error handling for failed Stripe customer creation (non-blocking)
  - Created `createStripeCustomer` utility function in stripe.ts

- Added seller "coming soon" modal
  - Displays when users select seller option during registration
  - Includes call-to-action to redirect to seller landing page
  - Provides clear messaging about selling features being in development
  - Allows users to go back to registration or learn about selling benefits

- Updated registration API
  - Modified `RegistrationData` type to include optional `userType` field
  - Enhanced `registerUser` server action to handle user type selection
  - Added logic to create Stripe customer for buyers automatically
  - Implemented proper error handling and logging for debugging
  - Updated user record with both user type and Stripe customer ID

- Database schema changes
  - Added `userType` field to user model (nullable string)
  - Added `stripeCustomerId` field to user model (nullable string)
  - Created database migration: `add_user_type_and_stripe_customer_id`
  - Regenerated Prisma client to include new field types

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure dependencies are up to date.
3. Run `npx prisma migrate dev` to apply database changes.
4. Start the application with `npm run dev`.
5. Navigate to `/register` in the browser.
6. Test the new registration flow:

### Buyer Registration Flow
1. Click "I want to buy" on the selection screen
2. Complete the registration form with valid details
3. Verify registration succeeds and Stripe customer is created
4. Check database to confirm `userType` is set to "buyer" and `stripeCustomerId` is populated

### Seller Registration Flow
1. Click "I want to sell" on the selection screen
2. Verify the "coming soon" modal appears
3. Test both modal options:
   - "Learn About Selling Benefits" → should redirect to `/seller-landing`
   - "Back to Registration" → should close modal and return to selection

### OAuth Registration (if configured)
1. Select buyer account type
2. Test OAuth registration with Google/Facebook/TikTok
3. Verify user type is properly stored for OAuth users

### Error Handling
1. Test with invalid form data to ensure proper error messages
2. Test with duplicate email addresses
3. Verify graceful handling of Stripe API errors (if Stripe is misconfigured)

### Navigation
1. Test "Back to selection" button from registration form
2. Verify login links work correctly from both screens
3. Test responsive design on mobile and desktop browsers
