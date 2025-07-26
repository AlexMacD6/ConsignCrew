import { validatePhotoFile } from './s3';

/**
 * Upload a photo to S3 using a pre-signed URL
 * @param file - The file to upload
 * @param photoType - The type of photo (hero, back, proof, additional)
 * @returns Promise<{ success: boolean; url?: string; error?: string }>
 */
export async function uploadPhotoToS3(
  file: File,
  photoType: string
): Promise<{ success: boolean; url?: string; error?: string; fileKey?: string }> {
  try {
    // Validate the file
    const validation = validatePhotoFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Get pre-signed URL from our API
    const presignedUrlResponse = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        photoType,
      }),
    });

    if (!presignedUrlResponse.ok) {
      const errorData = await presignedUrlResponse.json();
      return { success: false, error: errorData.error || 'Failed to get upload URL' };
    }

    const { presignedUrl } = await presignedUrlResponse.json();

    // Upload to S3 using the pre-signed URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      return { success: false, error: 'Failed to upload to S3' };
    }

    // Extract the file key from the pre-signed URL
    const url = new URL(presignedUrl);
    const fileKey = url.pathname.substring(1); // Remove leading slash

    return {
      success: true,
      url: `https://${url.host}${url.pathname}`,
      fileKey,
    };

  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error: 'Upload failed' };
  }
}

/**
 * Upload multiple photos to S3
 * @param files - Array of files to upload
 * @param photoType - The type of photos
 * @returns Promise<Array<{ success: boolean; url?: string; error?: string; fileKey?: string }>>
 */
export async function uploadMultiplePhotosToS3(
  files: File[],
  photoType: string
): Promise<Array<{ success: boolean; url?: string; error?: string; fileKey?: string }>> {
  const uploadPromises = files.map(file => uploadPhotoToS3(file, photoType));
  return Promise.all(uploadPromises);
}

/**
 * Convert File object to base64 for preview (fallback)
 * @param file - The file to convert
 * @returns Promise<string> - Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Compress image before upload (optional optimization)
 * @param file - The file to compress
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - JPEG quality (0-1)
 * @returns Promise<File> - Compressed file
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
} 