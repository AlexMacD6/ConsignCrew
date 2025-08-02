/**
 * Test script to verify BetterAuth email verification configuration
 * Run this with: node test-betterauth-email.js
 */

import { auth } from './app/lib/auth.js';

async function testEmailVerification() {
  console.log('Testing BetterAuth email verification configuration...');
  
  try {
    // Test the auth configuration
    console.log('Auth configuration loaded successfully');
    console.log('Email and password enabled:', auth.config.emailAndPassword?.enabled);
    console.log('Email verification required:', auth.config.emailAndPassword?.requireEmailVerification);
    console.log('Verification token expiry:', auth.config.emailAndPassword?.verificationTokenExpiry);
    
    // Test SES configuration
    const { sendEmail } = await import('./app/lib/ses-server.js');
    console.log('SES server module loaded successfully');
    
    // Test environment variables
    console.log('Environment variables:');
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
    console.log('- AWS_SES_DEFAULT_FROM_EMAIL:', process.env.AWS_SES_DEFAULT_FROM_EMAIL);
    console.log('- BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'Set' : 'Not set');
    console.log('- BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
    
    console.log('\n✅ BetterAuth email verification configuration test completed');
  } catch (error) {
    console.error('❌ Error testing BetterAuth configuration:', error);
  }
}

testEmailVerification(); 