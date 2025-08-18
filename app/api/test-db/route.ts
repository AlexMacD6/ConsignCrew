import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    
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
        },
        photos: true
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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
} 