## Changelog

- Enhanced Facebook Pixel ViewContent debugging
  - Added comprehensive logging to `meta-pixel-client.ts` for client-side tracking
  - Added debugging to `MetaPixelScript.tsx` to verify pixel initialization
  - Enhanced ViewContent tracking in product detail page with detailed logging
  - Created `/api/meta/test-pixel` endpoint for configuration testing
  - Added error handling and detailed error messages throughout tracking flow

### Files Updated
- `app/lib/meta-pixel-client.ts` - Enhanced logging and error handling
- `app/components/MetaPixelScript.tsx` - Added initialization debugging
- `app/(dashboard)/list-item/[id]/page.tsx` - Enhanced ViewContent tracking logging
- `app/api/meta/test-pixel/route.ts` - New test endpoint for debugging

### Debugging Features Added
- **Client-side Logging**: Track when fbq is available and events are sent
- **Server-side Logging**: Monitor conversion API responses and errors
- **Configuration Testing**: Verify environment variables are set correctly
- **Event Data Validation**: Log the exact data being sent to Meta
- **Error Isolation**: Separate client-side and server-side error handling

---

## Testing Instructions

1. Pull this branch and start the development server.
2. Open browser developer tools and go to the Console tab.
3. Navigate to a product detail page (`/list-item/[id]`).
4. Check console logs for Meta Pixel debugging information:
   - "Meta Pixel: Initializing with ID: ..."
   - "Meta Pixel: Script loading..."
   - "Meta Pixel: Initialized with ID: ..."
   - "ViewContent: Starting tracking for listing: ..."
   - "Meta Pixel: Client-side tracking ViewContent"
   - "Meta Pixel: Client-side ViewContent tracked successfully"

5. Test the configuration endpoint:
   - Visit `/api/meta/test-pixel` in browser
   - Verify both pixel ID and access token are configured

6. Test manual event sending:
   - Use browser console: `fetch('/api/meta/test-pixel', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({event_name: 'ViewContent', custom_data: {content_name: 'Test Product'}})})`
   - Check response for any errors

7. Check Facebook Events Manager:
   - Verify ViewContent events are appearing
   - Check for any error messages or warnings

## Expected Debug Output

### Successful Tracking
```
Meta Pixel: Initializing with ID: 123456789012345
Meta Pixel: Script loading...
Meta Pixel: Script loaded, initializing...
Meta Pixel: Initialized with ID: 123456789012345
Meta Pixel: PageView tracked
ViewContent: Starting tracking for listing: Product Name
ViewContent: Data prepared: {content_name: "Product Name", ...}
Meta Pixel: Attempting to track ViewContent
Meta Pixel: Client-side tracking ViewContent
Meta Pixel: Client-side ViewContent tracked successfully
Meta Pixel: Attempting server-side fallback for ViewContent
Meta Pixel: Server-side ViewContent tracked successfully
```

### Common Issues to Look For
- **Missing Pixel ID**: "Meta Pixel ID not configured. Skipping Meta Pixel script."
- **Script Loading Issues**: No "Meta Pixel: Script loaded" message
- **Client-side Failures**: "Meta Pixel: Client-side tracking not available"
- **Server-side Errors**: "Meta Pixel: Server-side ViewContent failed"
- **Data Issues**: Missing or invalid product data in logs

## Troubleshooting Steps

1. **Check Environment Variables**:
   - Verify `NEXT_PUBLIC_META_PIXEL_ID` is set in `.env.local`
   - Verify `META_ACCESS_TOKEN` is set in `.env.local`

2. **Check Browser Console**:
   - Look for JavaScript errors that might prevent tracking
   - Check for ad blocker interference
   - Verify Facebook Pixel script loads in Network tab

3. **Test Configuration**:
   - Visit `/api/meta/test-pixel` to verify setup
   - Check if tokens are valid and not expired

4. **Check Facebook Events Manager**:
   - Verify events are being received
   - Check for any data quality warnings
   - Ensure pixel is properly configured in Facebook

## Notes

- Debug logging will help identify exactly where the tracking is failing
- The test endpoint provides a way to verify configuration without page navigation
- Enhanced error messages will make it easier to diagnose specific issues
- All logging can be removed once the issue is resolved 