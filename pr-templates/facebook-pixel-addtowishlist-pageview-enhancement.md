# Facebook Pixel AddToWishlist and PageView Tracking Enhancement

## Changelog

### AddToWishlist Event Implementation
- Added custom AddToWishlist event tracking for save functionality
  - **New Function**: Created `trackAddToWishlist` in `meta-pixel-client.ts`
  - **Product Detail Pages**: Added tracking to save button in `/list-item/[id]` pages
  - **Listing Pages**: Added tracking to save button in `/list-item` pages
  - **Comprehensive Data**: Includes all Facebook Shop catalog fields for optimal ingestion
- Enhanced save functionality tracking
  - **Event Data**: content_name, content_category, content_ids, value, currency
  - **Facebook Shop Fields**: brand, condition, availability, price, sale_price, gtin
  - **Category Structure**: department/category/subcategory format
  - **Availability Status**: "in stock" for LISTED items, "out of stock" for others

### PageView Tracking Verification
- **Current Status**: PageView tracking is already comprehensive
  - **Middleware**: Automatic server-side tracking via `meta-pageview-middleware.ts`
  - **Client-Side**: Automatic tracking via `MetaPixelScript` component
  - **Coverage**: All pages tracked except API routes, static files, and admin routes
  - **Dual Tracking**: Both client-side (Pixel) and server-side (Conversions API)
- **No Changes Needed**: PageView tracking was already properly implemented

### Technical Implementation
- **AddToWishlist Function**: New tracking function with comprehensive product data
- **Save Button Integration**: Added to `toggleSaved` functions in both page types
- **Error Handling**: Non-blocking implementation that doesn't affect save functionality
- **Fallback Support**: Uses server-side tracking if client-side fails
- **Performance**: Asynchronous tracking that doesn't impact user experience

### Product Page Enhancements
- **Timing**: AddToWishlist tracking occurs when user clicks save button
- **Data Quality**: Includes all available product information for optimal catalog ingestion
- **User Experience**: Save functionality works normally even if tracking fails
- **Comprehensive Coverage**: Tracks saves from both listing grid and product detail pages

---

## Testing Instructions

1. Pull this branch and run `npm install`
2. Start the application with `npm run dev`
3. Test AddToWishlist tracking:
   - Navigate to listings page (`/list-item`)
   - Click save button on any listing
   - Check browser developer tools Network tab for `/api/meta/conversion` calls
   - Verify AddToWishlist events include all product data
   - Navigate to product detail page (`/list-item/[id]`)
   - Click save button and verify tracking works
4. Test PageView tracking:
   - Navigate to various pages (home, listings, product details, etc.)
   - Check that PageView events fire on all page loads
   - Verify both client-side and server-side tracking work
5. Test error scenarios:
   - Disable JavaScript to test server-side fallback
   - Check console for tracking error messages
   - Verify save functionality works normally even if tracking fails
6. Verify in Facebook Events Manager:
   - AddToWishlist events appear with correct product data
   - PageView events fire on all page loads
   - Events include all required catalog fields

## Expected Behavior

- **AddToWishlist Events**: Should fire when users save items on any page
- **Event Data**: Should include comprehensive product information
- **Facebook Shop Integration**: Events should drive catalog ingestion for saved items
- **PageView Events**: Should fire on every page load (already working)
- **Performance**: No impact on save functionality or page load speed
- **Reliability**: Graceful error handling without breaking user experience
- **Dual Tracking**: Both client-side and server-side tracking working properly 