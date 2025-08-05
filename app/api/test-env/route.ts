import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envVars = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'Set' : 'Not set',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'Not set',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'Not set',
    VERCEL_URL: process.env.VERCEL_URL || 'Not set',
  };

  return NextResponse.json({
    message: 'Environment variables status',
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
} 