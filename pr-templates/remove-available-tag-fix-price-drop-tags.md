## Changelog

### Status Badge Improvements
- Removed "Available" tag from listings page
  - Modified `getStatusBadge` function to return `null` for active/available listings
  - Updated all status badge rendering to handle `null` return value
  - Status badges now only appear for "In Transit", "Sold", and "Pending" states
  - Cleaner UI - if a listing is on the site, it's available by default

### Price Drop Tag Fixes
- Updated price drop calculations to match established discount schedule methodology
  - Fixed `getTimeUntilNextDrop` function to use day-based schedules instead of hourly
  - Turbo-30: Now shows drops every 3 days (0, 3, 6, 9, 12, 15, 18, 21, 24, 30)
  - Classic-60: Now shows drops every 7 days (0, 7, 14, 21, 28, 35, 42, 49, 56, 60)
  - Returns "days" format instead of "hours" (e.g., "3 days" instead of "72h 0m")
  - Added proper edge case handling (0 days = "Any moment now...", 1 day = "1 day")

### Technical Improvements
- Removed old hourly-based calculation logic
- Cleaned up duplicate code in price drop function
- Maintained backward compatibility with existing listing data
- Improved consistency with FAQ discount schedule documentation

---

## Testing Instructions

1. **Status Badge Testing**:
   - Navigate to listings page and verify no "Available" tags are shown for active listings
   - Check that "In Transit", "Sold", and "Pending" badges still display correctly
   - Verify status badges only appear for non-active listing states

2. **Price Drop Tag Testing**:
   - Test listings with Turbo-30 schedule - should show "3 days", "6 days", etc.
   - Test listings with Classic-60 schedule - should show "7 days", "14 days", etc.
   - Verify edge cases work correctly:
     - 0 days until next drop = "Any moment now..."
     - 1 day until next drop = "1 day"
     - Expired listings = no price drop tag

3. **Cross-browser Testing**:
   - Test in Chrome, Firefox, and Safari
   - Verify responsive design works on mobile devices

## Files Modified
- `app/(dashboard)/listings/page.tsx` - Updated status badge logic and price drop calculations
- `requirements/remove-available-tag-fix-price-drop-tags.txt` - Added requirements documentation
- `pr-templates/remove-available-tag-fix-price-drop-tags.md` - Added PR template

## Breaking Changes
None - all changes maintain backward compatibility with existing data.

## Performance Impact
Minimal - updated calculations are more efficient and accurate. 