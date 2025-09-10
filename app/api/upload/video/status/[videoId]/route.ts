import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProcessedVideoUrl, getVideoThumbnailUrl, getVideoFrameUrl } from '@/lib/video-upload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
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
    const { prisma } = await import('@/lib/prisma');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 500 }
      );
    }
    const testUserId = users[0].id;

    const { videoId } = await params;

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

    // Prepare response based on status
    const response: any = {
      videoId,
      status: video.status,
      originalFilename: video.originalFilename,
      originalSize: video.originalSize,
      rawVideoKey: video.rawVideoKey,
      processedVideoKey: video.processedVideoKey,
      thumbnailKey: video.thumbnailKey,
      frameKeys: video.frameKeys,
      duration: video.duration,
      resolution: video.resolution,
      mimeType: video.mimeType,
      processingError: video.processingError,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };

    // Add URLs and metadata if processing is completed
    if (video.status === 'completed') {
      console.log('Video completed, frameKeys:', video.frameKeys);
      console.log('FrameKeys type:', typeof video.frameKeys);
      console.log('FrameKeys length:', video.frameKeys ? (video.frameKeys as string[]).length : 0);
      
      const frameUrls = video.frameKeys ? 
        (video.frameKeys as string[]).map((_, index) => getVideoFrameUrl(videoId, index)) : 
        [];
      
      console.log('Generated frame URLs:', frameUrls);
      
      response.urls = {
        processedVideo: getProcessedVideoUrl(videoId),
        thumbnail: getVideoThumbnailUrl(videoId),
        frames: frameUrls,
      };
      
      response.metadata = {
        duration: video.duration,
        resolution: video.resolution,
        frameCount: video.frameKeys ? (video.frameKeys as string[]).length : 0,
      };
    }

    // Add error information if processing failed
    if (video.status === 'failed') {
      response.error = video.processingError;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting video status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    
    const { status, frameUrls, frameCount, duration, thumbnailUrl } = body;

    // Update video record
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        status: status || 'completed',
        frameKeys: frameUrls || [],
        duration: duration || null,
        thumbnailKey: thumbnailUrl || null,
        updatedAt: new Date(),
      },
    });

    console.log('Video record updated:', updatedVideo);

    return NextResponse.json({
      success: true,
      video: {
        videoId: updatedVideo.id,
        videoUrl: null, // We're not storing the actual video URL
        thumbnailUrl: updatedVideo.thumbnailKey,
        frameUrls: updatedVideo.frameKeys || [],
        duration: updatedVideo.duration,
        processing: false,
        error: null,
        uploaded: true,
      }
    });

  } catch (error) {
    console.error('Error updating video status:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
} 