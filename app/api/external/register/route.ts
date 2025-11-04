/**
 * External Registration API Endpoint
 * 
 * This endpoint allows external applications (like Selling to Sold app) to register users
 * in the TreasureHub system. Requires API key authentication for security.
 * 
 * Usage from external app:
 * POST /api/external/register
 * Headers: { 'X-API-Key': 'your-secret-api-key' }
 * Body: { email, password, name, mobilePhone?, userType?: 'buyer' | 'seller' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// API key validation - Check against environment variable
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
      console.log('❌ Invalid or missing API key for external registration');
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
    const { email, password, name, mobilePhone, userType, appSource } = body;

    console.log('=== EXTERNAL REGISTRATION REQUEST ===');
    console.log('App Source:', appSource || 'Unknown');
    console.log('User Type:', userType || 'buyer');
    console.log('Email:', email);

    // 3. Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, password, and name are required'
        },
        { status: 400 }
      );
    }

    // 4. Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters long'
        },
        { status: 400 }
      );
    }

    // 5. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists'
        },
        { status: 409 }
      );
    }

    // 6. Prepare registration data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: password,
      mobilePhone: mobilePhone || undefined,
      userType: userType || 'buyer',
    };

    console.log('External registration - calling Better Auth signUpEmail');

    // 7. Call Better Auth's signUpEmail API
    const headersList = await headers();
    const result = await auth.api.signUpEmail({
      body: userData,
      headers: headersList,
    });

    if (!result || !result.user) {
      console.error('External registration - Better Auth signup failed:', result);
      return NextResponse.json(
        {
          success: false,
          error: 'Registration failed - Unable to create account'
        },
        { status: 500 }
      );
    }

    console.log('External registration - User created:', result.user.id);

    // 8. Create Stripe customer for buyers (if applicable)
    if (userType === 'buyer' || !userType) {
      try {
        // Check if Stripe is configured
        if (process.env.STRIPE_SECRET_KEY) {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          
          const customer = await stripe.customers.create({
            email: result.user.email,
            name: result.user.name,
            metadata: {
              userId: result.user.id,
              source: appSource || 'external-app',
            },
          });

          // Update user with Stripe customer ID
          await prisma.user.update({
            where: { id: result.user.id },
            data: { stripeCustomerId: customer.id },
          });

          console.log('External registration - Stripe customer created:', customer.id);
        }
      } catch (stripeError) {
        console.error('External registration - Stripe customer creation failed:', stripeError);
        // Continue even if Stripe fails - user is still created
      }
    }

    // 9. Add user to appropriate organization
    try {
      const orgSlug = userType === 'seller' ? 'treasurehub-sellers' : 'treasurehub-buyers';
      
      // Find organization
      const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      if (organization) {
        // Add user to organization
        await prisma.member.create({
          data: {
            organizationId: organization.id,
            userId: result.user.id,
            role: 'member',
          },
        });

        console.log(`External registration - Added user to ${orgSlug} organization`);
      }
    } catch (orgError) {
      console.error('External registration - Organization assignment failed:', orgError);
      // Continue even if organization assignment fails
    }

    // 10. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerified: result.user.emailVerified,
        },
        // Include verification info
        requiresEmailVerification: true,
        verificationEmailSent: true,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ External registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during registration',
        details: error instanceof Error ? error.message : 'Unknown error'
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

