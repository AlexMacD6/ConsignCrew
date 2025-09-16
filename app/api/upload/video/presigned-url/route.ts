import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateVideoUploadUrl, validateVideoFile } from '@/lib/video-upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('=== VIDEO UPLOAD PRESIGNED URL ===');
    
    // Restore proper authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    console.log('Authenticated user ID:', userId);

    const { fileName, contentType, fileSize, listingId } = await request.json();
    console.log('Request data:', { fileName, contentType, fileSize, listingId });

    // Validate required fields
    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, contentType, fileSize' },
        { status: 400 }
      );
    }

    // If listingId is provided, validate that the user owns the listing
    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: {
          itemId: listingId,
          userId: userId,
        },
      });

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found or you do not have permission to edit it' },
          { status: 403 }
        );
      }
      console.log('Listing validation passed for:', listingId);
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
        userId: userId,
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
      userId,
      video.id
    );
    console.log('Presigned URL generated');

    // Update video record with the file key and optionally associate with listing
    const updateData: any = { rawVideoKey: fileKey };
    
    // If listingId is provided, immediately associate the video with the listing
    if (listingId) {
      console.log('Associating video with listing:', listingId);
      updateData.listings = {
        connect: { itemId: listingId }
      };
    }

    await prisma.video.update({
      where: { id: video.id },
      data: updateData,
    });
    console.log('Video record updated with file key and listing association');

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