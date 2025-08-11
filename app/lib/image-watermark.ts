/**
 * Image watermarking utility for adding TreasureHub logo to generated images
 */

export interface WatermarkOptions {
  opacity?: number; // 0-1, default 0.3
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number; // Percentage of image width, default 15
  margin?: number; // Percentage of image width for margin, default 2
}

/**
 * Add TreasureHub watermark to a base64 image
 */
export async function addWatermarkToImage(
  imageBase64: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    opacity = 0.3,
    position = 'bottom-right',
    size = 15,
    margin = 2
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Create canvas and context
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Load the main image
      const mainImage = new Image();
      mainImage.crossOrigin = 'anonymous';
      
      mainImage.onload = () => {
        // Set canvas size to match image
        canvas.width = mainImage.width;
        canvas.height = mainImage.height;
        
        // Draw the main image
        ctx.drawImage(mainImage, 0, 0);
        
        // Load the TreasureHub logo
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        
        logo.onload = () => {
          // Calculate watermark dimensions and position
          const watermarkWidth = (canvas.width * size) / 100;
          const watermarkHeight = (logo.height / logo.width) * watermarkWidth;
          const marginPx = (canvas.width * margin) / 100;
          
          let x, y;
          switch (position) {
            case 'bottom-right':
              x = canvas.width - watermarkWidth - marginPx;
              y = canvas.height - watermarkHeight - marginPx;
              break;
            case 'bottom-left':
              x = marginPx;
              y = canvas.height - watermarkHeight - marginPx;
              break;
            case 'top-right':
              x = canvas.width - watermarkWidth - marginPx;
              y = marginPx;
              break;
            case 'top-left':
              x = marginPx;
              y = marginPx;
              break;
            default:
              x = canvas.width - watermarkWidth - marginPx;
              y = canvas.height - watermarkHeight - marginPx;
          }
          
          // Apply opacity and draw watermark
          ctx.globalAlpha = opacity;
          ctx.drawImage(logo, x, y, watermarkWidth, watermarkHeight);
          
          // Reset opacity
          ctx.globalAlpha = 1.0;
          
          // Convert to base64 and resolve
          const watermarkedImage = canvas.toDataURL('image/png');
          const base64Data = watermarkedImage.split(',')[1]; // Remove data:image/png;base64, prefix
          resolve(base64Data);
        };
        
        logo.onerror = () => {
          console.warn('Failed to load TreasureHub logo, returning original image');
          // Return original image as base64 if logo fails to load
          const originalBase64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(originalBase64);
        };
        
        // Load TreasureHub logo
        logo.src = '/TreasureHub - Logo.png';
      };
      
      mainImage.onerror = () => {
        reject(new Error('Failed to load main image'));
      };
      
      // Load the main image
      const imageDataUrl = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`;
      mainImage.src = imageDataUrl;
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add watermark to an image URL (downloads the image first)
 */
export async function addWatermarkToImageUrl(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1]; // Remove data URL prefix
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Add watermark
    return await addWatermarkToImage(base64, options);
  } catch (error) {
    console.error('Error adding watermark to image URL:', error);
    throw error;
  }
}
