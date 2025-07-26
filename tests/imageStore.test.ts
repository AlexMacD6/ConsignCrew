import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ImagePrefix, getUploadUrl, getPublicUrl, getStagedUrl, deleteAll, getLifecycleRule, validateFileSize, getMaxFileSize } from '../src/aws/imageStore';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

// Mock environment variables
const mockEnv = {
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET: 'consigncrew-images',
  CF_DOMAIN: 'cdn.consigncrew.com',
};

// Mock process.env
vi.stubGlobal('process', {
  ...process,
  env: mockEnv,
});

// Ensure environment variables are set for all tests
beforeEach(() => {
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.S3_BUCKET = 'consigncrew-images';
  process.env.CF_DOMAIN = 'cdn.consigncrew.com';
});

describe('ImageStore', () => {
  let mockS3Client: any;
  let mockGetSignedUrl: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock S3Client
    mockS3Client = {
      send: vi.fn(),
    };
    (S3Client as any).mockImplementation(() => mockS3Client);
    
    // Mock getSignedUrl
    mockGetSignedUrl = vi.fn();
    (getSignedUrl as any).mockImplementation(mockGetSignedUrl);
    
    // Ensure environment variables are set for all tests
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.S3_BUCKET = 'consigncrew-images';
    process.env.CF_DOMAIN = 'cdn.consigncrew.com';
    
    // Set default mock response for s3Client.send
    mockS3Client.send.mockResolvedValue({ Contents: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUploadUrl', () => {
    it('should generate upload URL with correct parameters', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key';
      mockGetSignedUrl.mockResolvedValue(mockUrl);

      const options = {
        prefix: ImagePrefix.Raw,
        itemId: 'TX-9F3K8',
        ext: 'jpg' as const,
        contentType: 'image/jpeg',
      };

      const result = await getUploadUrl(options);

      expect(result.url).toBe(mockUrl);
      expect(result.key).toMatch(/^prod\/raw\/TX-9F3K8\/\d+-[a-z0-9]+\.jpg$/);
      // Check that getSignedUrl was called
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(Object), // PutObjectCommand
        { expiresIn: 900 }
      );
    });

    it('should validate content type', async () => {
      const options = {
        prefix: ImagePrefix.QR,
        itemId: 'TX-9F3K8',
        ext: 'jpg' as const,
        contentType: 'image/jpeg', // QR only allows PNG
      };

      await expect(getUploadUrl(options)).rejects.toThrow(
        'Content type image/jpeg not allowed for prefix prod/qr'
      );
    });

    it('should use custom expiration time', async () => {
      mockGetSignedUrl.mockResolvedValue('https://test-url.com');

      const options = {
        prefix: ImagePrefix.Staged,
        itemId: 'TX-9F3K8',
        ext: 'png' as const,
        contentType: 'image/png',
      };

      await getUploadUrl(options, 1800); // 30 minutes

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(Object),
        { expiresIn: 1800 }
      );
    });

    it('should throw error if S3_BUCKET is not set', async () => {
      const originalEnv = process.env;
      delete (process.env as any).S3_BUCKET;

      const options = {
        prefix: ImagePrefix.Raw,
        itemId: 'TX-9F3K8',
        ext: 'jpg' as const,
        contentType: 'image/jpeg',
      };

      await expect(getUploadUrl(options)).rejects.toThrow(
        'S3_BUCKET environment variable is required'
      );

      process.env = originalEnv;
    });
  });

  describe('getPublicUrl', () => {
    it('should generate CloudFront URL', () => {
      const key = 'prod/staged/TX-9F3K8/1234567890-abc123.jpg';
      const url = getPublicUrl(key);
      
      expect(url).toBe('https://cdn.consigncrew.com/prod/staged/TX-9F3K8/1234567890-abc123.jpg');
    });

    it('should throw error if CF_DOMAIN is not set', () => {
      const originalEnv = process.env;
      delete (process.env as any).CF_DOMAIN;

      expect(() => getPublicUrl('test-key')).toThrow(
        'CF_DOMAIN environment variable is required'
      );

      process.env = originalEnv;
    });
  });

  describe('getStagedUrl', () => {
    it('should generate staged URL for item', () => {
      const itemId = 'TX-9F3K8';
      const url = getStagedUrl(itemId);
      
      expect(url).toBe('https://cdn.consigncrew.com/prod/staged/TX-9F3K8');
    });
  });

  describe('deleteAll', () => {
                 it('should delete objects across all prefixes', async () => {
            // Mock responses for all 7 prefixes (raw, staged, thumbs, bundles, qr, temp, archive)
            // First prefix (raw) - has objects
            mockS3Client.send
              .mockResolvedValueOnce({
                Contents: [
                  { Key: 'prod/raw/TX-9F3K8/123.jpg' },
                  { Key: 'prod/raw/TX-9F3K8/456.jpg' },
                ],
              })
              .mockResolvedValueOnce({
                Deleted: [
                  { Key: 'prod/raw/TX-9F3K8/123.jpg' },
                  { Key: 'prod/raw/TX-9F3K8/456.jpg' },
                ],
              })
              // Second prefix (staged) - has objects
              .mockResolvedValueOnce({
                Contents: [
                  { Key: 'prod/staged/TX-9F3K8/789.png' },
                ],
              })
              .mockResolvedValueOnce({
                Deleted: [
                  { Key: 'prod/staged/TX-9F3K8/789.png' },
                ],
              })
              // Remaining 5 prefixes - empty
              .mockResolvedValue({ Contents: [] }) // thumbs
              .mockResolvedValue({ Contents: [] }) // bundles
              .mockResolvedValue({ Contents: [] }) // qr
              .mockResolvedValue({ Contents: [] }) // temp
              .mockResolvedValue({ Contents: [] }); // archive

      await deleteAll('TX-9F3K8');

      // Verify ListObjectsV2Command was called for each prefix
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: 'consigncrew-images',
            Prefix: 'prod/raw/TX-9F3K8/',
            MaxKeys: 1000,
          },
        })
      );

      // Verify DeleteObjectsCommand was called
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: 'consigncrew-images',
            Delete: {
              Objects: [
                { Key: 'prod/raw/TX-9F3K8/123.jpg' },
                { Key: 'prod/raw/TX-9F3K8/456.jpg' },
              ],
              Quiet: false,
            },
          },
        })
      );
    });

    it('should handle empty results', async () => {
      // Mock empty responses for all 7 prefixes - ensure Contents is always defined
      mockS3Client.send.mockResolvedValue({ Contents: [] });

      await deleteAll('TX-9F3K8');

      // Should call ListObjectsV2Command for each prefix but not DeleteObjectsCommand
      expect(mockS3Client.send).toHaveBeenCalledTimes(7); // 7 prefixes
      expect(mockS3Client.send).not.toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Delete: expect.any(Object),
          }),
        })
      );
    });

    it('should handle batching for large numbers of objects', async () => {
      // Mock first batch with continuation token for raw prefix
      mockS3Client.send
        .mockResolvedValueOnce({
          Contents: Array.from({ length: 1000 }, (_, i) => ({
            Key: `prod/raw/TX-9F3K8/file${i}.jpg`,
          })),
          NextContinuationToken: 'token123',
        })
        .mockResolvedValueOnce({
          Deleted: Array.from({ length: 1000 }, (_, i) => ({
            Key: `prod/raw/TX-9F3K8/file${i}.jpg`,
          })),
        })
        .mockResolvedValueOnce({
          Contents: Array.from({ length: 500 }, (_, i) => ({
            Key: `prod/raw/TX-9F3K8/file${i + 1000}.jpg`,
          })),
        })
        .mockResolvedValueOnce({
          Deleted: Array.from({ length: 500 }, (_, i) => ({
            Key: `prod/raw/TX-9F3K8/file${i + 1000}.jpg`,
          })),
        })
        // Empty responses for remaining 6 prefixes
        .mockResolvedValue({ Contents: [] }) // staged
        .mockResolvedValue({ Contents: [] }) // thumbs
        .mockResolvedValue({ Contents: [] }) // bundles
        .mockResolvedValue({ Contents: [] }) // qr
        .mockResolvedValue({ Contents: [] }) // temp
        .mockResolvedValue({ Contents: [] }); // archive

      await deleteAll('TX-9F3K8');

      // Verify continuation token was used
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: 'consigncrew-images',
            Prefix: 'prod/raw/TX-9F3K8/',
            MaxKeys: 1000,
            ContinuationToken: 'token123',
          },
        })
      );
    });
  });

  describe('getLifecycleRule', () => {
    it('should return lifecycle rule for Raw prefix', () => {
      const rule = getLifecycleRule(ImagePrefix.Raw);
      
      expect(rule.maxFileSize).toBe(50 * 1024 * 1024); // 50MB
      expect(rule.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
      expect(rule.allowedTypes).toEqual(['image/jpeg', 'image/png']);
    });

    it('should return lifecycle rule for QR prefix', () => {
      const rule = getLifecycleRule(ImagePrefix.QR);
      
      expect(rule.maxFileSize).toBe(1 * 1024 * 1024); // 1MB
      expect(rule.allowedTypes).toEqual(['image/png']);
    });
  });

  describe('validateFileSize', () => {
    it('should return true for valid file size', () => {
      const isValid = validateFileSize(ImagePrefix.Raw, 25 * 1024 * 1024); // 25MB
      expect(isValid).toBe(true);
    });

    it('should return false for file size exceeding limit', () => {
      const isValid = validateFileSize(ImagePrefix.Raw, 60 * 1024 * 1024); // 60MB
      expect(isValid).toBe(false);
    });
  });

  describe('getMaxFileSize', () => {
    it('should return max file size for prefix', () => {
      const maxSize = getMaxFileSize(ImagePrefix.Thumbs);
      expect(maxSize).toBe(2 * 1024 * 1024); // 2MB
    });
  });

  describe('ImagePrefix enum', () => {
    it('should have all required prefixes', () => {
      expect(ImagePrefix.Raw).toBe('prod/raw');
      expect(ImagePrefix.Staged).toBe('prod/staged');
      expect(ImagePrefix.Thumbs).toBe('prod/thumbs');
      expect(ImagePrefix.Bundles).toBe('prod/bundles');
      expect(ImagePrefix.QR).toBe('prod/qr');
      expect(ImagePrefix.Temp).toBe('prod/temp');
      expect(ImagePrefix.Archive).toBe('prod/archive');
    });
  });
}); 