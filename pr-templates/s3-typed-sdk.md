## Changelog

- Added comprehensive typed S3 image storage SDK
  - Created singleton S3Client with environment-based configuration
  - Implemented ImagePrefix enum for type-safe folder management
  - Added pre-signed URL generation with configurable expiration
  - Implemented file validation with per-prefix lifecycle rules
  - Added batch delete operations with pagination support
  - Integrated CloudFront URL generation for public access
- Added comprehensive lifecycle rules:
  - Raw images: 50MB max, 7 days retention
  - Staged images: 10MB max, 30 days retention
  - Thumbnails: 2MB max, 1 year retention
  - Bundles: 5MB max, 1 year retention
  - QR codes: 1MB max, 1 year retention (PNG only)
  - Temp files: 25MB max, 1 day retention
  - Archive: 100MB max, 5 years retention
- Added typed interfaces and validation:
  - PreSignOptions interface for upload configuration
  - UploadUrlResponse interface for API responses
  - LifecycleRule interface for prefix constraints
  - Environment variable validation with clear error messages
- Added comprehensive testing:
  - Unit tests with Vitest and mocked AWS SDK
  - Test coverage for all public functions
  - Environment variable testing
  - Error condition testing
  - Batch operation testing

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Set up environment variables in your `.env` file:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   S3_BUCKET=consigncrew-images
   CF_DOMAIN=cdn.consigncrew.com
   ```
4. Run the test suite:
   ```bash
   npm test
   ```
5. Verify TypeScript compilation:
   ```bash
   npm run build
   ```
6. Test the SDK functionality:
   ```typescript
   import { getUploadUrl, ImagePrefix, deleteAll, getPublicUrl } from '@/src/aws/imageStore';
   
   // Generate upload URL
   const { url, key } = await getUploadUrl({
     prefix: ImagePrefix.Raw,
     itemId: "TX-9F3K8",
     ext: "jpg",
     contentType: "image/jpeg"
   });
   
   // Get public URL
   const publicUrl = getPublicUrl(key);
   
   // Delete all images for an item
   await deleteAll("TX-9F3K8");
   ```
7. Test file validation:
   - Try uploading files with invalid content types
   - Test files exceeding size limits
   - Verify error messages are descriptive
8. Test batch operations:
   - Create multiple images for an item
   - Test deleteAll functionality
   - Verify pagination works for large numbers of objects
9. Test environment validation:
   - Remove required environment variables
   - Verify clear error messages
10. Test CloudFront integration:
    - Verify public URLs are generated correctly
    - Test staged URL convenience method 