# Price Drop Counter Fix

## Changelog

- Fixed price drop counter to show accurate time based on listing creation date
  - Removed hardcoded "2d 14h" values from listings page and individual listing page
  - Updated data transformation to pass full discount schedule object instead of just type string
  - Enhanced `getTimeUntilNextDrop` function to handle both string and object discount schedules
  - Added dynamic time calculation for both Classic-60 and Turbo-30 schedules
  - Added "Next Price Drop" display to individual listing page
  - Added Clock icon import for time display

- Improved discount schedule handling
  - Better type checking and fallback logic
  - Maintained backward compatibility with existing string-based calls
  - Proper handling of expired listings (no time display)

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/listings` and verify price drop counters show accurate time.
5. Click on a listing to view details and verify "Next Price Drop" is displayed correctly.
6. Test with listings of different ages to confirm countdown accuracy.
7. Verify that expired listings don't show time counters.
8. Test both Classic-60 and Turbo-30 discount schedules.
9. Check that time updates correctly as days pass (may need to wait or test with different dates). 