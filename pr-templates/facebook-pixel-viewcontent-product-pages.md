# Facebook Pixel ViewContent Tracking for Product Pages

## Changelog

### Facebook Pixel Integration
- Added ViewContent event tracking to product detail pages (`/list-item/[id]`)
  - Tracks when users view individual product pages
  - Includes comprehensive product data for Facebook Shop catalog ingestion
  - Uses existing Meta Pixel infrastructure with server-side fallback
- Enhanced product data tracking
  - **Basic Event Data**: content_name, content_category, content_ids, value, currency
  - **Facebook Shop Catalog Fields**: brand, condition, availability, price, sale_price, gtin
  - **Category Structure**: department/category/subcategory format for better categorization
  - **Availability Status**: "in stock" for LISTED items, "out of stock" for others

### Technical Implementation
- **Import Update**: Added `trackMetaPixelEvent` import from `meta-pixel-client.ts`
- **Tracking Location**: Added after successful listing data fetch and transformation
- **Error Handling**: Non-blocking implementation that doesn't affect page load
- **Data Mapping**: Comprehensive mapping of product fields to Facebook Shop requirements

### Product Page Enhancements
- **Timing**: ViewContent tracking occurs immediately after listing data is loaded
- **Data Quality**: Includes all available product information for optimal catalog ingestion
- **Fallback Support**: Uses server-side tracking if client-side fails
- **Performance**: Asynchronous tracking that doesn't impact page load speed

---

## Testing Instructions

1. Pull this branch and run `npm install`
2. Start the application with `npm run dev`
3. Navigate to any product detail page (`/list-item/[id]`)
4. Open browser developer tools and check the Network tab
5. Verify Facebook Pixel events:
   - Look for calls to `/api/meta/conversion` endpoint
   - Check that ViewContent events include all required product data
   - Verify events appear in Facebook Events Manager (if pixel is configured)
6. Test with different product types:
   - Products with complete data (brand, gtin, etc.)
   - Products with minimal data
   - Products with sale prices
   - Products with different availability statuses
7. Test error scenarios:
   - Disable JavaScript to test server-side fallback
   - Check console for tracking error messages
   - Verify page loads normally even if tracking fails

## Expected Behavior

- **ViewContent Events**: Should fire on every product page load
- **Event Data**: Should include comprehensive product information
- **Facebook Shop Integration**: Events should drive catalog ingestion
- **Performance**: No impact on page load speed
- **Reliability**: Graceful error handling without breaking page functionality 