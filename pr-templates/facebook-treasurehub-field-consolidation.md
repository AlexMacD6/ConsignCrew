# Facebook-TreasureHub Field Consolidation

## Changelog

- **Consolidated duplicated fields between Facebook inputs and TreasureHub fields**
  - **Condition Field**: Updated main condition field to use Facebook-compatible format (new/used/refurbished)
    - Changed from radio buttons to dropdown with Facebook-required values
    - Updated condition mapping logic in AI generation APIs
    - Removed duplicate Facebook condition field from form
  - **Brand Field**: Consolidated Facebook brand field into main brand field
    - Removed duplicate Facebook brand input from form
    - Updated form submission to use main brand for Facebook integration
    - Maintained fallback logic for existing data
  - **GTIN/UPC Field**: Moved GTIN field to main form section
    - Added GTIN/UPC input field to main form (before serial/model numbers)
    - Removed duplicate Facebook GTIN field from Facebook section
    - Maintained serial number and model number fields for internal use
  - **Form Simplification**: Removed duplicate Facebook-specific fields
    - Kept only Facebook category field in Facebook section
    - Simplified form structure and reduced user confusion
    - Maintained Facebook shop integration functionality

- **Updated API Integration**
  - **Facebook Shop Feed**: Updated to use consolidated fields
    - Modified condition mapping to handle new Facebook-compatible values
    - Updated brand field usage to prioritize main brand field
    - Maintained backward compatibility for existing listings
  - **AI Generation APIs**: Updated condition mapping logic
    - Modified form fields generation API to map old condition values to new format
    - Updated comprehensive listing generation API with proper condition mapping
    - Ensured AI-generated content uses Facebook-compatible formats

- **Database Schema**: No changes required
  - Existing Facebook fields remain for backward compatibility
  - Main fields now use Facebook-required formats
  - Data integrity maintained during transition

## Testing Instructions

1. **Pull this branch and run `npm install`**
2. **Start the application with `npm run dev`**
3. **Test the List an Item form:**
   - Navigate to `/list-item` page
   - Verify condition field shows dropdown with new/used/refurbished options
   - Verify GTIN/UPC field appears in main form section
   - Verify Facebook section only shows category field (no duplicate brand/condition/GTIN)
   - Test form submission with various condition values
4. **Test AI form generation:**
   - Upload photos and use AI form generation
   - Verify AI-generated condition values use Facebook-compatible format
   - Verify brand and GTIN fields are populated correctly
5. **Test Facebook shop integration:**
   - Create a listing with Facebook shop enabled
   - Verify Facebook shop feed uses consolidated fields
   - Check that condition mapping works correctly in feed generation
6. **Test backward compatibility:**
   - Verify existing listings still display correctly
   - Check that old condition values are properly mapped
   - Ensure no data loss during transition

## Technical Notes

- **Condition Mapping**: Old values (NEW, EXCELLENT, GOOD, FAIR) are mapped to Facebook format (new, used, refurbished)
- **Brand Field**: Main brand field is now used for both TreasureHub and Facebook integration
- **GTIN Field**: Moved to main form for better visibility and Facebook optimization
- **Form Structure**: Simplified by removing duplicate fields while maintaining functionality 