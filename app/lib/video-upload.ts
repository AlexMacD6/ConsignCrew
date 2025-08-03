import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 Bucket Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'consigncrew';
// Use existing CloudFront configuration
function getCloudFrontDomain(): string {
  const cfDomain = process.env.NEXT_PUBLIC_CDN_URL || process.env.CF_DOMAIN;
  if (!cfDomain) {
    // Fallback to S3 URL if CloudFront not configured
    const bucketName = process.env.S3_BUCKET || 'treasurehub-assets';
    const region = process.env.AWS_REGION || 'us-east-1';
    return `${bucketName}.s3.${region}.amazonaws.com`;
  }
  return cfDomain;
}

// Video upload configuration
const MAX_VIDEO_SIZE = 250 * 1024 * 1024; // 250 MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']; // .mp4 and .mov
const ALLOWED_EXTENSIONS = ['.mp4', '.mov'];

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      isValid: false,
      error: `Video file size must be less than 250 MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };
  }

  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Only .mp4 and .mov video files are supported. Received: ${file.type}`
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Only .mp4 and .mov video files are supported. Received: ${extension}`
    };
  }

  return { isValid: true };
}

/**
 * Generate a pre-signed URL for uploading a video to S3
 */
export async function generateVideoUploadUrl(
  fileName: string,
  contentType: string,
  userId: string,
  videoId: string
): Promise<{ presignedUrl: string; fileKey: string }> {
  // Create a unique file key for raw video storage
  const timestamp = Date.now();
  const fileKey = `raw/videos/${userId}/${videoId}/${timestamp}-${fileName}`;

  // Create the PutObject command
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    // Set metadata for tracking
    Metadata: {
      userId,
      videoId,
      uploadedAt: new Date().toISOString(),
      originalName: fileName,
      fileSize: '0', // Will be updated after upload
    },
  });

  // Generate pre-signed URL (valid for 15 minutes)
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  return { presignedUrl, fileKey };
}

/**
 * Get CloudFront URL for a video file
 */
export function getVideoPublicUrl(key: string): string {
  const cfDomain = getCloudFrontDomain();
  // If the domain already includes protocol, use it as is
  if (cfDomain.startsWith('http://') || cfDomain.startsWith('https://')) {
    return `${cfDomain}/${key}`;
  }
  return `https://${cfDomain}/${key}`;
}

/**
 * Get CloudFront URL for processed video
 */
export function getProcessedVideoUrl(videoId: string): string {
  const cfDomain = getCloudFrontDomain();
  // If the domain already includes protocol, use it as is
  if (cfDomain.startsWith('http://') || cfDomain.startsWith('https://')) {
    return `${cfDomain}/processed/videos/${videoId}.mp4`;
  }
  return `https://${cfDomain}/processed/videos/${videoId}.mp4`;
}

/**
 * Get CloudFront URL for video thumbnail
 */
export function getVideoThumbnailUrl(videoId: string): string {
  const cfDomain = getCloudFrontDomain();
  // If the domain already includes protocol, use it as is
  if (cfDomain.startsWith('http://') || cfDomain.startsWith('https://')) {
    return `${cfDomain}/processed/thumbnails/${videoId}.jpg`;
  }
  return `https://${cfDomain}/processed/thumbnails/${videoId}.jpg`;
}

/**
 * Get CloudFront URL for AI frame
 */
export function getVideoFrameUrl(videoId: string, frameIndex: number): string {
  const cfDomain = getCloudFrontDomain();
  const frameNumber = (frameIndex + 1).toString().padStart(2, '0');
  // If the domain already includes protocol, use it as is
  if (cfDomain.startsWith('http://') || cfDomain.startsWith('https://')) {
    return `${cfDomain}/processed/frames/${videoId}/frame_${frameNumber}.jpg`;
  }
  return `https://${cfDomain}/processed/frames/${videoId}/frame_${frameNumber}.jpg`;
}

/**
 * Delete a video file from S3
 */
export async function deleteVideoFile(fileKey: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    
    await s3Client.send(command);
    console.log(`Deleted video file: ${fileKey}`);
  } catch (error) {
    console.error(`Error deleting video file ${fileKey}:`, error);
    throw error;
  }
}

/**
 * Get video file metadata from S3
 */
export async function getVideoMetadata(fileKey: string): Promise<{
  contentLength: number;
  lastModified: Date;
  metadata: Record<string, string>;
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    
    const response = await s3Client.send(command);
    
    return {
      contentLength: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    };
  } catch (error) {
    console.error(`Error getting video metadata for ${fileKey}:`, error);
    throw error;
  }
}

/**
 * Generate file keys for processed video components
 */
export function generateProcessedVideoKeys(videoId: string): {
  processedVideoKey: string;
  thumbnailKey: string;
  frameKeys: string[];
} {
  const processedVideoKey = `processed/videos/${videoId}.mp4`;
  const thumbnailKey = `processed/thumbnails/${videoId}.jpg`;
  const frameKeys = [
    `processed/frames/${videoId}/frame_01.jpg`, // 0%
    `processed/frames/${videoId}/frame_02.jpg`, // 10%
    `processed/frames/${videoId}/frame_03.jpg`, // 25%
    `processed/frames/${videoId}/frame_04.jpg`, // 50%
    `processed/frames/${videoId}/frame_05.jpg`, // 90%
  ];

  return {
    processedVideoKey,
    thumbnailKey,
    frameKeys,
  };
} 