import { PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './s3Client';

/**
 * Image prefix enum representing the different storage folders
 * All prefixes automatically prepend 'prod/' for future-proofing
 */
export enum ImagePrefix {
  Raw = 'prod/raw',
  Staged = 'prod/staged',
  Thumbs = 'prod/thumbs',
  Bundles = 'prod/bundles',
  QR = 'prod/qr',
  Temp = 'prod/temp',
  Archive = 'prod/archive',
}

/**
 * Options for generating pre-signed upload URLs
 */
export interface PreSignOptions {
  prefix: ImagePrefix;
  itemId: string;
  ext: 'jpg' | 'png';
  contentType: string;
}

/**
 * Response from getUploadUrl containing the pre-signed URL and S3 key
 */
export interface UploadUrlResponse {
  url: string;
  key: string;
}

/**
 * Lifecycle rules and constraints for each image prefix
 */
interface LifecycleRule {
  maxFileSize: number; // in bytes
  maxAge: number; // in seconds
  allowedTypes: string[];
}

const LIFECYCLE_RULES: Record<ImagePrefix, LifecycleRule> = {
  [ImagePrefix.Raw]: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxAge: 7 * 24 * 60 * 60, // 7 days
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  [ImagePrefix.Staged]: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxAge: 30 * 24 * 60 * 60, // 30 days
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  [ImagePrefix.Thumbs]: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxAge: 365 * 24 * 60 * 60, // 1 year
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  [ImagePrefix.Bundles]: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxAge: 365 * 24 * 60 * 60, // 1 year
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  [ImagePrefix.QR]: {
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxAge: 365 * 24 * 60 * 60, // 1 year
    allowedTypes: ['image/png'],
  },
  [ImagePrefix.Temp]: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxAge: 24 * 60 * 60, // 1 day
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  [ImagePrefix.Archive]: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxAge: 5 * 365 * 24 * 60 * 60, // 5 years
    allowedTypes: ['image/jpeg', 'image/png'],
  },
};

/**
 * Get the S3 bucket name from environment variables
 */
function getBucketName(): string {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3_BUCKET environment variable is required');
  }
  return bucketName;
}

/**
 * Get the CloudFront domain from environment variables
 */
function getCloudFrontDomain(): string {
  const cfDomain = process.env.NEXT_PUBLIC_CDN_URL || process.env.CF_DOMAIN;
  if (!cfDomain) {
    // Fallback to S3 URL if CloudFront not configured
    const bucketName = getBucketName();
    const region = process.env.AWS_REGION || 'us-east-1';
    return `${bucketName}.s3.${region}.amazonaws.com`;
  }
  return cfDomain;
}

/**
 * Generate a unique S3 key for the given options
 */
function generateS3Key(options: PreSignOptions): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${options.prefix}/${options.itemId}/${timestamp}-${randomId}.${options.ext}`;
}

/**
 * Validate upload options against lifecycle rules
 */
function validateUploadOptions(options: PreSignOptions, fileSize?: number): void {
  const rule = LIFECYCLE_RULES[options.prefix];
  
  if (!rule.allowedTypes.includes(options.contentType)) {
    throw new Error(`Content type ${options.contentType} not allowed for prefix ${options.prefix}`);
  }
  
  if (fileSize && fileSize > rule.maxFileSize) {
    throw new Error(`File size ${fileSize} exceeds maximum ${rule.maxFileSize} for prefix ${options.prefix}`);
  }
}

/**
 * Generate a pre-signed URL for uploading an image to S3
 * 
 * @example
 * ```typescript
 * // 1. Seller uploads original
 * const { url, key } = await getUploadUrl({
 *   prefix: ImagePrefix.Raw,
 *   itemId: "TX-9F3K8",
 *   ext: "jpg",
 *   contentType: "image/jpeg"
 * });
 * // 2. App PUTs file → url
 * // 3. Later, delete when listing expires
 * await deleteAll("TX-9F3K8");
 * ```
 */
export async function getUploadUrl(
  options: PreSignOptions,
  expires: number = 900
): Promise<UploadUrlResponse> {
  validateUploadOptions(options);
  
  const bucketName = getBucketName();
  const key = generateS3Key(options);
  
  console.log('Generating upload URL:', {
    bucketName,
    key,
    contentType: options.contentType,
    itemId: options.itemId,
    prefix: options.prefix
  });
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: options.contentType,
    Metadata: {
      itemId: options.itemId,
      prefix: options.prefix,
      uploadedAt: new Date().toISOString(),
    },
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: expires });
    console.log('Generated upload URL successfully:', { url, key });
    return { url, key };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

/**
 * Get the public URL for an image using CloudFront
 */
export function getPublicUrl(key: string): string {
  const cfDomain = getCloudFrontDomain();
  // If the domain already includes protocol, use it as is
  if (cfDomain.startsWith('http://') || cfDomain.startsWith('https://')) {
    return `${cfDomain}/${key}`;
  }
  // Otherwise, add https:// protocol
  return `https://${cfDomain}/${key}`;
}

/**
 * Get the staged URL for an item (convenience method)
 */
export function getStagedUrl(itemId: string): string {
  return getPublicUrl(`${ImagePrefix.Staged}/${itemId}`);
}

/**
 * Delete all images for a specific item across all prefixes
 * Handles batching for large numbers of objects (max 1000 per batch)
 */
export async function deleteAll(itemId: string): Promise<void> {
  const bucketName = getBucketName();
  const prefixes = Object.values(ImagePrefix);
  
  for (const prefix of prefixes) {
    await deleteObjectsByPrefix(bucketName, `${prefix}/${itemId}/`);
  }
}

/**
 * Delete objects by prefix with batching support
 */
async function deleteObjectsByPrefix(bucketName: string, prefix: string): Promise<void> {
  let continuationToken: string | undefined;
  
  do {
    // List objects with the prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });
    
    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      break;
    }
    
    // Prepare delete command
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: listResult.Contents.map(obj => ({ Key: obj.Key! })),
        Quiet: false,
      },
    });
    
    // Execute delete
    await s3Client.send(deleteCommand);
    
    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);
}

/**
 * Get lifecycle rules for a specific prefix
 */
export function getLifecycleRule(prefix: ImagePrefix): LifecycleRule {
  return LIFECYCLE_RULES[prefix];
}

/**
 * Validate file size against prefix limits
 */
export function validateFileSize(prefix: ImagePrefix, fileSize: number): boolean {
  const rule = LIFECYCLE_RULES[prefix];
  return fileSize <= rule.maxFileSize;
}

/**
 * Get the maximum file size for a prefix
 */
export function getMaxFileSize(prefix: ImagePrefix): number {
  return LIFECYCLE_RULES[prefix].maxFileSize;
} 