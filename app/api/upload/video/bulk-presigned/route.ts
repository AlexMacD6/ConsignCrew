import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";

// Configure API route for presigned URL generation
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout for presigned URL generation

const prisma = new PrismaClient();

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
    console.log("Bulk video presigned URL: Starting request processing");

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
      console.log("Bulk video presigned URL: Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Bulk video presigned URL: User authenticated:", session.user.id);

    // Parse request body
    const body = await request.json();
    const { fileName, fileSize, fileType, listingId } = body;

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: "fileName, fileSize, and fileType are required" },
        { status: 400 }
      );
    }

    console.log("Bulk video presigned URL: Processing video:", fileName, fileSize);

    // Validate file type
    if (!fileType.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "Video file too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split(".").pop() || "mp4";
    const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`;
    const s3Key = `raw/videos/${session.user.id}/${uniqueFileName}`;

    console.log("Bulk video presigned URL: Generating presigned URL for key:", s3Key);

    // Validate AWS environment variables
    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      console.error("Bulk video presigned URL: S3_BUCKET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error: S3 bucket not configured" },
        { status: 500 }
      );
    }

    console.log("Bulk video presigned URL: Using S3 bucket:", bucketName);

    // Create video record in database first
    const videoRecord = await prisma.video.create({
      data: {
        userId: session.user.id,
        originalFilename: fileName,
        originalSize: fileSize,
        rawVideoKey: s3Key,
        mimeType: fileType,
        status: "uploading", // Set to uploading status initially
        createdAt: new Date(),
      },
    });

    console.log("Bulk video presigned URL: Database record created:", videoRecord.id);

    // Generate presigned URL for upload
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        originalName: fileName,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
        videoId: videoRecord.id,
      },
    });

    // Generate presigned URL with 15 minute expiration
    const presignedUrl = await getSignedUrl(s3Client, uploadCommand, { 
      expiresIn: 900 // 15 minutes
    });

    console.log("Bulk video presigned URL: Generated presigned URL");

    // Generate CloudFront URL for later use
    const cloudFrontDomain = process.env.NEXT_PUBLIC_CDN_URL?.replace('https://', '').replace('http://', '');
    const videoUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}/${s3Key}`
      : `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    console.log("Bulk video presigned URL: Generated video URL:", videoUrl);

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
          console.log("Bulk video presigned URL: Associated with listing:", listing.itemId, "(DB ID:", listing.id, ")");
        } else {
          console.log("Bulk video presigned URL: Listing not found or not owned by user for ID:", listingId);
        }
      } catch (error) {
        console.error("Bulk video presigned URL: Error associating with listing:", error);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      videoId: videoRecord.id,
      presignedUrl,
      videoUrl,
      s3Key,
      message: "Presigned URL generated successfully",
      fileName: uniqueFileName,
      fileSize,
    });

  } catch (error) {
    console.error("Bulk video presigned URL error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate presigned URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
