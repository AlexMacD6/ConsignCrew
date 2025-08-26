# Inventory Quantity Calculation Fix

## Changelog

- **Fixed inventory quantity display showing 0 instead of actual quantities**
  - Updated `InventorySelector` component interface to use `quantity` instead of `currentStock`
  - Fixed field name mismatch between API response and component interface
  - Enhanced inventory search API to calculate available quantities

- **Improved quantity calculation logic**
  - Updated `/api/inventory/search` to include listing counts
  - Added calculation for available quantity (total - already listed)
  - Added `totalQuantity` and `postedListings` fields for reference

- **Enhanced inventory display with meaningful quantities**
  - Changed display from "Qty: 0" to "Available: X/Y" format
  - X = Available to list (total quantity - already posted listings)
  - Y = Total quantity in inventory
  - Maintained color coding: red (0), orange (1-5), green (6+)

- **Fixed data structure alignment**
  - Aligned component interface with actual Prisma schema fields
  - API now returns `quantity` field as expected by component
  - Added proper TypeScript types for new fields

---

## Root Cause

The issue was caused by a mismatch between:
1. **API Response**: Returning `quantity` field from Prisma schema
2. **Component Interface**: Expecting `currentStock` field
3. **Missing Logic**: Not calculating available quantities (total - already listed)

This resulted in the component always showing 0 because it was looking for a field that didn't exist in the API response.

## Technical Changes

### API Changes (`/api/inventory/search`)
- Added `listings` relation to query to count posted listings
- Calculated `availableQuantity = totalQuantity - postedListings`
- Set `quantity` field to available quantity for component consumption
- Added `totalQuantity` and `postedListings` for reference

### Component Changes (`InventorySelector.tsx`)
- Updated interface from `currentStock: number` to `quantity: number`
- Added optional `totalQuantity` and `postedListings` fields
- Changed display format to show available/total quantities
- Updated all references from `currentStock` to `quantity`

### Display Format
- **Before**: "Qty: 0" (always 0 due to field mismatch)
- **After**: "Available: 3/10" (3 available to list out of 10 total)

## Testing Instructions

1. Pull this branch and start the application with `npm run dev`
2. **Test inventory selector with real data:**
   - Navigate to `/list-item` page
   - Click "Select from Inventory" to open inventory modal
   - Search for "midea" or any inventory items
   - Verify quantities now show actual numbers instead of 0
3. **Test quantity display format:**
   - Items should show "Available: X/Y" format
   - X should be the available quantity to list
   - Y should be the total inventory quantity
   - Color coding should work: red (0), orange (1-5), green (6+)
4. **Test with items that have listings:**
   - Look for items that already have some listings posted
   - Verify available quantity = total quantity - posted listings
   - Confirm calculation is accurate
5. **Test edge cases:**
   - Items with 0 total quantity
   - Items with all quantity already listed
   - Items with no listings yet

## Benefits

- ✅ **Accurate inventory visibility** - Users can see actual available quantities
- ✅ **Better decision making** - Clear distinction between available vs. total quantity
- ✅ **Prevents over-listing** - Shows only quantities available to list
- ✅ **Improved UX** - Meaningful data instead of confusing 0s
- ✅ **Data integrity** - Proper calculation of available inventory
