## Changelog

- Fixed Meta Conversion API 500 errors
  - Added environment variable validation for META_ACCESS_TOKEN and NEXT_PUBLIC_META_PIXEL_ID
  - Enhanced error handling with proper status codes (503 for missing config, 400 for invalid requests)
  - Added comprehensive logging for debugging API issues
  - Improved session handling with graceful fallbacks
  - Added detailed error messages for different failure scenarios
- Added robust image handling for DALL-E images
  - Created RobustImage component with fallback and retry logic
  - Added automatic fallback to local images when DALL-E URLs fail
  - Implemented retry mechanism with configurable attempts
  - Added visual indicators for fallback images
  - Handles 403 authentication errors gracefully
- Added error boundary and console filtering
  - Created ErrorBoundary component to catch runtime errors
  - Implemented ConsoleFilter utility to reduce noise from content scripts
  - Added filtering for DALL-E image errors, content script errors, and browser extension errors
  - Integrated error boundaries throughout the application
  - Preserved important errors while filtering non-critical ones

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Set up environment variables for Meta Conversion API:
   ```
   META_ACCESS_TOKEN=your_meta_access_token
   NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
   ```
4. Start the application with `npm run dev`.
5. Test Meta Conversion API:
   - Navigate to any page and check browser console
   - Should see proper error messages if environment variables are missing
   - API calls should work correctly when properly configured
6. Test DALL-E image handling:
   - If any DALL-E images are present, they should load with fallbacks
   - Check browser console for reduced 403 errors
   - Fallback images should display when DALL-E images fail
7. Test error boundaries:
   - Application should not crash on runtime errors
   - Error boundaries should catch and display fallback UI
8. Test console filtering:
   - Content script errors should be filtered out
   - Important application errors should still be visible
   - Console should be cleaner overall

## Environment Variables Required

- `META_ACCESS_TOKEN`: Meta Conversion API access token
- `NEXT_PUBLIC_META_PIXEL_ID`: Meta Pixel ID for tracking

## Notes

- Console filtering is enabled by default in development
- DALL-E image fallbacks use `/cardboard.jpg` as default
- Error boundaries provide graceful degradation for runtime errors
- Meta Conversion API errors are logged for debugging but not filtered 