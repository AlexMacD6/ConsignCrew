import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/photo-gallery
 * Fetch user's photo gallery with optional filtering
 * Query params: status (available, listed, all)
 * 
 * This endpoint returns photos from:
 * 1. Photos uploaded by the user
 * 2. Photos uploaded by other members of the user's organizations (shared gallery)
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "available"; // available, listed, all
    const organizationId = searchParams.get("organizationId"); // Optional: filter by specific organization

    // Get user's organization memberships to fetch shared photos
    const userOrganizations = await prisma.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    const userOrgIds = userOrganizations.map((m) => m.organizationId);

    // Build query based on status filter
    const where: any = {
      OR: [
        { userId }, // User's own photos
        ...(userOrgIds.length > 0
          ? [
              {
                // Photos from organization members (shared gallery)
                organizationId: organizationId
                  ? organizationId // Specific organization if requested
                  : { in: userOrgIds }, // All user's organizations
              },
            ]
          : []),
      ],
    };

    if (status !== "all") {
      where.status = status;
    }

    // Fetch photos from database
    const photos = await prisma.photoGallery.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        s3Key: true,
        url: true,
        thumbnailUrl: true,
        originalFilename: true,
        fileSize: true,
        mimeType: true,
        width: true,
        height: true,
        status: true,
        listingId: true,
        userId: true,
        organizationId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      photos,
      count: photos.length,
    });
  } catch (error) {
    console.error("Error fetching photo gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photo-gallery
 * Upload a new photo to the gallery
 * 
 * Photos are automatically tagged with the user's primary organization
 * to enable shared gallery access across organization members
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get user's primary organization (first one they're a member of)
    // This enables shared gallery across organization members
    const userMembership = await prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    const organizationId = userMembership?.organizationId || null;

    // Upload to S3
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_BUCKET!;
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const s3Key = `photo-gallery/${userId}/${timestamp}-${sanitizedFilename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Generate URL - ensure protocol is included
    let cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || `https://${bucketName}.s3.us-east-1.amazonaws.com`;
    
    // Add https:// if not present
    if (cdnDomain && !cdnDomain.startsWith('http://') && !cdnDomain.startsWith('https://')) {
      cdnDomain = `https://${cdnDomain}`;
    }
    
    const url = `${cdnDomain}/${s3Key}`;

    // Save to database with organizationId for shared access
    const photo = await prisma.photoGallery.create({
      data: {
        userId,
        organizationId, // Tag with organization for shared gallery
        s3Key,
        url,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: "available",
      },
    });

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Error uploading photo to gallery:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

