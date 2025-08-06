## Changelog

- Fixed misleading percentage off retail display
  - Updated conditional logic to only show percentage off retail for items with condition "New"
  - Applied fix to all three display locations: gallery view, detail page, and modal
  - Prevents confusion about discounts on used or damaged goods
  - Maintains estimated retail price display for non-new items without percentage calculation

### Files Updated
- `app/(dashboard)/listings/page.tsx` - Gallery view and modal display
- `app/(dashboard)/list-item/[id]/page.tsx` - Detail page display

### Logic Changes
- **Before**: Show percentage off retail for any item with `estimated_retail_price`
- **After**: Show percentage off retail only for items with `estimated_retail_price` AND `condition === "New"`

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/listings` in the browser.
5. Test percentage off retail display:
   - **New items**: Should show percentage off retail if they have estimated retail price
   - **Used/Good/Fair/Poor items**: Should NOT show percentage off retail, even if they have estimated retail price
   - **Items without estimated retail price**: Should not show any retail price information
6. Test all three display locations:
   - Gallery view (listing cards)
   - Modal view (click on listing)
   - Detail page (click "View Details")
7. Verify estimated retail price still displays for non-new items (without percentage calculation)

## Expected Behavior

### New Items
- ✅ Show estimated retail price with strikethrough
- ✅ Show percentage off retail with red arrow
- ✅ Example: "~~$299.99~~ 25% Off Retail"

### Used/Good/Fair/Poor Items
- ❌ Do NOT show percentage off retail
- ✅ May still show estimated retail price (without percentage)
- ✅ Example: "~~$299.99~~" (no percentage shown)

### Items Without Estimated Retail Price
- ❌ Do not show any retail price information
- ✅ Only show list price

## Notes

- This change improves accuracy and prevents misleading claims about discounts
- Used and damaged goods should not suggest they are discounted from retail
- The fix maintains consistency across all display locations
- Estimated retail price information is still available for reference when appropriate 