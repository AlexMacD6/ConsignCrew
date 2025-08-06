import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
import { generateVideoUploadUrl, validateVideoFile } from '@/lib/video-upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== VIDEO UPLOAD PRESIGNED URL ===');
    
    // Temporarily bypass auth for testing
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    
    // Get a real user ID for testing (since we're bypassing auth)
    const { prisma } = await import('@/lib/prisma');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 500 }
      );
    }
    const testUserId = users[0].id;
    console.log('Using test user ID for video upload');

    const { fileName, contentType, fileSize } = await request.json();
    console.log('Request data:', { fileName, contentType, fileSize });

    // Validate required fields
    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, contentType, fileSize' },
        { status: 400 }
      );
    }

    // Create a mock file object for validation
    const mockFile = {
      name: fileName,
      type: contentType,
      size: fileSize,
    } as File;

    // Validate video file
    const validation = validateVideoFile(mockFile);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('File validation passed');

    // Create video record in database
    console.log('Creating video record...');
    const video = await prisma.video.create({
      data: {
        userId: testUserId,
        originalFilename: fileName,
        originalSize: fileSize,
        mimeType: contentType,
        status: 'pending',
        rawVideoKey: '', // Will be set after upload
      },
    });
    console.log('Video record created:', video.id);

    // Generate pre-signed URL
    console.log('Generating presigned URL...');
    const { presignedUrl, fileKey } = await generateVideoUploadUrl(
      fileName,
      contentType,
      testUserId,
      video.id
    );
    console.log('Presigned URL generated');

    // Update video record with the file key
    await prisma.video.update({
      where: { id: video.id },
      data: { rawVideoKey: fileKey },
    });
    console.log('Video record updated with file key');

    return NextResponse.json({
      presignedUrl,
      videoId: video.id,
      fileKey,
      success: true,
    });

  } catch (error) {
    console.error('Error generating video upload URL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 