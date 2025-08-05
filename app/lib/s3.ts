import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 Bucket Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'consigncrew';
const BUCKET_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Generate a pre-signed URL for uploading a photo to S3
 * @param fileName - The name of the file to upload
 * @param contentType - The MIME type of the file
 * @param userId - The ID of the user uploading the photo
 * @returns Promise<string> - The pre-signed URL
 */
export async function generatePresignedUrl(
  fileName: string,
  contentType: string,
  userId: string
): Promise<string> {
  // Create a unique file key with user ID and timestamp
  const timestamp = Date.now();
  const fileKey = `uploads/${userId}/${timestamp}-${fileName}`;

  // Create the PutObject command
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    // Set metadata for tracking
    Metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
      originalName: fileName,
    },
  });

  // Generate pre-signed URL (valid for 15 minutes)
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  return presignedUrl;
}

/**
 * Get the S3 URL for a photo after upload
 * @param fileKey - The S3 key of the uploaded file
 * @returns string - The public URL of the photo
 */
export function getPhotoUrl(fileKey: string): string {
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fileKey}`;
}

/**
 * Validate file type and size
 * @param file - The file to validate
 * @returns boolean - Whether the file is valid
 */
export function validatePhotoFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please upload images smaller than 10MB.',
    };
  }

  return { isValid: true };
}

/**
 * Generate a unique file key for S3
 * @param originalName - The original file name
 * @param userId - The user ID
 * @param photoType - The type of photo (hero, back, proof, additional)
 * @returns string - The unique file key
 */
export function generateFileKey(
  originalName: string,
  userId: string,
  photoType: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `uploads/${userId}/${photoType}/${timestamp}-${randomId}.${extension}`;
} 