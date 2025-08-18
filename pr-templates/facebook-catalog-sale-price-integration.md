# Facebook Catalog Sale Price Integration

## Changelog

- **Enhanced Facebook Catalog Sync**: Modified to use Facebook's "Sale price" field instead of constantly changing the main list price
- **New Discount Schedule Function**: Added `calculateFacebookSalePrice()` function to determine when to activate sale prices
- **Original Price Preservation**: Main price field now always shows the original listing price for reference
- **Smart Sale Price Activation**: Sale price only activates after the first discount interval (not at 100% original price)
- **Reserve Price Protection**: Sale prices won't go below the minimum acceptable price
- **Enhanced Debug Logging**: Added comprehensive price calculation debugging for Facebook sync operations
- **Schedule Integration**: Works seamlessly with existing Turbo-30 and Classic-60 discount schedules

## Technical Changes

### **New Function Added**
- `calculateFacebookSalePrice()` in `app/lib/discount-schedule.ts`
- Determines when to use Facebook's sale price field vs main price field
- Integrates with existing discount schedule logic

### **Facebook Catalog Sync Updates**
- **Create Function**: Modified to calculate and send sale prices when appropriate
- **Update Function**: Enhanced to maintain sale price consistency during updates
- **Price Logic**: Main price always original, sale price contains discounted amount
- **API Integration**: Uses Facebook's `sale_price` field with conditional logic

### **Interface Updates**
- Extended `FacebookProductData` interface to include optional `salePrice` field
- Added price history inclusion in database queries for accurate original price retrieval

### **Debug Enhancements**
- Added comprehensive price calculation logging
- Shows original price, current price, Facebook price, and sale price
- Displays discount schedule type and days since creation

## How It Works

### **Before First Discount (100% Original Price)**
- Main Price: Shows original listing price
- Sale Price: Not set (checkbox unchecked)
- Display: Shows original price without discount indication

### **After First Discount (e.g., 95% for Turbo-30)**
- Main Price: Shows original listing price  
- Sale Price: Shows discounted price (checkbox checked)
- Display: Shows original price crossed out with sale price highlighted

### **At Expiration (0% Original Price)**
- Main Price: Shows original listing price
- Sale Price: Not set (checkbox unchecked)
- Display: Shows original price (item effectively expired)

## Benefits

✅ **Better Price Presentation**: Original price always visible for reference  
✅ **Facebook Compliance**: Uses Facebook's intended sale price field structure  
✅ **Professional Appearance**: Shows proper discount presentation with strikethrough  
✅ **Price History Preservation**: Original price remains unchanged in database  
✅ **Reserve Price Protection**: Won't sell below minimum acceptable price  
✅ **Schedule Flexibility**: Works with existing discount schedule system  
✅ **User Experience**: Clear price progression and discount visibility  

## Testing Instructions

### **Test Sale Price Activation**
1. Pull this branch and run `npm install`
2. Create a listing with a discount schedule (Turbo-30 or Classic-60)
3. Wait for the first discount interval:
   - **Turbo-30**: Day 3 (95% of original price)
   - **Classic-60**: Day 7 (90% of original price)
4. Check Facebook catalog for sale price field activation
5. Verify price display shows original + sale price

### **Test Price Progression**
1. Monitor price changes at each discount interval
2. Verify sale price updates while main price remains constant
3. Check reserve price protection doesn't allow prices below minimum

### **Test Expiration**
1. Wait for schedule completion (day 30 for Turbo-30, day 60 for Classic-60)
2. Verify sale price removal when item expires
3. Check main price still shows original listing price

### **Test Facebook Sync**
1. Enable Facebook Shop for a listing with discount schedule
2. Check console logs for price calculation debugging
3. Verify Facebook API requests include appropriate sale_price field
4. Monitor Facebook Commerce Manager for proper price display

## Expected Results

- **Original prices preserved** in main price field for all listings
- **Sale prices activate** automatically after first discount interval
- **Facebook catalog shows** proper discount presentation with strikethrough
- **Reserve price protection** prevents selling below minimum acceptable price
- **Debug logs show** comprehensive price calculation information
- **No linter errors** - all TypeScript compilation issues resolved

## Files Modified

- `app/lib/discount-schedule.ts` - Added `calculateFacebookSalePrice()` function
- `app/lib/facebook-catalog-sync.ts` - Enhanced create and update functions with sale price logic
- `requirements/facebook-catalog-sale-price-integration.txt` - New requirements documentation
- `pr-templates/facebook-catalog-sale-price-integration.md` - This PR template

## Notes

- **Sale price only activates** after the first discount interval (not at 100% original price)
- **Main price field** always contains the original listing price for reference
- **Facebook processing** may take time to reflect sale price changes
- **Reserve price protection** ensures items don't sell below acceptable minimum
- **Backward compatible** with existing listings and discount schedules
- **Debug logging** provides comprehensive price calculation information
