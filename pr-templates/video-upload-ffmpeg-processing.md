## Changelog

- Added comprehensive video upload system with FFmpeg processing
  - Created Video model in Prisma schema with metadata tracking
  - Implemented video upload validation (.mp4/.mov, max 250MB)
  - Added S3 presigned URL generation for secure video uploads
  - Created FFmpeg processing pipeline for video compression and frame extraction
  - Integrated CloudFront CDN for video content delivery

- Video Processing Features
  - Video compression to ~720p H.264 with CRF 28
  - Thumbnail generation at 3 seconds
  - AI frame extraction at 0%, 10%, 25%, 50%, 90% of video duration
  - Background processing with status tracking
  - Automatic cleanup of temporary files

- API Endpoints
  - `/api/upload/video/presigned-url` - Generate upload URLs
  - `/api/upload/video/process` - Trigger FFmpeg processing
  - `/api/upload/video/status/[videoId]` - Check processing status

- Frontend Integration
  - Created VideoUpload React component with drag-and-drop
  - Real-time upload progress and processing status
  - Integration with existing AI analysis workflow
  - Video frame URLs included in AI analysis phase 1

- Database Schema Updates
  - Added Video model with processing status tracking
  - Video metadata storage (duration, resolution, file paths)
  - Integration with existing Listing model

---

## Testing Instructions

1. **Environment Setup**
   - Ensure FFmpeg is installed on the server: `ffmpeg -version`
   - Verify AWS S3 and CloudFront configuration
   - Check environment variables: `CLOUDFRONT_DOMAIN`, `S3_BUCKET`

2. **Video Upload Testing**
   - Navigate to listing creation page
   - Test video upload with .mp4 and .mov files
   - Verify file size validation (max 250MB)
   - Test drag-and-drop and file picker functionality

3. **Processing Pipeline Testing**
   - Upload a video and monitor processing status
   - Check S3 for processed files in `processed/` prefix
   - Verify thumbnail generation and frame extraction
   - Test error handling with invalid video files

4. **AI Integration Testing**
   - Verify video frames are included in AI analysis
   - Check that frame URLs are passed to AI service
   - Test comprehensive listing generation with video data

5. **Performance Testing**
   - Test with various video sizes and formats
   - Monitor processing time for different video lengths
   - Verify CloudFront delivery of processed videos

6. **Error Handling**
   - Test with corrupted video files
   - Verify proper error messages and status updates
   - Test network interruption during upload

## Dependencies Added
- No new npm dependencies (uses existing AWS SDK)
- Requires FFmpeg installation on server
- CloudFront distribution for video delivery

## Security Considerations
- File type and size validation
- User authentication for all endpoints
- Secure S3 presigned URLs with expiration
- No direct S3 access from frontend 