/**
 * Test script to verify BetterAuth configuration
 * Run with: node test-betterauth-setup.js
 */

import { PrismaClient } from '@prisma/client';

async function testBetterAuthSetup() {
  console.log('🔍 Testing BetterAuth Configuration...\n');

  // Test 1: Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`   BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   AWS_SES_DEFAULT_FROM_EMAIL: ${process.env.AWS_SES_DEFAULT_FROM_EMAIL || '❌ Not set'}\n`);

  // Test 2: Check database connection
  console.log('2. Database Connection:');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Check if BetterAuth tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'organization', 'member', 'invitation')
      ORDER BY table_name;
    `;
    
    console.log('   BetterAuth tables found:', tables.map(t => t.table_name).join(', '));
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
  }

  // Test 3: Check OAuth providers
  console.log('\n3. OAuth Providers:');
  console.log(`   Google: ${process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Facebook: ${process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   TikTok: ${process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET ? '✅ Configured' : '❌ Not configured'}`);

  // Test 4: Recommendations
  console.log('\n4. Recommendations:');
  
  if (!process.env.BETTER_AUTH_SECRET) {
    console.log('   ⚠️  Set BETTER_AUTH_SECRET in your .env file');
  }
  
  if (!process.env.DATABASE_URL) {
    console.log('   ⚠️  Set DATABASE_URL in your .env file');
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('   ⚠️  Set AWS credentials for email functionality');
  }
  
  if (!process.env.AWS_SES_DEFAULT_FROM_EMAIL) {
    console.log('   ⚠️  Set AWS_SES_DEFAULT_FROM_EMAIL for email sending');
  }

  console.log('\n✅ BetterAuth setup test completed!');
}

// Run the test
testBetterAuthSetup().catch(console.error); 