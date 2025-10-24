# Photo Gallery Feature

## Changelog

### Database Schema
- Added new `PhotoGallery` model to store user's photo library
  - Fields: userId, s3Key, url, thumbnailUrl, originalFilename, fileSize, mimeType, width, height, status, listingId, createdAt, updatedAt
  - Status tracking: "available" (not yet used), "listed" (used in a listing), "deleted"
  - Indexes on userId, status, listingId, and createdAt for efficient querying
  - Relations to User and Listing models
- Added `photoGallery` relation to User model
- Added `galleryPhotos` relation to Listing model

### Backend API Routes
- Created `/api/photo-gallery` route
  - GET: Fetch user's photos with optional status filter (available, listed, all)
  - POST: Upload new photos to gallery with S3 storage
  - Security: User authentication required, photos filtered by user ID
  
- Created `/api/photo-gallery/[photoId]` route
  - DELETE: Remove photo from gallery (prevents deletion of photos in use)
  - PATCH: Update photo status (e.g., when used in a listing)
  - Security: Verifies photo ownership before any operations

### S3 Folder Structure
- New folder: `photo-gallery/{userId}/` for storing gallery photos
- Organized by user ID to prevent conflicts and enable easy management
- Photos timestamped and sanitized to prevent naming conflicts

### Frontend Components
- Created `PhotoGalleryModal` component
  - Tabbed filtering: Available, Previously Listed, All Photos
  - Grid layout with photo thumbnails
  - Multi-select capability with visual feedback
  - Upload directly to gallery from modal
  - Bulk upload support (multiple files at once)
  - Delete photos from gallery (only available photos)
  - Drag-and-drop file upload area
  - Loading states and error handling
  - Maximum selection limit support
  - Select All and Clear Selection functions

### UI Changes  
- Replaced "Single Photo Upload" option with "Photo Gallery" button
- Photo Gallery button opens modal to select from previously uploaded photos
- Selected photos integrate seamlessly with existing bulk upload flow
- Position-based categorization applies to gallery photos:
  - 1st photo = Hero
  - 2nd photo = Back
  - 3rd photo = Proof
  - 4th+ photos = Additional

### Features
- **Photo Filtering**: Users can filter by available vs previously listed photos
- **Visual Distinction**: Photos already in use show "In Use" badge and are grayed out
- **Smart Selection**: Prevents selection of photos already used in listings
- **Photo Management**: Upload and delete photos directly from gallery
- **User Isolation**: Users only see their own photos (security enforced at API level)
- **Bulk Operations**: Upload multiple photos to gallery at once
- **Integration**: Gallery photos work identically to newly uploaded photos

### Security
- Authentication required on all endpoints
- Photos filtered by logged-in user's ID  
- Ownership verification before delete/update operations
- Cannot delete photos currently used in listings
- S3 uploads isolated by user ID

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Run database migration: `npx prisma migrate dev --name add-photo-gallery`
3. Ensure AWS S3 credentials are configured in `.env`
4. Restart dev server

### Test Photo Gallery Upload
1. Navigate to `/list-item`
2. Proceed to photo upload step
3. Click "Photo Gallery" button
4. Click "Upload Photos to Gallery" in the modal
5. Select multiple photos and upload
6. Verify photos appear in the "Available" tab
7. Verify photo count badges update correctly

### Test Photo Selection
1. In the Photo Gallery modal, click photos to select them
2. Verify selection checkmark appears on selected photos
3. Click "Use Selected Photos" button
4. Verify modal closes and selected photos appear in the bulk upload grid
5. Verify photos are categorized by position (Hero, Back, Proof, Additional)
6. Verify drag-and-drop reordering works on selected photos

### Test Filtering
1. Open Photo Gallery modal
2. Switch between "Available", "Previously Listed", and "All Photos" tabs
3. Verify photos filter correctly
4. Verify count badges show correct numbers for each category

### Test Photo Deletion
1. In Photo Gallery modal, hover over an available photo
2. Click the trash icon
3. Confirm deletion
4. Verify photo is removed from gallery
5. Verify you cannot delete photos marked as "In Use"

### Test Security
1. Create a listing using gallery photos
2. Verify those photos now show as "Previously Listed"
3. Verify you cannot delete photos that are "In Use"
4. Log in as different user
5. Verify you only see your own photos in the gallery

### Test Integration with Listing Creation
1. Select photos from gallery
2. Complete the listing creation flow
3. Verify photos upload correctly to S3
4. Verify listing displays photos correctly
5. Go back to Photo Gallery
6. Verify used photos now show as "Previously Listed" with "In Use" badge

### Edge Cases
1. Try uploading non-image files (should be rejected)
2. Try uploading very large files >10MB (should be rejected)
3. Try selecting more photos than allowed (if maxSelect is set)
4. Try deleting photos while they're in use (should be prevented)
5. Test with poor network connection (verify loading states)



