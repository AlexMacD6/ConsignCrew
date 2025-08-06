# Meta Pixel Script Integration

## Changelog

- Added Meta Pixel script integration to main layout
  - Created `MetaPixelScript` component for proper Next.js script loading
  - Added script to `app/layout.tsx` with `afterInteractive` strategy
  - Included noscript fallback for users with JavaScript disabled
  - Added graceful handling when Meta Pixel ID is not configured
- Created client-side Meta Pixel utility with server-side fallback
  - Added `meta-pixel-client.ts` with type-safe event tracking functions
  - Supports common e-commerce events: ViewContent, AddToCart, Purchase, Search, Lead, Contact
  - Automatic server-side fallback when client-side tracking fails
  - Global TypeScript declarations for `window.fbq`
- Implemented Meta Conversion API for server-side tracking
  - Created `meta-conversion-api.ts` client for server-side event mirroring
  - Added `/api/meta/conversion` endpoint for server-side event tracking
  - SHA-256 hashing for privacy compliance (emails, phone numbers)
  - Automatic user data extraction from session and request headers
- Added middleware integration for comprehensive tracking
  - Created `meta-pageview-middleware.ts` for automatic page view tracking
  - Updated `middleware.ts` to include server-side page view tracking
  - Non-blocking implementation with path filtering
  - Dual tracking strategy: client-side primary, server-side fallback
- Updated environment variables
  - Added `NEXT_PUBLIC_META_PIXEL_ID` to `env.example` for client-side access
  - Updated requirements documentation with comprehensive tracking details

---

## Testing Instructions

1. Pull this branch.
2. Add `NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id` to your `.env.local` file.
3. Run `npm install` to ensure all dependencies are up to date.
4. Start the application with `npm run dev`.
5. Open browser developer tools and check:
   - Meta Pixel script loads on every page (check Network tab for Facebook scripts)
   - No console errors related to Meta Pixel
   - `window.fbq` is available globally
6. Test event tracking functions:
   - Import and call `trackViewContent()`, `trackSearch()`, etc. from `meta-pixel-client.ts`
   - Verify events appear in Facebook Events Manager (if pixel is configured)
7. Test without Meta Pixel ID:
   - Remove `NEXT_PUBLIC_META_PIXEL_ID` from `.env.local`
   - Verify no errors and graceful fallback behavior
8. Check noscript fallback:
   - Disable JavaScript in browser
   - Verify Meta Pixel tracking pixel loads in page source

## Environment Variables Required

- `NEXT_PUBLIC_META_PIXEL_ID` - Your Facebook Pixel ID (required for script to load)
- Other Meta Pixel API variables (for backend functionality):
  - `META_ACCESS_TOKEN`
  - `META_CATALOG_ID`
  - `META_BUSINESS_ID`

## Files Changed

### New Files
- `app/components/MetaPixelScript.tsx` - Meta Pixel script component
- `app/lib/meta-pixel-client.ts` - Client-side Meta Pixel utility with server-side fallback
- `app/lib/meta-conversion-api.ts` - Conversion API client for server-side tracking
- `app/api/meta/conversion/route.ts` - Conversion API endpoint
- `app/lib/meta-pageview-middleware.ts` - Page view tracking middleware
- `pr-templates/meta-pixel-script-integration.md` - This PR template

### Modified Files
- `app/layout.tsx` - Added Meta Pixel script integration
- `middleware.ts` - Added server-side page view tracking
- `env.example` - Added `NEXT_PUBLIC_META_PIXEL_ID` environment variable
- `requirements/meta-pixel-api-integration.txt` - Updated with comprehensive tracking details 