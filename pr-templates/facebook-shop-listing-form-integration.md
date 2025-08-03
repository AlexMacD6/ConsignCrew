## Changelog

- Added Facebook Shop integration fields to listing creation form
  - Created dedicated Facebook Shop section with toggle switch
    - Added "Enable Facebook Shop Sync" toggle (defaults to enabled)
    - Facebook fields only appear when sync is enabled
    - Visual Facebook branding with blue accent colors
  - Added Facebook-specific form fields
    - **Facebook Brand Name**: Optional brand name for Facebook Shop
    - **Facebook Category**: Dropdown with Facebook Shop categories
    - **Facebook Condition**: Facebook-specific condition (new/used/refurbished)
    - **GTIN/UPC Code**: Optional 13-digit product identifier
  - Enhanced user experience
    - Smart placeholders that use main listing data
    - Clear help text explaining each field's purpose
    - Collapsible section to keep form clean
    - All Facebook fields are optional with fallback logic
  - Updated backend integration
    - Modified `/api/listings` endpoint to handle Facebook fields
    - Added Facebook field validation and null handling
    - Maintained backward compatibility with existing listings
    - Facebook fields stored in existing database columns
  - Improved data flow
    - Facebook fields included in form submission payload
    - Proper fallback to main listing data when Facebook fields are empty
    - Default values ensure existing functionality continues working

---

## Testing Instructions

1. **Form Functionality**:
   - Navigate to `/list-item` and create a new listing
   - Verify Facebook Shop section appears after ZIP code field
   - Test "Enable Facebook Shop Sync" toggle shows/hides Facebook fields
   - Fill in Facebook fields and submit listing
   - Check database to confirm Facebook fields are saved correctly

2. **Facebook Field Behavior**:
   - Test Facebook Brand Name field with and without main brand
   - Verify Facebook Category dropdown shows correct options
   - Test Facebook Condition dropdown (new/used/refurbished)
   - Validate GTIN/UPC Code field accepts 13-digit numbers
   - Test all fields work when left empty (fallback behavior)

3. **API Integration**:
   - Test `/api/listings` endpoint with Facebook fields
   - Verify Facebook fields are included in request payload
   - Check response includes Facebook field data
   - Test with various Facebook field combinations

4. **Database Storage**:
   - Verify Facebook fields are stored in correct database columns
   - Test `facebookShopEnabled` defaults to true for new listings
   - Check null handling for optional Facebook fields
   - Confirm existing listings are unaffected

5. **Facebook Shop Feed**:
   - Test `/api/facebook-shop/feed` still works correctly
   - Verify listings with Facebook fields appear in feed
   - Check Facebook field values are used when available
   - Test fallback to main listing data when Facebook fields are empty

6. **User Experience**:
   - Test form layout on desktop and mobile devices
   - Verify Facebook section styling is visually distinct
   - Check toggle switch animation and behavior
   - Test placeholder text and help text display correctly

7. **Edge Cases**:
   - Test form submission with all Facebook fields empty
   - Verify form works when Facebook sync is disabled
   - Test with special characters in Facebook fields
   - Check form validation with invalid GTIN/UPC codes 