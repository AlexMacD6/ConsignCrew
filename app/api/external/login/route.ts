/**
 * External Login API Endpoint
 * 
 * This endpoint allows external applications to verify user credentials
 * and get session information for TreasureHub users.
 * 
 * Usage from external app:
 * POST /api/external/login
 * Headers: { 'X-API-Key': 'your-secret-api-key' }
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { headers } from 'next/headers';

// API key validation
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.EXTERNAL_APP_API_KEY;
  
  if (!validApiKey) {
    console.error('❌ EXTERNAL_APP_API_KEY not set in environment variables');
    return false;
  }
  
  return apiKey === validApiKey;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      console.log('❌ Invalid or missing API key for external login');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Invalid API key' 
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { email, password } = body;

    console.log('=== EXTERNAL LOGIN REQUEST ===');
    console.log('Email:', email);

    // 3. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    // 4. Attempt to sign in using Better Auth
    const headersList = await headers();
    
    // Note: Better Auth's signIn API is typically client-side
    // For server-side validation, we'll use the verify credentials approach
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: headersList,
    });

    if (!result || result.error) {
      console.log('External login failed:', result?.error);
      
      // Handle different error types
      let errorMessage = 'Invalid email or password';
      let statusCode = 401;
      
      if (result?.error?.message?.toLowerCase().includes('verify')) {
        errorMessage = 'Email verification required. Please verify your email before signing in.';
        statusCode = 403;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          requiresVerification: statusCode === 403
        },
        { status: statusCode }
      );
    }

    console.log('External login successful for user:', result.user?.id);

    // 5. Return success with user info (don't send session tokens for security)
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerified: result.user.emailVerified,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ External login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during login'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.EXTERNAL_APP_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    }
  );
}

