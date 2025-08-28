## Changelog

- Completely rebuilt VideoPlayer component from scratch
  - Enhanced error handling with comprehensive retry logic
    - Automatic retry with exponential backoff (up to 3 attempts)
    - Manual retry mechanism for failed videos
    - Detailed error messaging based on MediaError codes
  - Improved video source validation
    - Validates video URLs against expected patterns
    - Prevents loading of image files as videos
    - Checks for valid video file extensions
  - Better user experience features
    - **Click-to-load functionality** - Videos only load when user clicks (saves bandwidth)
    - **Default muted playback** - Videos start muted for better UX
    - **Poster image support** - Shows thumbnail before video loads
    - Seamless loading states with spinner animation
    - Keyboard controls (Space, M, F, R keys)
    - Responsive design with proper aspect ratio handling
    - Accessibility improvements with ARIA labels
  - Enhanced custom controls
    - Volume slider with visual feedback
    - Improved progress bar with hover effects
    - Better visual styling with TreasureHub branding colors
    - Fullscreen support with proper focus management
  - Robust video processing integration
    - Reprocess button for failed videos
    - CloudFront URL validation and handling
    - Status tracking and metadata display
  - Performance optimizations
    - Memoized event handlers to prevent unnecessary re-renders
    - Proper cleanup of event listeners
    - Efficient state management for video playback
- Reorganized listing page layout for better visual hierarchy
  - **Moved video to top of right column** - Video is now the hero element
  - **Moved QR code below video** - Better logical grouping
  - **Moved title and categories below image carousel** - Better flow and information hierarchy
  - **Enhanced title styling** - Larger font and better brand display

---

## Testing Instructions

1. Pull this branch and run `npm install` if any dependencies were updated.
2. Start the development server with `npm run dev`.
3. Navigate to a listing page that has a video (e.g., `/list-item/EMI8Q1`).
4. Test the following video functionality:
   - **Click-to-load**: Video should show a poster/preview with "Click to load video" until clicked
   - **Initial loading**: After clicking, video should load with a loading spinner
   - **Default muted**: Video should start muted when it begins playing
   - **Error handling**: If video fails to load, should show error message with retry options
   - **Playback controls**: 
     - Click play/pause button or press Space key
     - Use volume controls and press M to mute/unmute
     - Click and drag progress bar to seek
     - Press F for fullscreen mode
     - Press R to restart video
   - **Raw video fallback**: Should now use raw video file instead of trying to process
   - **Retry mechanism**: If video fails, test both "Retry" and "Reprocess Video" buttons
   - **Responsive design**: Test on different screen sizes and orientations
   - **Accessibility**: Test keyboard navigation (Tab, Enter, Space)
5. Check browser console for any errors or warnings related to video playback.
6. Test with both working and broken video URLs to verify error handling.
7. Verify that videos play correctly in both custom controls and native controls mode.
8. Test accessibility by navigating with keyboard only (Tab, Space, Enter).
9. **Test new layout organization**:
   - Video should appear at top of right column in iPhone format (9:16 aspect ratio)
   - QR code should appear below video in right column
   - Title and categories should appear below image carousel in left column
   - Layout should be responsive and visually hierarchical

## Technical Details

### New Features Added
- **Automatic retry logic**: Videos that fail to load will automatically retry up to 3 times with exponential backoff
- **Enhanced error messaging**: Specific error messages based on MediaError codes and video source context
- **Video source validation**: Prevents common issues by validating URLs before attempting to load
- **Keyboard controls**: Standard video player keyboard shortcuts for better accessibility
- **Visual improvements**: Loading animations, hover effects, and better visual feedback

### Error Handling Improvements
- **Network errors**: Automatically retries on network failures
- **Format errors**: Clear messaging when video format is unsupported
- **Processing errors**: Integration with video reprocessing API for server-side failures
- **Validation errors**: Prevents loading of invalid video sources

### Performance Enhancements
- **Efficient re-renders**: Memoized callbacks and proper dependency management
- **Memory management**: Proper cleanup of event listeners and timeouts
- **Loading optimization**: Progressive loading with metadata preload

### Browser Compatibility
- Uses standard HTML5 video API for maximum compatibility
- Fallback messaging for browsers without video support
- Responsive design works across all modern browsers
- Touch-friendly controls for mobile devices
