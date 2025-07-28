import { 
  getUploadUrl, 
  getPublicUrl, 
  getStagedUrl, 
  deleteAll, 
  ImagePrefix,
  validateFileSize,
  getMaxFileSize 
} from './imageStore';

/**
 * Example usage of the ConsignCrew S3 Image Storage SDK
 * 
 * This file demonstrates how to use the typed S3 SDK for image management.
 */

// Example 1: Upload a raw image
export async function uploadRawImage(itemId: string, file: File) {
  try {
    // Validate file size before upload
    if (!validateFileSize(ImagePrefix.Raw, file.size)) {
      throw new Error(`File size ${file.size} exceeds maximum ${getMaxFileSize(ImagePrefix.Raw)}`);
    }

    // Generate pre-signed URL for upload
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.Raw,
      itemId,
      ext: file.name.endsWith('.png') ? 'png' : 'jpg',
      contentType: file.type,
    });

    // Upload file to S3 using the pre-signed URL
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    console.log(`File uploaded successfully: ${key}`);
    return key;
  } catch (error) {
    console.error('Error uploading raw image:', error);
    throw error;
  }
}

// Example 2: Process and stage an image
export async function processAndStageImage(itemId: string, rawKey: string) {
  try {
    // In a real application, you would process the image here
    // (resize, compress, apply filters, etc.)
    
    // Generate staged image key
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.Staged,
      itemId,
      ext: 'jpg',
      contentType: 'image/jpeg',
    });

    // Upload processed image
    const processedImageBlob = new Blob(['processed image data'], { type: 'image/jpeg' });
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: processedImageBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload staged image');
    }

    console.log(`Staged image uploaded: ${key}`);
    return key;
  } catch (error) {
    console.error('Error processing and staging image:', error);
    throw error;
  }
}

// Example 3: Generate thumbnail
export async function generateThumbnail(itemId: string, stagedKey: string) {
  try {
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.Thumbs,
      itemId,
      ext: 'jpg',
      contentType: 'image/jpeg',
    });

    // Generate thumbnail (in real app, this would be image processing)
    const thumbnailBlob = new Blob(['thumbnail data'], { type: 'image/jpeg' });
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: thumbnailBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload thumbnail');
    }

    console.log(`Thumbnail uploaded: ${key}`);
    return key;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

// Example 4: Generate QR code
export async function generateQRCode(itemId: string, data: string) {
  try {
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.QR,
      itemId,
      ext: 'png',
      contentType: 'image/png',
    });

    // Generate QR code (in real app, this would use a QR library)
    const qrCodeBlob = new Blob(['qr code data'], { type: 'image/png' });
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: qrCodeBlob,
      headers: {
        'Content-Type': 'image/png',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload QR code');
    }

    console.log(`QR code uploaded: ${key}`);
    return key;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Example 5: Complete image processing workflow
export async function processItemImages(itemId: string, files: File[]) {
  try {
    const results = {
      rawKeys: [] as string[],
      stagedKeys: [] as string[],
      thumbnailKeys: [] as string[],
      qrCodeKey: null as string | null,
    };

    // Upload raw images
    for (const file of files) {
      const rawKey = await uploadRawImage(itemId, file);
      results.rawKeys.push(rawKey);
    }

    // Process and stage each image
    for (const rawKey of results.rawKeys) {
      const stagedKey = await processAndStageImage(itemId, rawKey);
      results.stagedKeys.push(stagedKey);
    }

    // Generate thumbnail for first staged image
    if (results.stagedKeys.length > 0) {
      const thumbnailKey = await generateThumbnail(itemId, results.stagedKeys[0]);
      results.thumbnailKeys.push(thumbnailKey);
    }

    // Generate QR code for the item
    const qrCodeKey = await generateQRCode(itemId, `https://consigncrew.com/item/${itemId}`);
    results.qrCodeKey = qrCodeKey;

    console.log('Image processing complete:', results);
    return results;
  } catch (error) {
    console.error('Error in image processing workflow:', error);
    throw error;
  }
}

// Example 6: Get public URLs for display
export function getItemDisplayUrls(itemId: string, keys: {
  stagedKeys: string[];
  thumbnailKeys: string[];
  qrCodeKey: string | null;
}) {
  const urls = {
    staged: keys.stagedKeys.map(key => getPublicUrl(key)),
    thumbnails: keys.thumbnailKeys.map(key => getPublicUrl(key)),
    qrCode: keys.qrCodeKey ? getPublicUrl(keys.qrCodeKey) : null,
    // Convenience method for staged URL
    stagedUrl: getStagedUrl(itemId),
  };

  console.log('Display URLs:', urls);
  return urls;
}

// Example 7: Clean up when item is deleted
export async function cleanupItemImages(itemId: string) {
  try {
    console.log(`Cleaning up all images for item: ${itemId}`);
    await deleteAll(itemId);
    console.log(`Successfully deleted all images for item: ${itemId}`);
  } catch (error) {
    console.error(`Error cleaning up images for item ${itemId}:`, error);
    throw error;
  }
}

// Example 8: Validate file before upload
export function validateUploadFile(file: File, prefix: ImagePrefix) {
  const maxSize = getMaxFileSize(prefix);
  const isValidSize = validateFileSize(prefix, file.size);
  
  if (!isValidSize) {
    throw new Error(`File size ${file.size} bytes exceeds maximum ${maxSize} bytes for prefix ${prefix}`);
  }

  // Check content type based on prefix
  const allowedTypes = {
    [ImagePrefix.Raw]: ['image/jpeg', 'image/png'],
    [ImagePrefix.Staged]: ['image/jpeg', 'image/png'],
    [ImagePrefix.Thumbs]: ['image/jpeg', 'image/png'],
    [ImagePrefix.Bundles]: ['image/jpeg', 'image/png'],
    [ImagePrefix.QR]: ['image/png'],
    [ImagePrefix.Temp]: ['image/jpeg', 'image/png'],
    [ImagePrefix.Archive]: ['image/jpeg', 'image/png'],
  };

  if (!allowedTypes[prefix].includes(file.type)) {
    throw new Error(`Content type ${file.type} not allowed for prefix ${prefix}`);
  }

  console.log(`File validation passed for ${prefix}: ${file.name} (${file.size} bytes)`);
  return true;
} 