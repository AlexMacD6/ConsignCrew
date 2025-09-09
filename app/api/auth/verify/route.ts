import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      // Clean up the token
      await prisma.verificationToken.delete({
        where: { token }
      });
      
      // Redirect to login with success message
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('verified', 'already');
      return NextResponse.redirect(redirectUrl);
    }
    
    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: new Date() 
      }
    });
    
    // Clean up the verification token
    await prisma.verificationToken.delete({
      where: { token }
    });
    
    console.log('Email verification successful for user:', user.email);
    
    // Redirect to login with success message
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('verified', 'success');
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error in email verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
