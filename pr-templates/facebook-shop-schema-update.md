## Changelog

- Added missing Facebook Shop product fields to Listing schema
  - **Product Availability & Pricing**:
    - `quantity` - Number of items available for sale (Int, default: 1)
    - `salePrice` - Discounted/sale price (Float, optional)
    - `salePriceEffectiveDate` - When sale price is active (DateTime, optional)
  - **Product Specifications**:
    - `gender` - "male", "female", "unisex" (String, optional)
    - `color` - Product color (String, optional)
    - `size` - Product size (String, optional)
    - `ageGroup` - "adult", "kids", "infant" (String, optional)
    - `material` - Product material (String, optional)
    - `pattern` - Product pattern (String, optional)
    - `style` - Product style (String, optional)
  - **Enhanced Categorization**:
    - `productType` - Specific product type (String, optional)
    - `tags` - Array of product tags (String[], default: [])
    - `itemGroupId` - For product variants (String, optional)
- Updated Facebook Shop export to use structured fields
  - Replaced text parsing with direct field access
  - Added fallback to description parsing for backward compatibility
  - Improved data accuracy and consistency
- Created database migration: `20250805172926_add_facebook_shop_product_fields`
- Enhanced data structure for better Facebook Shop integration

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. The database migration should have already run automatically.
4. Start the application with `npm run dev`.

### Test Database Schema
1. Verify new fields exist in the database:
   ```sql
   -- Check if new columns were added
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'Listing' 
   AND column_name IN ('quantity', 'salePrice', 'gender', 'color', 'size', 'material', 'tags');
   ```

### Test Facebook Shop Export
1. Navigate to the admin dashboard.
2. Click "Facebook Shop Export" to test the CSV generation.
3. Verify the CSV includes all required Facebook Shop fields:
   - Check that `quantity` field uses actual listing quantity
   - Verify `salePrice` and `salePriceEffectiveDate` are included when available
   - Confirm structured fields (gender, color, size, material) are used
   - Ensure fallback to description parsing works for existing listings

### Test Backward Compatibility
1. Export listings that don't have the new fields populated.
2. Verify the export still works using description parsing as fallback.
3. Check that existing listings continue to function normally.

### Test New Field Population
1. Create or edit a listing with the new fields.
2. Verify the fields are saved correctly in the database.
3. Export the listing and confirm the structured data appears in the CSV.

### Verify Migration
1. Check that the migration file was created: `prisma/migrations/20250805172926_add_facebook_shop_product_fields/`
2. Confirm the migration ran successfully without errors.
3. Verify the Prisma client was regenerated.

## Database Changes
- Added 12 new optional fields to the `Listing` table
- All fields are nullable to maintain backward compatibility
- Default values set for `quantity` (1) and `tags` ([])
- Migration preserves existing data

## Files Modified
- `prisma/schema.prisma` - Added new product fields
- `app/api/facebook-shop/export/route.ts` - Updated to use structured fields
- `prisma/migrations/20250805172926_add_facebook_shop_product_fields/` - Database migration 