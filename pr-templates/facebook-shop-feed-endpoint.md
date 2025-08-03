## Changelog

- Added Facebook Shop product feed endpoint
  - Created `/api/facebook-shop/feed` endpoint
    - Generates XML feed in Google Shopping format (compatible with Facebook Shop)
    - Filters only active listings with `facebookShopEnabled: true`
    - Includes all required Facebook Shop fields (id, title, description, price, availability, etc.)
    - Maps TreasureHub conditions to Facebook format (new/used/refurbished)
    - Maps categories to Google Product Category taxonomy
    - Includes 15% service fee in displayed prices
    - Provides free standard shipping information
  - Enhanced product data structure
    - Added custom labels for neighborhood, zip code, and seller name
    - Proper XML escaping for special characters
    - Product URLs point to individual listing pages
    - Brand information from Facebook-specific fields or fallback to general brand
  - Performance optimizations
    - 1-hour caching for improved performance
    - Efficient database queries with proper indexing
    - XML response with correct content-type headers
    - Error handling for graceful failure responses

---

## Testing Instructions

1. **Endpoint Access**:
   - Visit `http://localhost:3000/api/facebook-shop/feed` in browser
   - Verify XML response loads correctly
   - Check that Content-Type is `application/xml; charset=utf-8`

2. **Feed Content**:
   - Confirm only active listings with `facebookShopEnabled: true` appear
   - Verify all required Facebook Shop fields are present:
     - `<g:id>`, `<g:title>`, `<g:description>`, `<g:link>`
     - `<g:image_link>`, `<g:availability>`, `<g:price>`
     - `<g:brand>`, `<g:condition>`, `<g:product_type>`
   - Check price includes 15% service fee calculation
   - Validate condition mapping (new/used/refurbished)

3. **XML Validation**:
   - Test XML structure with online validators
   - Verify proper escaping of special characters (&, <, >, ", ')
   - Check RSS namespace declaration is correct
   - Confirm UTF-8 encoding is specified

4. **Facebook Integration**:
   - Use Facebook's feed validator tool to test compatibility
   - Verify feed URL works with Facebook Shop setup
   - Test with sample listings to ensure proper formatting

5. **Performance Testing**:
   - Test with large number of listings
   - Verify caching headers are set correctly
   - Check response times are acceptable (< 2 seconds) 