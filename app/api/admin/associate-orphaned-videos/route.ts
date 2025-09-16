import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to associate their own videos
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { listingId, videoId } = await request.json();

    if (!listingId || !videoId) {
      return NextResponse.json(
        { error: 'listingId and videoId are required' },
        { status: 400 }
      );
    }

    // Verify the user owns both the listing and the video
    const listing = await prisma.listing.findFirst({
      where: {
        itemId: listingId,
        userId: session.user.id,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or you do not have permission to edit it' },
        { status: 403 }
      );
    }

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: session.user.id,
      },
      include: {
        listings: {
          select: { id: true, itemId: true }
        }
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found or you do not have permission to access it' },
        { status: 403 }
      );
    }

    // Check if video is already associated with this listing
    const alreadyAssociated = video.listings.some(l => l.id === listing.id);
    if (alreadyAssociated) {
      return NextResponse.json({
        success: true,
        message: 'Video is already associated with this listing',
        videoId: video.id,
        listingId: listing.itemId,
      });
    }

    // Associate the video with the listing
    await prisma.video.update({
      where: { id: videoId },
      data: {
        listings: {
          connect: { id: listing.id }
        }
      }
    });

    console.log(`✅ Associated video ${videoId} with listing ${listingId}`);

    return NextResponse.json({
      success: true,
      message: 'Video successfully associated with listing',
      videoId: video.id,
      listingId: listing.itemId,
    });

  } catch (error) {
    console.error('Error associating video with listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to find orphaned videos for a user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    // Find orphaned videos by this user
    const orphanedVideos = await prisma.video.findMany({
      where: {
        userId: session.user.id,
        status: 'completed', // Only show completed videos
        listings: {
          none: {} // Not associated with any listing
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        originalFilename: true,
        duration: true,
        thumbnailKey: true,
        createdAt: true,
        status: true,
      }
    });

    return NextResponse.json({
      success: true,
      orphanedVideos,
      count: orphanedVideos.length,
      listingId,
    });

  } catch (error) {
    console.error('Error fetching orphaned videos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
