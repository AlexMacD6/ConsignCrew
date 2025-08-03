import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processVideo } from '@/lib/ffmpeg-processor';
import { getVideoPublicUrl, getProcessedVideoUrl, getVideoThumbnailUrl, getVideoFrameUrl } from '@/lib/video-upload';

export async function POST(request: NextRequest) {
  try {
    // Temporarily bypass auth for testing
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    
    // Get a real user ID for testing (since we're bypassing auth)
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 500 }
      );
    }
    const testUserId = users[0].id;
    console.log('Using test user ID for processing:', testUserId);

    const { videoId } = await request.json();

    // Validate required fields
    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing required field: videoId' },
        { status: 400 }
      );
    }

    // Get video record
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user owns the video (using test user ID for now)
    if (video.userId !== testUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if video is already being processed or completed
    if (video.status === 'processing') {
      return NextResponse.json(
        { error: 'Video is already being processed' },
        { status: 400 }
      );
    }

    if (video.status === 'completed') {
      return NextResponse.json(
        { error: 'Video has already been processed' },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'processing' },
    });

    try {
      // Process video with FFmpeg
      console.log(`Starting video processing for video ID: ${videoId}`);
      
      const result = await processVideo(
        video.rawVideoKey,
        videoId,
        testUserId
      );

      // Update video record with processing results
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'completed',
          processedVideoKey: result.processedVideoKey,
          thumbnailKey: result.thumbnailKey,
          frameKeys: result.frameKeys,
          duration: result.metadata.duration,
          resolution: `${result.metadata.width}x${result.metadata.height}`,
        },
      });

      // Return success response with URLs
      return NextResponse.json({
        success: true,
        videoId,
        status: 'completed',
        urls: {
          processedVideo: getProcessedVideoUrl(videoId),
          thumbnail: getVideoThumbnailUrl(videoId),
          frames: result.frameKeys.map((_, index) => getVideoFrameUrl(videoId, index)),
        },
        metadata: {
          duration: result.metadata.duration,
          resolution: `${result.metadata.width}x${result.metadata.height}`,
          frameCount: result.frameKeys.length,
        },
      });

    } catch (processingError) {
      console.error(`Video processing failed for video ID ${videoId}:`, processingError);

      // Update video record with error status
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'failed',
          processingError: processingError instanceof Error ? processingError.message : 'Unknown processing error',
        },
      });

      return NextResponse.json(
        { 
          error: 'Video processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 