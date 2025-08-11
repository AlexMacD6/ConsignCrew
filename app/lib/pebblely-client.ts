/**
 * Pebblely API Client for product photo generation
 * Based on Pebblely API documentation: https://pebblely.com/docs/
 */

import { addWatermarkToImage } from './image-watermark';

interface PebblelyCreditsResponse {
  credits: number;
}

interface PebblelyTheme {
  label: string;
  thumbnail: string;
}

interface PebblelyCreateBackgroundRequest {
  images: string[]; // Base64 or URLs
  theme?: string;
  description?: string;
  style_color?: string;
  style_image?: string;
  negative?: string;
  generate_plus?: boolean;
  transforms?: Array<{
    scale_x?: number;
    scale_y?: number;
    x?: number;
    y?: number;
    angle?: number;
  }>;
  autoresize?: boolean;
  height?: number;
  width?: number;
}

interface PebblelyResponse {
  data: string; // Base64 encoded image
  credits: number;
}

interface PebblelyRemoveBackgroundRequest {
  image: string; // Base64 or URL
}

interface PebblelyUpscaleRequest {
  image: string; // Base64 or URL
  size?: 1024 | 2048;
}

class PebblelyClient {
  private apiKey: string;
  private baseUrl = 'https://api.pebblely.com';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Pebblely API key is required');
    }
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'X-Pebblely-Access-Token': this.apiKey,
    };

    if (method === 'POST' && body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pebblely API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get remaining credits for the account
   */
  async getCredits(): Promise<PebblelyCreditsResponse> {
    return this.makeRequest('/credits/v1');
  }

  /**
   * Get available themes and their thumbnails
   */
  async getThemes(): Promise<PebblelyTheme[]> {
    return this.makeRequest('/themes/v1');
  }

  /**
   * Remove background from a product photo
   * Returns base64 encoded PNG with transparent background
   */
  async removeBackground(request: PebblelyRemoveBackgroundRequest): Promise<PebblelyResponse> {
    return this.makeRequest('/remove-background/v1', 'POST', request);
  }

  /**
   * Create a new background for product photos
   * Input should be a PNG with transparent background (use removeBackground first)
   */
  async createBackground(request: PebblelyCreateBackgroundRequest): Promise<PebblelyResponse> {
    return this.makeRequest('/create-background/v2', 'POST', request);
  }

  /**
   * Upscale an image to higher resolution
   */
  async upscale(request: PebblelyUpscaleRequest): Promise<PebblelyResponse> {
    return this.makeRequest('/upscale/v1', 'POST', request);
  }

  /**
   * Direct background creation (matches Python sample)
   * Use this if your image already has transparent background
   */
  async createBackgroundDirect(params: {
    imageUrl: string;
    theme?: string;
    description?: string;
    style_color?: string;
    autoresize?: boolean;
    width?: number;
    height?: number;
  }): Promise<{
    stagedImage: string;
    credits: number;
  }> {
    console.log('🎨 Pebblely - Creating background directly (like Python sample)...');
    
    // Convert URL to Base64 (matches Python sample approach)
    const imageBase64 = await urlToBase64(params.imageUrl);
    
    const result = await this.createBackground({
      images: [imageBase64],
      theme: params.theme || "Surprise me",
      description: params.description || "",
      style_color: params.style_color,
      autoresize: params.autoresize || true,
      width: params.width || 512,
      height: params.height || 512,
      transforms: [{
        scale_x: 1,
        scale_y: 1,
        x: 0,
        y: 0,
        angle: 0
      }]
    });

    return {
      stagedImage: result.data,
      credits: result.credits
    };
  }

  /**
   * Complete workflow: Remove background and create new background
   * Use this for product photos that need background removal first
   */
  async generateStagedPhoto(params: {
    imageUrl: string;
    theme?: string;
    description?: string;
    style_color?: string;
    autoresize?: boolean;
    width?: number;
    height?: number;
    skipBackgroundRemoval?: boolean;
    addWatermark?: boolean; // New option to add TreasureHub watermark
  }): Promise<{
    backgroundRemovedImage?: string;
    stagedImage: string;
    credits: number;
  }> {
    
    // If skipBackgroundRemoval is true, use direct method (like Python sample)
    if (params.skipBackgroundRemoval) {
      const result = await this.createBackgroundDirect(params);
      
      let finalImage = result.stagedImage;
      if (params.addWatermark) {
        try {
          console.log('🎨 Pebblely - Adding TreasureHub watermark...');
          finalImage = await addWatermarkToImage(result.stagedImage, {
            opacity: 0.3,
            position: 'bottom-right',
            size: 12,
            margin: 3
          });
          console.log('✅ Pebblely - Watermark added successfully');
        } catch (error) {
          console.warn('⚠️ Pebblely - Failed to add watermark, using original image:', error);
        }
      }
      
      return {
        stagedImage: finalImage,
        credits: result.credits
      };
    }

    // Step 1: Remove background
    console.log('🎨 Pebblely - Removing background from image...');
    const backgroundRemovalResult = await this.removeBackground({
      image: params.imageUrl
    });

    // Step 2: Create new background
    console.log('🎨 Pebblely - Creating new background...');
    const backgroundCreationResult = await this.createBackground({
      images: [backgroundRemovalResult.data], // Use the background-removed image
      theme: params.theme || "Surprise me",
      description: params.description || "",
      style_color: params.style_color,
      autoresize: params.autoresize || true,
      width: params.width || 512,
      height: params.height || 512,
      transforms: [{
        scale_x: 1,
        scale_y: 1,
        x: 0,
        y: 0,
        angle: 0
      }]
    });

    // Step 3: Add watermark if requested
    let finalImage = backgroundCreationResult.data;
    if (params.addWatermark) {
      try {
        console.log('🎨 Pebblely - Adding TreasureHub watermark...');
        finalImage = await addWatermarkToImage(backgroundCreationResult.data, {
          opacity: 0.3,
          position: 'bottom-right',
          size: 12, // Smaller watermark for staged photos
          margin: 3
        });
        console.log('✅ Pebblely - Watermark added successfully');
      } catch (error) {
        console.warn('⚠️ Pebblely - Failed to add watermark, using original image:', error);
        // Continue with original image if watermarking fails
      }
    }

    return {
      backgroundRemovedImage: backgroundRemovalResult.data,
      stagedImage: finalImage,
      credits: backgroundCreationResult.credits
    };
  }
}

// Helper function to convert image URL to base64
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  // Pebblely accepts either data URL format or plain base64
  // Based on the Python sample, they use plain base64, so let's return that
  return base64;
}

// Helper function to convert base64 to buffer
export function base64ToBuffer(base64Data: string): Buffer {
  // Remove data URL prefix if present
  const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64String, 'base64');
}

// Export client instance
export function createPebblelyClient(): PebblelyClient {
  const apiKey = process.env.PEBBLELY_API_KEY;
  if (!apiKey) {
    throw new Error('PEBBLELY_API_KEY environment variable is required');
  }
  return new PebblelyClient(apiKey);
}

export default PebblelyClient;
