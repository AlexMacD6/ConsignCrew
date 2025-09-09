import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/verify?token=xxx
 * Handle email verification tokens
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Email verification request received');
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    console.log('🔍 Token from URL:', token ? `${token.substring(0, 10)}...` : 'null');
    
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    
    console.log('🔍 Looking up verification token in database...');
    // Find the verification token in the database
    let verificationToken;
    try {
      verificationToken = await prisma.verificationToken.findUnique({
        where: { token }
      });
    } catch (dbError) {
      console.error('❌ Database error during token lookup:', dbError);
      throw new Error(`Database error during token lookup: ${dbError.message}`);
    }
    
    console.log('🔍 Database lookup result:', verificationToken ? 'Found' : 'Not found');
    
    if (!verificationToken) {
      console.log('❌ Token not found in database');
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }
    
    console.log('🔍 Token found, checking expiration...');
    console.log('🔍 Token expires:', verificationToken.expires);
    console.log('🔍 Current time:', new Date());
    
    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token }
      });
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }
    
    console.log('🔍 Token is valid, looking up user...');
    console.log('🔍 Looking for user with email:', verificationToken.identifier);
    
    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    });
    
    console.log('🔍 User lookup result:', user ? `Found user: ${user.email}` : 'User not found');
    
    if (!user) {
      console.log('❌ User not found for email:', verificationToken.identifier);
      // Clean up the orphaned verification token
      await prisma.verificationToken.delete({
        where: { token }
      });
      return NextResponse.json({ 
        error: 'User account not found. The verification link may be invalid or the account may have been removed.',
        email: verificationToken.identifier
      }, { status: 404 });
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      // Clean up the token
      await prisma.verificationToken.delete({
        where: { token }
      });
      
      // For debugging, return JSON instead of redirect
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          success: true, 
          message: 'Email already verified',
          user: user.email,
          redirectTo: '/login?verified=already'
        });
      }
      
      // Redirect to login with already verified message (production only)
      const baseUrl = new URL(request.url).origin;
      const redirectUrl = new URL('/login?verified=already', baseUrl);
      console.log('🔄 Redirecting (already verified) to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }
    
    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true 
      }
    });
    
    // Clean up the verification token
    await prisma.verificationToken.delete({
      where: { token }
    });
    
    console.log('✅ Email verification successful for user:', user.email);
    
    // For debugging, return JSON instead of redirect
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: true, 
        message: 'Email verified successfully',
        user: user.email,
        redirectTo: '/login?verified=success'
      });
    }
    
    // Redirect to login with success message (production only)
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = new URL('/login?verified=success', baseUrl);
    console.log('🔄 Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Error in email verification:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
