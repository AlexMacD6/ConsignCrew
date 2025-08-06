## Changelog

- Added live price drop counter to listing history component
  - Created new API endpoint `/api/listings/[id]/next-price-drop` to fetch price drop information
    - Returns time until next drop, target price, current price, and schedule details
    - Handles both string and object formats for discount schedule data
    - Respects reserve price limits and schedule expiration
  - Created new `PriceDropCounter` component with live countdown timer
    - Shows days, hours, and minutes until next price drop
    - Displays target price after next drop
    - Includes progress bar showing price drop progress
    - Auto-refreshes when countdown reaches zero
    - Only displays when price drops are active
  - Integrated price drop counter into `ListingHistory` component
    - Added at the top of history timeline
    - Consistent visual design with existing history items
    - Red color scheme for urgency with trending down icon
  - Updated database schema with `qualityChecked` field migration
    - Added `qualityChecked Boolean @default(false)` to Listing model
    - Successfully applied migration to database

---

## Testing Instructions

1. Pull this branch and run `npm install` to update dependencies.
2. Start the application with `npm run dev`.
3. Navigate to a listing page that has a discount schedule configured (e.g., `/list-item/8QO3XF`).
4. Scroll down to the "History" section in the right sidebar.
5. Verify the live price drop counter appears at the top of the history timeline.
6. Check that the countdown timer updates every second.
7. Verify the target price and schedule type are displayed correctly.
8. Test with different discount schedules (Turbo-30 vs Classic-60).
9. Test with listings that have reserve prices set.
10. Verify the counter disappears when at reserve price or schedule expires.
11. Test the API endpoint directly: `GET /api/listings/[id]/next-price-drop`

## API Endpoint Details

The new `/api/listings/[id]/next-price-drop` endpoint returns:

```json
{
  "success": true,
  "hasPriceDrop": true,
  "timeUntilNextDrop": "10m",
  "nextDropPrice": 61.43,
  "currentPrice": 100,
  "originalPrice": 100,
  "reservePrice": 60,
  "scheduleType": "Classic-60",
  "nextDropPercentage": 40
}
```

## Files Changed

- `app/api/listings/[id]/next-price-drop/route.ts` (new)
- `app/components/PriceDropCounter.tsx` (new)
- `app/components/ListingHistory.tsx` (modified)
- `prisma/schema.prisma` (modified)
- `requirements/live-price-drop-counter.txt` (new) 