import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/auth-utils';

/**
 * GET /api/admin/download-video?videoId=xxx
 * Download video file - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request.headers);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const videoUrl = searchParams.get('videoUrl');

    if (!videoId && !videoUrl) {
      return NextResponse.json({ error: 'Video ID or URL is required' }, { status: 400 });
    }

    let downloadUrl = videoUrl;

    // If we have a videoId, we could fetch the video record and get the URL
    // For now, we'll use the provided videoUrl directly
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Video URL not found' }, { status: 404 });
    }

    // Ensure the URL is properly formatted
    if (!downloadUrl.startsWith('http')) {
      downloadUrl = `https://${downloadUrl}`;
    }

    try {
      // Fetch the video file
      const videoResponse = await fetch(downloadUrl);
      
      if (!videoResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch video file' }, { status: 404 });
      }

      // Get the video content
      const videoBuffer = await videoResponse.arrayBuffer();
      
      // Extract filename from URL or use default
      const urlParts = downloadUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || `video-${videoId || 'download'}.mp4`;
      
      // Return the video file with appropriate headers
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': videoBuffer.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      console.error('Error fetching video:', fetchError);
      return NextResponse.json({ error: 'Failed to download video file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in download-video API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
