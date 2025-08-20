import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Validate if a zip code is approved for buying
 * POST /api/zipcodes/validate
 * Body: { zipCode: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { zipCode } = await request.json();

    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      );
    }

    // Find the zip code in the database
    const zipCodeRecord = await prisma.zipCode.findFirst({
      where: { code: zipCode }
    });

    if (!zipCodeRecord) {
      return NextResponse.json({
        success: false,
        isValid: false,
        message: 'This zip code is not in our service area.',
        code: 'ZIP_NOT_SERVICE_AREA'
      });
    }

    // Check if it's a buyer zip code
    if (zipCodeRecord.type === 'buyer') {
      return NextResponse.json({
        success: true,
        isValid: true,
        message: 'Zip code is valid for buying.',
        area: zipCodeRecord.area,
        type: zipCodeRecord.type
      });
    }

    // Check if it's a seller zip code (also valid for buying)
    if (zipCodeRecord.type === 'seller') {
      return NextResponse.json({
        success: true,
        isValid: true,
        message: 'Zip code is valid for buying.',
        area: zipCodeRecord.area,
        type: zipCodeRecord.type
      });
    }

    // If we get here, the zip code exists but has an unknown type
    return NextResponse.json({
      success: false,
      isValid: false,
      message: 'This zip code is not configured for our service.',
      code: 'ZIP_TYPE_UNKNOWN'
    });

  } catch (error) {
    console.error('Error validating zip code:', error);
    return NextResponse.json(
      { error: 'Failed to validate zip code' },
      { status: 500 }
    );
  }
}
