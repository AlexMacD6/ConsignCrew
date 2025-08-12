/**
 * AWS Image Store wrapper for proper module resolution in app/api routes
 * This fixes import path issues with src/aws/imageStore.ts
 */

export { 
  getUploadUrl, 
  getPublicUrl, 
  ImagePrefix,
  validateFileSize,
  getMaxFileSize
} from '../../src/aws/imageStore';



