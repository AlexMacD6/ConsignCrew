# Video Upload Feature with FFmpeg Processing

This document describes the comprehensive video upload system that allows users to upload video files, processes them with FFmpeg for compression and frame extraction, and integrates the extracted frames into the AI analysis workflow.

## Features

- **Video Upload**: Support for .mp4 and .mov files up to 250 MB
- **FFmpeg Processing**: Automatic video compression, thumbnail generation, and frame extraction
- **AI Integration**: Extracted frames are fed into the AI vision analysis
- **CloudFront Delivery**: All video content served through CDN
- **Real-time Status**: Progress tracking for upload and processing
- **Secure Uploads**: S3 presigned URLs for direct upload

## Architecture

### Storage Structure
```
S3 Bucket/
├── raw/videos/{userId}/{videoId}/          # Original uploads
├── processed/videos/{videoId}.mp4          # Compressed videos
├── processed/thumbnails/{videoId}.jpg      # Video thumbnails
└── processed/frames/{videoId}_frame_{n}.jpg # AI analysis frames
```

### Processing Pipeline
1. **Upload**: User uploads video via presigned URL
2. **Processing**: FFmpeg compresses video and extracts frames
3. **Storage**: Processed files uploaded to S3
4. **Analysis**: Frame URLs passed to AI service
5. **Delivery**: Content served via CloudFront

## Setup Requirements

### 1. FFmpeg Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### 2. Environment Variables

Add to your `.env` file:
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-bucket-name

# CloudFront Configuration
CLOUDFRONT_DOMAIN=cdn.yourdomain.com
```

### 3. S3 Bucket Setup

Ensure your S3 bucket has the following CORS configuration:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

### 4. CloudFront Distribution

Create a CloudFront distribution pointing to your S3 bucket with:
- Origin access control enabled
- Cache behaviors for video files
- Custom domain (optional)

## API Endpoints

### 1. Generate Upload URL
```http
POST /api/upload/video/presigned-url
Content-Type: application/json

{
  "fileName": "video.mp4",
  "contentType": "video/mp4",
  "fileSize": 10485760
}
```

### 2. Process Video
```http
POST /api/upload/video/process
Content-Type: application/json

{
  "videoId": "video_123"
}
```

### 3. Check Status
```http
GET /api/upload/video/status/{videoId}
```

## Frontend Integration

### Basic Usage

```tsx
import VideoUpload from '@/components/VideoUpload';

function ListingForm() {
  const handleVideoUploaded = (videoData) => {
    // Store video data in form state
    setFormData(prev => ({
      ...prev,
      video: videoData
    }));
  };

  const handleVideoError = (error) => {
    console.error('Video upload failed:', error);
  };

  return (
    <VideoUpload
      onVideoUploaded={handleVideoUploaded}
      onError={handleVideoError}
    />
  );
}
```

### AI Analysis Integration

```tsx
// Pass video frames to AI analysis
const aiInput = {
  photos: photoUrls,
  video: {
    videoId: videoData.videoId,
    frameUrls: videoData.frameUrls,
    thumbnailUrl: videoData.thumbnailUrl,
    duration: videoData.duration
  },
  // ... other form data
};

const listingData = await generateComprehensiveListing(aiInput);
```

## Processing Details

### Video Compression
- **Codec**: H.264
- **Quality**: CRF 28 (good quality, reasonable file size)
- **Resolution**: Target ~720p
- **Audio**: AAC, 128kbps
- **Optimization**: Fast start for web streaming

### Frame Extraction
Extracts 5 frames at specific time percentages:
- 0% (start of video)
- 10% (early content)
- 25% (quarter point)
- 50% (middle)
- 90% (near end)

### Thumbnail Generation
- Extracted at 3 seconds into the video
- High quality JPEG format
- Used for video previews

## Error Handling

The system handles various error scenarios:
- Invalid file types or sizes
- FFmpeg processing failures
- S3 upload/download errors
- Network interruptions
- Authentication failures

## Performance Considerations

### Processing Time
- Small videos (< 50MB): ~30-60 seconds
- Medium videos (50-150MB): ~1-3 minutes
- Large videos (150-250MB): ~3-5 minutes

### Storage Optimization
- Raw files are kept temporarily during processing
- Automatic cleanup of temporary files
- Compressed videos are ~60-80% smaller than originals

### CDN Benefits
- Global content delivery
- Reduced bandwidth costs
- Improved user experience
- Automatic caching

## Security

- File type validation (server-side)
- File size limits
- User authentication required
- Presigned URLs with expiration
- No direct S3 access from frontend

## Monitoring

### Logs to Monitor
- Video upload requests
- FFmpeg processing status
- S3 upload/download operations
- Processing errors and failures

### Metrics to Track
- Upload success rate
- Processing time
- Error rates by file type/size
- Storage usage

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in PATH
   - Test with: `ffmpeg -version`

2. **S3 upload failures**
   - Check AWS credentials
   - Verify bucket permissions
   - Check CORS configuration

3. **Processing timeouts**
   - Monitor server resources
   - Consider increasing timeout limits
   - Check FFmpeg performance

4. **CloudFront not serving content**
   - Verify distribution configuration
   - Check cache invalidation
   - Test direct S3 access

### Debug Mode

Enable detailed logging by setting:
```env
DEBUG_VIDEO_PROCESSING=true
```

## Future Enhancements

- Video format conversion (WebM, AV1)
- Adaptive bitrate streaming
- Video editing capabilities
- Advanced frame analysis
- Batch processing support 