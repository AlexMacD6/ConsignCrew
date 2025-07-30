## Changelog

- Added AWS S3 integration for secure photo uploads
  - Implemented pre-signed URL generation for secure uploads
  - Created S3 client configuration with proper credentials management
  - Added file validation (type and size) before upload
  - Implemented direct S3 upload using pre-signed URLs
- Added photo upload utilities:
  - `uploadPhotoToS3()` function for single photo uploads
  - `uploadMultiplePhotosToS3()` function for batch uploads
  - `compressImage()` function for optional image optimization
  - `fileToBase64()` function for preview fallback
- Added API endpoint for pre-signed URL generation:
  - `/api/upload/presigned-url` with authentication and validation
  - Secure handling of AWS credentials (not exposed to frontend)
  - File type and size validation
- Added comprehensive error handling and validation:
  - File type validation (JPEG, PNG, WebP only)
  - File size limits (10MB maximum)
  - Upload error handling and retry logic
  - Authentication and authorization checks

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Set up AWS environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=treasurehub-photos
   ```
4. Create S3 bucket with proper CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "POST", "GET"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```
5. Start the application with `npm run dev`.
6. Navigate to `/list-item` in the browser.
7. Test S3 photo upload functionality:
   - Upload photos and verify they are stored in S3
   - Check that pre-signed URLs are generated correctly
   - Verify file validation works (try invalid file types/sizes)
   - Test upload error handling
8. Test security:
   - Verify AWS credentials are not exposed in frontend
   - Check that only authenticated users can upload
   - Verify pre-signed URLs expire correctly
9. Test performance:
   - Upload multiple photos simultaneously
   - Test with large files (near 10MB limit)
   - Verify upload progress indicators work
10. Test error scenarios:
    - Network failures during upload
    - Invalid file types
    - Files exceeding size limits
    - Unauthorized access attempts
11. Verify S3 bucket organization:
    - Check file structure: `/uploads/{userId}/{photoType}/{timestamp}-{filename}`
    - Verify metadata is stored correctly
    - Confirm files are accessible via generated URLs 