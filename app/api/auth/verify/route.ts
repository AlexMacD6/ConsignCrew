import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/verify?token=xxx
 * Handle email verification tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    
    // Find the verification token in the database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });
    
    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }
    
    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token }
      });
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }
    
    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    });
    
    if (!user) {
      // Clean up the orphaned verification token
      await prisma.verificationToken.delete({
        where: { token }
      });
      return NextResponse.json({ 
        error: 'User account not found. The verification link may be invalid or the account may have been removed.'
      }, { status: 404 });
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      // Clean up the token
      await prisma.verificationToken.delete({
        where: { token }
      });
      
      // Redirect to login with already verified message
      const baseUrl = new URL(request.url).origin;
      const redirectUrl = new URL('/login?verified=already', baseUrl);
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
    
    // Redirect to login with success message
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = new URL('/login?verified=success', baseUrl);
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error in email verification:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}
