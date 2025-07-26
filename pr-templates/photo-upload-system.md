## Changelog

- Implemented comprehensive photo upload system for list item page
  - Added mandatory photo requirements (minimum 2 photos)
  - Created step-by-step photo upload flow with specific instructions
  - Added progress indicator showing completed photo types
  - Implemented photo gallery with removal/replacement functionality
  - Updated form validation to require hero and back photos
- Added detailed shooting guidance for each photo type:
  - Photo #1: Front-On Hero (required)
  - Photo #2: Full Back/Underside (required)
  - Photo #3: Proof/Identification (optional)
  - Photos #4-10: Additional photos (optional)
- Enhanced user experience with clear instructions and visual feedback
- Added skip option for additional photos to streamline workflow

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to `/list-item` in the browser.
5. Test the photo upload flow:
   - Verify Photo #1 (Hero) instructions and upload
   - Verify Photo #2 (Back) instructions and upload
   - Verify Photo #3 (Proof) instructions and upload
   - Test additional photos upload (optional)
6. Test form validation:
   - Try to submit without required photos (should be blocked)
   - Submit with only hero and back photos (should work)
   - Submit with all photo types (should work)
7. Test photo management in form:
   - Verify photo gallery displays all uploaded photos
   - Test photo removal functionality
   - Test "Add More Photos" button
8. Test responsive design on mobile and desktop.
9. Verify all photo types are properly stored in form data. 