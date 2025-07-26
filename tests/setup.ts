import { vi } from 'vitest';

// Mock environment variables for tests
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET = 'consigncrew-images';
process.env.CF_DOMAIN = 'cdn.consigncrew.com';

// Global test setup
beforeAll(() => {
  // Any global setup can go here
});

afterAll(() => {
  // Any global cleanup can go here
}); 