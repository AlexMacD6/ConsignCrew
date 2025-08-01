# Meta Pixel Setup with Conversions API

## Changelog

- Added Meta Pixel integration for Facebook Ads tracking
  - Created Meta Pixel utility functions in `app/lib/meta-pixel.ts`
    - Client-side pixel initialization and event tracking
    - Server-side Conversions API integration
    - Data hashing for privacy compliance
    - Predefined event builders for common conversions
  - Added Conversions API endpoint in `app/api/meta-conversions/route.ts`
    - Server-side event tracking for better accuracy
    - Automatic client IP and user agent collection
    - Error handling and validation
  - Created MetaPixelProvider React component
    - Context-based event tracking
    - Predefined tracking functions for common events
    - Client-side pixel initialization
  - Updated layout.tsx to include Meta Pixel provider
  - Added event tracking to key user actions:
    - Email signups (Lead events)
    - Contact form submissions (Contact events)
    - Page views (ViewContent events)
  - Updated subscribe API to send server-side Lead events
  - Added environment variables for Meta Pixel configuration

## Environment Variables Required

Add the following to your `.env.local` file:
```
NEXT_PUBLIC_META_PIXEL_ID=your_meta_pixel_id_here
META_ACCESS_TOKEN=your_meta_access_token_here
META_API_VERSION=v18.0
```

## Events Tracked

1. **PageView** - Automatic on all pages
2. **Lead** - Email signups and registrations
3. **ViewContent** - Page views with content details
4. **Contact** - Contact form submissions
5. **AddToCart** - When users save/hide listings (ready for implementation)
6. **InitiateCheckout** - When users start consignment process (ready for implementation)
7. **Purchase** - Completed consignment agreements (ready for implementation)

## Testing Instructions

1. Pull this branch and run `npm install`
2. Add Meta Pixel environment variables to `.env.local`
3. Start the application with `npm run dev`
4. Test Meta Pixel events:
   - Visit homepage (should fire PageView and ViewContent)
   - Submit email signup (should fire Lead event)
   - Submit contact form (should fire Contact event)
5. Check Facebook Events Manager to verify events are firing
6. Test server-side events by checking browser network tab for `/api/meta-conversions` calls
7. Verify data hashing is working correctly for privacy compliance

## Facebook Ads Setup

1. Create a Meta Pixel in Facebook Business Manager
2. Get your Pixel ID and Access Token
3. Add them to your environment variables
4. Set up custom conversions in Facebook Ads Manager:
   - Lead conversion (email signups)
   - Contact conversion (contact form submissions)
   - ViewContent conversion (page views)
5. Create ad campaigns optimized for these conversions

## Privacy Compliance

- All user data is hashed using SHA-256 before sending to Meta
- Client IP and user agent are collected for Conversions API
- Events include proper content categorization for better targeting
- No personally identifiable information is sent in plain text 