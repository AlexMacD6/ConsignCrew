## Changelog

- Added eBay verification token validation for marketplace account deletion endpoint
  - Created `validateEbayVerificationToken()` function in `app/lib/ebay-utils.ts`
    - Validates token length (32-80 characters)
    - Checks for valid alphanumeric characters and common symbols
    - Returns boolean indicating token validity
  - Updated marketplace account deletion endpoint in `app/api/ebay/marketplace-account-deletion/route.ts`
    - Added verification token header extraction (`x-ebay-verification-token`)
    - Implemented token validation before processing webhook
    - Added appropriate error responses for invalid tokens
  - Enhanced security by validating tokens before signature verification
  - Added comprehensive error logging for validation failures

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Test the eBay marketplace account deletion endpoint:

### Test Valid Verification Tokens
- Send POST request to `/api/ebay/marketplace-account-deletion` with:
  - Valid token (32-80 characters, alphanumeric + symbols)
  - Required eBay headers (`x-ebay-signature`, `x-ebay-timestamp`)
  - Should process successfully

### Test Invalid Verification Tokens
- Test with tokens that are:
  - Too short (< 32 characters): Should return 401 error
  - Too long (> 80 characters): Should return 401 error
  - Invalid characters (spaces, special chars): Should return 401 error
  - Empty or null: Should return 401 error

### Test Missing Verification Token
- Send request without `x-ebay-verification-token` header
- Should still work (token is optional but validated when present)

### Verify Error Responses
- Check that invalid tokens return proper 401 Unauthorized responses
- Verify error messages are clear and helpful
- Confirm validation errors are logged for debugging

5. Test the health check endpoint: `GET /api/ebay/marketplace-account-deletion`
   - Should return healthy status and endpoint information 