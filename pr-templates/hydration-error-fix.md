## Changelog

- Fixed hydration errors in listings page
  - Added client-side rendering control with `isClient` state
  - Modified `getTimeUntilNextDrop()` function to prevent server/client mismatches
  - Replaced random price drop logic with deterministic approach based on listing ID
  - Added periodic time calculation updates (every minute)
  - Wrapped dynamic content in client-side rendering checks
- Updated component imports to include `useEffect`
- Added state management for hydration control

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/listings` in the browser.
5. Check browser console for hydration errors - should be none.
6. Verify dynamic content (time badges, price drop badges) appears after initial page load.
7. Test page refresh to ensure consistent rendering.
8. Confirm time calculations update correctly over time.
9. Check that all badges display consistently across different listings. 