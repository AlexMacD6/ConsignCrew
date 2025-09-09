/**
 * Video utility functions for TreasureHub
 */

/**
 * Generate a CloudFront URL from a video key
 */
export const generateVideoUrl = (videoKey: string | null | undefined): string | null => {
  if (!videoKey) return null;

  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  console.log("CloudFront domain:", cdnUrl);
  console.log("Using video key:", videoKey);

  if (cdnUrl) {
    const cleanDomain = cdnUrl.replace("https://", "").replace("http://", "");
    const url = `https://${cleanDomain}/${videoKey}`;
    console.log("✅ Generated CloudFront URL:", url);
    return url;
  }

  // Fallback to S3 URL - using known values from the project
  const bucketName = "consigncrew"; // From env.example
  const region = "us-east-1"; // From env.example
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${videoKey}`;
  console.log("✅ Generated S3 URL:", url);
  return url;
};

/**
 * Generate video URL from video record object
 */
export const generateVideoUrlFromRecord = (videoRecord: any): string | null => {
  if (!videoRecord) return null;

  // Prioritize rawVideoKey, fallback to processedVideoKey
  const videoKey = videoRecord.rawVideoKey || videoRecord.processedVideoKey;
  return generateVideoUrl(videoKey);
};

/**
 * Generate thumbnail URL from video record
 */
export const generateThumbnailUrl = (videoRecord: any): string | null => {
  if (!videoRecord) return null;

  // If thumbnailUrl is already a full URL, return it
  if (videoRecord.thumbnailUrl && videoRecord.thumbnailUrl.startsWith('http')) {
    return videoRecord.thumbnailUrl;
  }

  // If thumbnailKey exists, generate URL
  if (videoRecord.thumbnailKey) {
    return generateVideoUrl(videoRecord.thumbnailKey);
  }

  return null;
};

/**
 * Validate video file extensions
 */
export const isValidVideoExtension = (filename: string): boolean => {
  const validExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv"];
  const lowerFilename = filename.toLowerCase();
  return validExtensions.some(ext => lowerFilename.includes(ext));
};
