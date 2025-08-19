# Fix Modal Price Display

## Changelog

- Fixed View Details modal price display
  - Updated modal to use `getDisplayPrice()` function instead of directly showing `list_price`
  - Modal now properly displays sales price when a valid discount is active
  - Added visual styling for discounted prices with "Sale" badge
  - Updated "Reserve Met" condition to use actual display price
  - Updated retail price comparison to use current display price for accurate percentage calculations

---

## Testing Instructions

1. Pull this branch.
2. Start the application with `npm run dev`.
3. Navigate to the listings page at `/listings`.
4. Find a listing that has a valid sales price (discounted from list price).
5. Click the "View Details" button on the listing.
6. Verify that the modal displays:
   - The sales price in green text (not the list price)
   - The original list price crossed out
   - A "Sale" badge to indicate it's discounted
   - Correct "Reserve Met" status based on sales price
   - Accurate retail price percentage based on sales price
7. Test with listings that don't have sales prices to ensure they display normally.
