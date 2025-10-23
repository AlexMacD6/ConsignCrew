import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

// Validate AWS environment variables at startup
const validateAWSConfig = () => {
  const required = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing AWS environment variables:', missing);
    return false;
  }
  return true;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    console.log("Bulk video upload: Starting request processing");

    // Validate AWS configuration
    if (!validateAWSConfig()) {
      return NextResponse.json(
        { error: "Server configuration error: AWS credentials not properly configured" },
        { status: 500 }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      console.log("Bulk video upload: Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Bulk video upload: User authenticated:", session.user.id);

    // Parse form data
    const formData = await request.formData();
    const video = formData.get("video") as File;
    const listingId = formData.get("listingId") as string;

    if (!video) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log("Bulk video upload: Processing video:", video.name, video.size);

    // Validate file type
    if (!video.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (video.size > maxSize) {
      return NextResponse.json(
        { error: "Video file too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = video.name.split(".").pop() || "mp4";
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const s3Key = `raw/videos/${session.user.id}/${fileName}`;

    console.log("Bulk video upload: Uploading to S3 with key:", s3Key);

    // Validate AWS environment variables
    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      console.error("Bulk video upload: S3_BUCKET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error: S3 bucket not configured" },
        { status: 500 }
      );
    }

    console.log("Bulk video upload: Using S3 bucket:", bucketName);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: new Uint8Array(await video.arrayBuffer()),
      ContentType: video.type,
      Metadata: {
        originalName: video.name,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);
    console.log("Bulk video upload: S3 upload completed");

    // Create video record in database
    const videoRecord = await prisma.video.create({
      data: {
        userId: session.user.id,
        originalFilename: video.name,
        originalSize: video.size,
        rawVideoKey: s3Key,
        mimeType: video.type,
        status: "uploaded",
        createdAt: new Date(),
      },
    });

    console.log("Bulk video upload: Database record created:", videoRecord.id);

    // Generate CloudFront URL
    const cloudFrontDomain = process.env.NEXT_PUBLIC_CDN_URL?.replace('https://', '').replace('http://', '');
    const videoUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}/${s3Key}`
      : `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    console.log("Bulk video upload: Generated video URL:", videoUrl);

    // Generate a placeholder thumbnail URL that will be processed client-side
    // The actual thumbnail will be generated when the video is first loaded in the browser
    const thumbnailUrl = null; // Will be generated client-side when needed
    
    console.log("Bulk video upload: Video uploaded, thumbnail will be generated client-side");

    // If listingId is provided, associate the video with the listing
    if (listingId) {
      try {
        // Check if user owns the listing (listingId could be itemId or database id)
        const listing = await prisma.listing.findFirst({
          where: {
            OR: [
              { id: listingId }, // Database ID
              { itemId: listingId } // Public item ID
            ],
            userId: session.user.id,
          },
        });

        if (listing) {
          // Update listing to include this video
          await prisma.listing.update({
            where: { id: listing.id }, // Use the database ID we found
            data: {
              // Add to videos array or create array if it doesn't exist
              videos: {
                connect: { id: videoRecord.id },
              },
            },
          });
          console.log("Bulk video upload: Associated with listing:", listing.itemId, "(DB ID:", listing.id, ")");
        } else {
          console.log("Bulk video upload: Listing not found or not owned by user for ID:", listingId);
        }
      } catch (error) {
        console.error("Bulk video upload: Error associating with listing:", error);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      videoId: videoRecord.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded successfully",
      fileName: video.name,
      fileSize: video.size,
    });

  } catch (error) {
    console.error("Bulk video upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
