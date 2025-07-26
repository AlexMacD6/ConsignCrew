## Changelog

- Cleaned up Gallery Page (listings page) display
  - Removed seller name from listing cards for cleaner appearance
  - Removed serial number from listing cards to reduce clutter
  - Removed model number from listing cards to improve readability
  - Maintained all removed information in View Details modal
- Improved user experience with less cluttered gallery view
- Kept essential information (price, condition, location, brand, dimensions) visible on cards

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/listings` in the browser.
5. Verify that listing cards no longer display:
   - Seller name
   - Serial number
   - Model number
6. Confirm that essential information remains visible on cards:
   - Price
   - Condition
   - Location
   - Brand (if available)
   - Dimensions (if available)
7. Click "View Details" on any listing to verify that:
   - Seller name appears in "Seller Information" section
   - Serial number appears in "Item Details" section
   - Model number appears in "Item Details" section
8. Test that the gallery layout looks cleaner and more readable. 