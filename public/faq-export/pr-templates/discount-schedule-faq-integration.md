## Changelog

### FAQ Page Enhancements
- Added new "Pricing & Discounts" category to FAQ page
  - Included comprehensive Turbo-30 and Classic-60 discount schedule tables
  - Added detailed explanations of how automatic discount schedules work
  - Included information about reserve prices and opt-out options
  - Formatted tables with responsive design and proper styling

### Discount Schedule Methodology Updates
- Updated discount schedule calculations to match tooltip methodology
  - Changed from hourly intervals to day-based schedules
  - Turbo-30: Price drops every 3 days with specific percentage reductions
  - Classic-60: Price drops every 7 days with specific percentage reductions
  - Updated calculation functions to use day-based logic instead of hourly intervals

### Technical Improvements
- Fixed Prisma query for discount schedule filtering
- Updated price drop API to use new calculation methodology
- Maintained backward compatibility with existing listing data
- Improved accuracy of next drop price calculations

### Schedule Details Added
- **Turbo-30 (30-Day)**: Drops every 3 days from 100% to 60%, then expires
- **Classic-60 (60-Day)**: Drops every 7 days from 100% to 50%, then expires
- Both schedules respect reserve price minimums
- Clear documentation of all drop intervals and percentages

---

## Testing Instructions

1. **FAQ Page Testing**:
   - Navigate to `/faq` and verify new "Pricing & Discounts" section appears
   - Check that Turbo-30 and Classic-60 tables display correctly with all data
   - Verify tables are responsive and properly formatted
   - Test search functionality to ensure new FAQ items are searchable

2. **Discount Schedule Calculations**:
   - Create a new listing with Turbo-30 schedule and verify calculations
   - Create a new listing with Classic-60 schedule and verify calculations
   - Check that price drop counter shows correct "days" instead of "hours"
   - Verify that next drop prices are calculated correctly

3. **Existing Listings**:
   - Test that existing listings with discount schedules continue to work
   - Verify that price drop API returns correct information
   - Check that listing detail pages show accurate discount information

4. **Cross-browser Testing**:
   - Test FAQ tables display correctly in Chrome, Firefox, and Safari
   - Verify responsive design works on mobile devices

## Files Modified
- `app/faq/faq-data.tsx` - Added new FAQ category with detailed discount schedules
- `app/lib/discount-schedule.ts` - Updated calculation methodology to match tooltip
- `app/api/listings/[id]/next-price-drop/route.ts` - Updated API calculations
- `requirements/discount-schedule-faq-integration.txt` - Added requirements documentation
- `pr-templates/discount-schedule-faq-integration.md` - Added PR template

## Breaking Changes
None - all changes maintain backward compatibility with existing data.

## Performance Impact
Minimal - updated calculations are more efficient and accurate. 