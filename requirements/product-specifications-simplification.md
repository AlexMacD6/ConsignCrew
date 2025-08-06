# Product Specifications Simplification

## Overview
Simplify product specifications based on Meta's Commerce Catalog rules to improve user experience and data quality.

## Requirements

### 1. Fixed Sets for Gender and Age Group
- **Gender**: Convert to dropdown with fixed values: `male`, `female`, `unisex`
- **Age Group**: Convert to dropdown with fixed values: `newborn`, `infant`, `toddler`, `kids`, `adult`
- Implement validation to reject values not in these fixed sets

### 2. Dropdown + Free-Type Hybrid for Other Fields
- **Color**: Provide suggested list with free-type option
- **Material**: Provide suggested list with free-type option  
- **Pattern**: Provide suggested list with free-type option
- **Style**: Provide suggested list with free-type option

### 3. Data Processing Rules
- All values must be lower-cased and trimmed before writing to the feed
- Attributes can be left blank if not relevant
- Item Group ID must be limited to ≤ 50 characters
- Product Type should support hierarchical free-text

### 4. Validation Rules
- Gender and Age Group must validate against their fixed sets
- Other fields allow free-text input
- Item Group ID character limit enforcement

### 5. UI Improvements
- Convert Gender and Age Group to proper dropdowns
- Add suggested options for Color, Material, Pattern, and Style
- Maintain existing confidence indicators and tooltips
- Ensure all changes are applied to both list-item and edit listing pages

## Implementation Files
- `app/(dashboard)/list-item/page.tsx` - Create listing page
- `app/(dashboard)/list-item/[id]/edit/page.tsx` - Edit listing page
- `app/api/listings/[id]/route.ts` - API validation
- `app/api/listings/route.ts` - API validation

## Testing
- Verify dropdown functionality for Gender and Age Group
- Verify suggested options appear for hybrid fields
- Verify validation works correctly
- Verify data is properly lower-cased and trimmed
- Verify Item Group ID character limit enforcement

## Implementation Status
✅ **COMPLETED**

### Changes Made:
1. **Created Product Specifications Constants** (`app/lib/product-specifications.ts`)
   - Fixed sets for Gender and Age Group dropdowns
   - Suggested options for Color, Material, Pattern, and Style
   - Validation functions for all fields
   - Data processing functions to lower-case and trim values

2. **Created HybridInput Component** (`app/components/HybridInput.tsx`)
   - Dropdown + free-type hybrid input for suggested fields
   - Auto-filtering suggestions based on user input
   - Keyboard navigation support

3. **Updated List Item Page** (`app/(dashboard)/list-item/page.tsx`)
   - Converted Gender and Age Group to proper dropdowns with fixed sets
   - Replaced Color, Material, Pattern, and Style inputs with HybridInput components
   - Added character limit validation for Item Group ID
   - Updated form submission to process product specifications data

4. **Updated Edit Listing Page** (`app/(dashboard)/list-item/[id]/edit/page.tsx`)
   - Applied same changes as list item page
   - Maintained existing confidence indicators and tooltips
   - Updated data loading and form submission

5. **Added API Validation** 
   - Updated POST endpoint (`app/api/listings/route.ts`)
   - Updated PUT endpoint (`app/api/listings/[id]/route.ts`)
   - Added validation for Gender, Age Group, and Item Group ID

### Features Implemented:
- ✅ Fixed dropdown sets for Gender (`male`, `female`, `unisex`) and Age Group (`newborn`, `infant`, `toddler`, `kids`, `adult`)
- ✅ Hybrid dropdown + free-type for Color, Material, Pattern, and Style with suggested options
- ✅ All values lower-cased and trimmed before saving
- ✅ Attributes can be left blank if not relevant
- ✅ Validation for Gender and Age Group against fixed sets
- ✅ Item Group ID limited to ≤ 50 characters with character counter
- ✅ Product Type supports hierarchical free-text
- ✅ Maintained existing confidence indicators and tooltips 