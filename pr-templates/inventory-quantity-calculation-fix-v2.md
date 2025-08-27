# Inventory Quantity Calculation Fix v2

## Changelog

- **Fixed inventory quantity calculation to show correct totals**
  - Fixed null quantity handling in `/api/admin/inventory/items` endpoint
  - Updated InventorySelector component to display proper total inventory values
  - Added debug logging for items with null quantities
  - Fixed field mapping between API response and UI component

- **Fixed "Available Only" filter logic** 
  - Previously showed only listed items when "Available Only" was active
  - Now correctly shows only items available to list (availableToList > 0)
  - Updated filter logic in admin inventory API endpoint
  - Fixed pagination counts for filtered results

- **Improved quantity display accuracy**
  - Handle null database quantities by defaulting to 0 with warnings
  - Map totalInventory field properly between API and UI
  - Show correct "Remaining to List" calculation 
  - Color-coded availability indicators (red/orange/green)

---

## Root Cause Analysis

There were two primary issues:

1. **Null Quantity Values**: Some inventory items had `null` quantity in the database, causing "Total Inventory: 0" display
2. **Inverted Filter Logic**: "Available Only" filter was showing listed items instead of available items

### Issue Details

- **Total Inventory showing 0**: Database `quantity` field was null for some items like #1652803
- **Available Filter backwards**: `availableOnlyParam=true` filtered for `postedListings > 0` instead of `availableToList > 0`
- **Field mapping confusion**: API returned `totalInventory` but UI expected `totalQuantity`

## Technical Fix

### Null Quantity Handling
```javascript
// Before: Would show 0 for null quantities without explanation
const totalInventory = it.quantity || 0;

// After: Handle nulls with debugging 
const originalQuantity = it.quantity;
const totalInventory = it.quantity || 0;
if (originalQuantity === null) {
  console.log(`Warning: Item ${it.itemNumber} has null quantity`);
}
```

### Filter Logic Fix
```javascript
// Before: Showed items WITH listings when "Available Only" active
let filteredItems = availableOnlyParam === "true" 
  ? itemsWithUnit.filter(item => item.postedListings > 0)
  : itemsWithUnit;

// After: Shows items available to list
let filteredItems = availableOnlyParam === "true" 
  ? itemsWithUnit.filter(item => item.availableToList > 0)
  : itemsWithUnit;
```

### Calculation Logic
- **Total Inventory**: Database `quantity` field (handle null → 0)
- **Already Listed**: Count of active listings only  
- **Remaining to List**: Total - Already Listed

## Testing Instructions

1. Pull this branch and start the application
2. **Test corrected calculations:**
   - Open list-item page and click "Select from Inventory"
   - Search for "midea" or browse inventory items
   - Verify items show correct values:
     - Total Inventory: Actual quantity from database (not 0)
     - Already Listed: Count of active listings only
     - Remaining to List: Total - Already Listed

3. **Test "Available Only" filter:**
   - Click filter button to toggle between "Show All Items" and "✓ Available Only"
   - **"Show All Items"**: Shows all inventory items regardless of availability
   - **"✓ Available Only"**: Shows only items with Remaining to List > 0
   - Verify button visual states (active has gold background and checkmark)

4. **Check for null quantity warnings:**
   - Look in server console for warnings about items with null quantities
   - These will help identify data issues in the inventory database

## Expected Results

For inventory items like the MIDEA examples:
- ✅ **Total Inventory**: Shows actual database quantity (12, not 0)
- ✅ **Already Listed**: Shows count of active listings only (1)
- ✅ **Remaining to List**: Shows correct calculation (11 = 12 - 1)
- ✅ **Available Filter**: Shows only listable items when active
- ✅ **Color Coding**: Red (0), Orange (1-5), Green (>5) for remaining quantity

## Files Modified

- `app/api/admin/inventory/items/route.ts` - Fixed null handling and filter logic
- `app/components/InventorySelector.tsx` - Updated field mapping and display
- Removed temporary debug files
