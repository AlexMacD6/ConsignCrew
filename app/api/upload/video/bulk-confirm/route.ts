import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("Bulk video upload confirm: Starting request processing");

    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      console.log("Bulk video upload confirm: Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Bulk video upload confirm: User authenticated:", session.user.id);

    // Parse request body
    const body = await request.json();
    const { videoId, success } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    console.log("Bulk video upload confirm: Processing video ID:", videoId, "Success:", success);

    // Update video record status
    const videoRecord = await prisma.video.update({
      where: { 
        id: videoId,
        userId: session.user.id, // Ensure user owns the video
      },
      data: {
        status: success ? "uploaded" : "failed",
        updatedAt: new Date(),
      },
    });

    console.log("Bulk video upload confirm: Updated video record:", videoRecord.id, "Status:", videoRecord.status);

    // Generate CloudFront URL
    const cloudFrontDomain = process.env.NEXT_PUBLIC_CDN_URL?.replace('https://', '').replace('http://', '');
    const videoUrl = cloudFrontDomain && videoRecord.rawVideoKey
      ? `https://${cloudFrontDomain}/${videoRecord.rawVideoKey}`
      : null;

    return NextResponse.json({
      success: true,
      videoId: videoRecord.id,
      videoUrl,
      status: videoRecord.status,
      message: success ? "Video upload confirmed successfully" : "Video upload marked as failed",
    });

  } catch (error) {
    console.error("Bulk video upload confirm error:", error);
    return NextResponse.json(
      {
        error: "Failed to confirm video upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
