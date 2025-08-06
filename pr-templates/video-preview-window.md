## Changelog

- Added video preview window to list-item screen
  - Created minimized video player with controls
  - Added video duration and frame count display
  - Included video indicator overlay with play icon
  - Positioned after video keyframes section
  - Added proper TypeScript null/undefined handling
- Updated imports
  - Added Play icon from lucide-react
- Enhanced user experience
  - Users can now preview uploaded videos directly in the listing form
  - Video preview shows duration and frame count information
  - Consistent styling with existing photo and keyframe sections

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/list-item` in the browser.
5. Upload a video using the video upload component.
6. Wait for video processing to complete.
7. Verify the video preview window appears after video keyframes section.
8. Test video playback:
   - Click play button to start video
   - Test pause, seek, and volume controls
   - Verify video duration is displayed correctly
   - Check that frame count is shown
9. Test responsive behavior on different screen sizes.
10. Verify video preview only appears when video is uploaded.
11. Check that video controls work properly with different video formats.

## Technical Notes

- Video preview uses HTML5 video element with controls
- Supports MP4 and QuickTime formats
- Includes proper CORS handling with crossOrigin attribute
- Uses preload="metadata" for performance optimization
- Handles null/undefined video URLs gracefully
- Follows existing UI patterns and styling conventions 