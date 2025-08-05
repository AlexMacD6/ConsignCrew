## Changelog

- Fixed edit listing page taxonomy mismatch
  - Updated taxonomy object in edit page to match listing creation page
  - Added missing categories: "Clothing & Accessories", "Sporting Goods", "Tools & Hardware", "Pet Supplies", "Beauty & Health", "Office & Business", "Garden & Outdoor", "Collectibles", "Music", "Video Games & Consoles", "Appliances", "Arts & Crafts", "Baby & Kids", "Jewelry & Watches", "Entertainment"
  - Fixed category and sub-category dropdown population logic
- Fixed price drop counter blinking issue
  - Improved loading state management in PriceDropCounter component
  - Only show loading spinner when no price drop info is available
  - Clear errors when successful data is fetched
  - Reduced refresh delay from 5 seconds to 2 seconds
  - Prevented unnecessary re-renders causing blinking
- Confirmed discount schedule field visibility and functionality
  - Field was already present but taxonomy mismatch prevented proper data loading
  - Now correctly displays and allows editing of discount schedule

---

## Testing Instructions

1. Pull this branch and run `npm run dev`
2. Navigate to an existing listing's edit page (e.g., `http://localhost:3000/list-item/EJCONC/edit`)
3. Verify that:
   - Department dropdown shows the correct department (e.g., "Furniture")
   - Category dropdown populates with the correct category (not "Select Category")
   - Sub-category dropdown appears and shows the correct sub-category
   - Discount Schedule dropdown is visible and shows the current schedule
4. Test the price drop counter on a listing page to ensure it doesn't blink between "Next Price Drop" and "Loading"
5. Verify that all form fields maintain their values when editing 