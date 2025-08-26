# Expired Order Resumption Fix

## Changelog

- **Fixed expired order handling issue**
  - Added new API endpoint `/api/orders/expired` to detect and manage expired orders
  - Added `/api/orders/expired/restore` endpoint to restore expired orders back to cart
  - Updated cart page to display expired orders with restore functionality
  - Fixed disconnect between orders showing as "Processing" in profile but not resumable

- **Enhanced cart page functionality**
  - Added expired orders section with visual indicators (orange theme)
  - Added individual and bulk restore buttons for expired orders
  - Added loading states and error handling for restoration process
  - Added time ago display showing when orders expired

- **Improved order lifecycle management**
  - Orders that expire now can be properly restored to cart instead of being stuck
  - Multi-item orders are properly handled during restoration
  - Listings are correctly released back to active status when orders are restored
  - Expired orders are cancelled upon restoration to prevent duplicate processing

- **User experience improvements**
  - Clear messaging about expired orders and restoration options
  - Visual differentiation between active checkouts and expired orders
  - Automatic refresh of cart contents after restoration
  - Success/error feedback for all restoration operations

---

## Testing Instructions

1. Pull this branch and run `npm install` if needed
2. Start the application with `npm run dev`
3. **Test expired order creation:**
   - Add items to cart and proceed to checkout
   - Wait for the 10-minute timer to expire (or manually set a short timer for testing)
   - Navigate away from checkout page
4. **Test expired order detection:**
   - Go to `/cart` page
   - Verify expired orders appear in orange section with "restore" options
   - Check that time display shows correct "X minutes/hours ago"
5. **Test single order restoration:**
   - Click "Restore to Cart" on individual expired order
   - Verify item appears back in cart
   - Verify expired order disappears from expired section
6. **Test bulk restoration:**
   - Create multiple expired orders
   - Use "Restore All X Orders" button
   - Verify all items are restored to cart properly
7. **Test multi-item order restoration:**
   - Add multiple items to cart and let order expire
   - Restore the multi-item order
   - Verify all items return to cart correctly
8. **Verify profile page:**
   - Check that restored orders no longer show as "Processing"
   - Verify cancelled orders don't appear in active purchases

## Edge Cases to Test

- Expired orders where items are no longer available (should show appropriate message)
- Restoration when cart already contains the same items
- Multiple expired orders from different time periods
- Network errors during restoration process
- Simultaneous restoration attempts
