import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePresignedUrl, validatePhotoFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileName, contentType, photoType } = await request.json();

    // Validate required fields
    if (!fileName || !contentType || !photoType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, contentType, photoType' },
        { status: 400 }
      );
    }

    // Validate photo type
    const validPhotoTypes = ['hero', 'back', 'proof', 'additional'];
    if (!validPhotoTypes.includes(photoType)) {
      return NextResponse.json(
        { error: 'Invalid photo type' },
        { status: 400 }
      );
    }

    // Generate pre-signed URL
    const presignedUrl = await generatePresignedUrl(
      fileName,
      contentType,
      session.user.id
    );

    return NextResponse.json({
      presignedUrl,
      success: true,
    });

  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 