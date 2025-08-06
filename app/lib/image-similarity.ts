/**
 * Image Similarity Utilities
 * Calculates cosine similarity between two images using image embeddings
 */

import { createCanvas, loadImage } from 'canvas';

// Simple image feature extraction using pixel histograms
function extractImageFeatures(imageData: ImageData): number[] {
  const { data, width, height } = imageData;
  const features: number[] = new Array(256).fill(0); // RGB histogram
  
  // Calculate RGB histogram
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale for simplicity
    const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
    features[gray]++;
  }
  
  // Normalize the histogram
  const total = width * height;
  return features.map(count => count / total);
}

// Calculate cosine similarity between two feature vectors
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Process image URL to get ImageData
async function getImageData(imageUrl: string): Promise<ImageData> {
  try {
    // For server-side, we'll use a simple approach
    // In production, you might want to use a more sophisticated image processing library
    const canvas = createCanvas(64, 64); // Small size for performance
    const ctx = canvas.getContext('2d');
    
    const image = await loadImage(imageUrl);
    ctx.drawImage(image, 0, 0, 64, 64);
    
    return ctx.getImageData(0, 0, 64, 64);
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Calculate cosine similarity between two images
 * @param imageUrl1 - URL of the first image
 * @param imageUrl2 - URL of the second image
 * @returns Promise<number> - Similarity score between 0 and 1
 */
export async function calculateImageSimilarity(
  imageUrl1: string,
  imageUrl2: string
): Promise<number> {
  try {
    // Get image data for both images
    const [imageData1, imageData2] = await Promise.all([
      getImageData(imageUrl1),
      getImageData(imageUrl2),
    ]);
    
    // Extract features from both images
    const features1 = extractImageFeatures(imageData1);
    const features2 = extractImageFeatures(imageData2);
    
    // Calculate cosine similarity
    const similarity = cosineSimilarity(features1, features2);
    
    // Return similarity score (clamp between 0 and 1)
    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    console.error('Error calculating image similarity:', error);
    return 0; // Return 0 if calculation fails
  }
}

/**
 * Mock function for development/testing when canvas is not available
 * In production, this should be replaced with actual image processing
 */
export function calculateImageSimilarityMock(
  imageUrl1: string,
  imageUrl2: string
): number {
  // Generate a mock similarity score based on URL hash
  const hash1 = imageUrl1.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const hash2 = imageUrl2.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate a score between 0.6 and 0.95 for demo purposes
  const score = 0.6 + (Math.abs(hash1 - hash2) % 1000) / 1000 * 0.35;
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}