import { S3Client } from '@aws-sdk/client-s3';

/**
 * Singleton S3Client instance configured with environment variables
 * 
 * Environment variables required:
 * - AWS_REGION: AWS region (e.g., us-east-1)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 */
class S3ClientSingleton {
  private static instance: S3Client;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): S3Client {
    if (!S3ClientSingleton.instance) {
      const region = process.env.AWS_REGION;
      
      if (!region) {
        throw new Error('AWS_REGION environment variable is required');
      }

      S3ClientSingleton.instance = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    }

    return S3ClientSingleton.instance;
  }
}

// Export the singleton instance
export const s3Client = S3ClientSingleton.getInstance();

// Export the class for testing purposes
export { S3ClientSingleton }; 