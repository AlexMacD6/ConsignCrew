/**
 * Browser-based video frame extraction using HTML5 Canvas
 * This approach works entirely in the browser and doesn't require FFmpeg
 */

export interface VideoFrameData {
  frameUrls: string[];
  duration: number;
  frameCount: number;
  thumbnailUrl: string;
}

export async function extractVideoFrames(
  videoFile: File,
  maxFrames: number = 10
): Promise<VideoFrameData> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frameInterval = duration / maxFrames;
      const frameUrls: string[] = [];
      let currentFrame = 0;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const extractFrame = () => {
        if (currentFrame >= maxFrames) {
          // Create thumbnail (first frame)
          video.currentTime = 0;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            resolve({
              frameUrls,
              duration,
              frameCount: frameUrls.length,
              thumbnailUrl
            });
          };
          return;
        }

        const targetTime = currentFrame * frameInterval;
        video.currentTime = targetTime;
        
        video.onseeked = () => {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0);
          
          // Convert canvas to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              const frameUrl = URL.createObjectURL(blob);
              frameUrls.push(frameUrl);
            }
            
            currentFrame++;
            extractFrame();
          }, 'image/jpeg', 0.8);
        };
      };

      extractFrame();
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Upload extracted frames to S3 and return their URLs
 */
export async function uploadFramesToS3(
  frameUrls: string[],
  videoId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < frameUrls.length; i++) {
    try {
      // Convert blob URL to actual blob
      const response = await fetch(frameUrls[i]);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', blob, `frame-${i}.jpg`);
      formData.append('videoId', videoId);
      formData.append('frameIndex', i.toString());

      // Upload to our photo upload endpoint
      const uploadResponse = await fetch('/api/upload/video/frame', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        uploadedUrls.push(result.url);
      } else {
        console.error(`Failed to upload frame ${i}`);
      }
    } catch (error) {
      console.error(`Error uploading frame ${i}:`, error);
    }
  }

  // Clean up blob URLs
  frameUrls.forEach(url => URL.revokeObjectURL(url));

  return uploadedUrls;
}

/**
 * Upload thumbnail to S3 and return its URL
 */
export async function uploadThumbnailToS3(
  thumbnailUrl: string,
  videoId: string
): Promise<string | null> {
  try {
    // Convert blob URL to actual blob
    const response = await fetch(thumbnailUrl);
    const blob = await response.blob();
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', blob, 'thumbnail.jpg');
    formData.append('videoId', videoId);
    formData.append('frameIndex', 'thumbnail');

    // Upload to our photo upload endpoint
    const uploadResponse = await fetch('/api/upload/video/frame', {
      method: 'POST',
      body: formData,
    });

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      return result.url;
    } else {
      console.error('Failed to upload thumbnail');
      return null;
    }
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }
}