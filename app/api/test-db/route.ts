import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 60));
    console.log('DATABASE_URL contains channel_binding:', process.env.DATABASE_URL?.includes('channel_binding'));
    
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Count total listings
    const totalListings = await prisma.listing.count();
    console.log('Total listings in database:', totalListings);
    
    // Count active listings
    const activeListings = await prisma.listing.count({
      where: { status: 'active' }
    });
    console.log('Active listings:', activeListings);
    
    // Get a sample listing to check structure
    const sampleListing = await prisma.listing.findFirst({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            zipCode: true
          }
        }
      }
    });
    
    console.log('Sample listing:', sampleListing);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      data: {
        totalListings,
        activeListings,
        sampleListing,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined,
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      databaseInfo: {
        urlLength: process.env.DATABASE_URL?.length,
        urlStart: process.env.DATABASE_URL?.substring(0, 60),
        hasChannelBinding: process.env.DATABASE_URL?.includes('channel_binding'),
      }
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
} 