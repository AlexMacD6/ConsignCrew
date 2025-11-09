import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateSignedPhotoUrl, extractS3Key } from "@/lib/cloudfront-signer";

// Configure route to handle large file uploads
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

// Increase body size limit for file uploads (50MB)
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

/**
 * GET /api/photo-gallery
 * Fetch user's photo gallery with optional filtering
 * Query params: status (available, listed, all)
 * 
 * This endpoint returns photos from:
 * 1. Photos uploaded by the user
 * 2. Photos uploaded by other members of the user's organizations (shared gallery)
 * 
 * Security: Returns signed CloudFront URLs that expire after 60 minutes
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
        mobileItemId: true,
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
        mobileItem: {
          select: {
            id: true,
            status: true,
            appSource: true,
            metadata: {
              select: {
                customItemId: true,
                height: true,
                width: true,
                depth: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    // Generate signed URLs for secure access (60 minute expiry)
    // This prevents unauthorized access to photos
    const photosWithSignedUrls = photos.map((photo) => {
      // Extract S3 key from URL if needed
      const s3Key = photo.s3Key || extractS3Key(photo.url);
      
      // Generate signed URL for full image
      const signedUrl = generateSignedPhotoUrl(s3Key, { expiresInMinutes: 60 });
      
      // Generate signed URL for thumbnail if it exists
      let signedThumbnailUrl = null;
      if (photo.thumbnailUrl) {
        const thumbnailKey = extractS3Key(photo.thumbnailUrl);
        signedThumbnailUrl = generateSignedPhotoUrl(thumbnailKey, { expiresInMinutes: 60 });
      }

      return {
        ...photo,
        url: signedUrl,
        thumbnailUrl: signedThumbnailUrl,
      };
    });

    return NextResponse.json({
      photos: photosWithSignedUrls,
      count: photosWithSignedUrls.length,
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
    
    // Log request details for debugging
    console.log('📤 Photo upload request received');
    console.log('   User ID:', userId);
    console.log('   Content-Type:', request.headers.get('content-type'));
    console.log('   Content-Length:', request.headers.get('content-length'));
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error('❌ No file in FormData');
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log('📎 File received:');
    console.log('   Name:', file.name);
    console.log('   Type:', file.type);
    console.log('   Size:', file.size, 'bytes');

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes');
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }
    
    // Validate file size is not zero
    if (file.size === 0) {
      console.error('❌ File size is zero');
      return NextResponse.json(
        { error: "File is empty. Please try selecting the photo again." },
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
    const sharp = (await import("sharp")).default;
    
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
    const thumbnailS3Key = `photo-gallery/${userId}/thumbnails/${timestamp}-thumb-${sanitizedFilename}`;

    console.log('🔄 Converting file to buffer...');
    
    // Convert file to buffer with multiple retry strategies
    let buffer: Buffer;
    
    try {
      // Try method 1: arrayBuffer (works most of the time)
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate buffer is not empty
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        console.warn('⚠️ arrayBuffer is empty, trying alternative method...');
        
        // Try method 2: Read as blob then convert
        const blob = file.slice(0, file.size);
        const arrayBuffer2 = await blob.arrayBuffer();
        
        if (!arrayBuffer2 || arrayBuffer2.byteLength === 0) {
          console.error('❌ Both buffer reading methods failed');
          console.error('   File name:', file.name);
          console.error('   File size:', file.size);
          console.error('   File type:', file.type);
          return NextResponse.json(
            { 
              error: "Failed to read file data. The file may be corrupted. Please try again.",
              details: "Empty buffer received from file"
            },
            { status: 400 }
          );
        }
        
        buffer = Buffer.from(arrayBuffer2);
        console.log('✓ Buffer read using alternative method');
      } else {
        buffer = Buffer.from(arrayBuffer);
        console.log('✓ Buffer read successfully');
      }
    } catch (error) {
      console.error('❌ Error reading file buffer:', error);
      return NextResponse.json(
        { 
          error: "Failed to process file. Please try again.",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
    
    // Final validation - ensure buffer is not empty
    if (!buffer || buffer.length === 0) {
      console.error('❌ Buffer is empty after conversion');
      console.error('   File name:', file.name);
      console.error('   File size:', file.size);
      return NextResponse.json(
        { error: "File data could not be read. Please try uploading again." },
        { status: 400 }
      );
    }

    console.log(`✓ Buffer ready: ${buffer.length} bytes`);

    // Get image metadata and dimensions
    let imageMetadata;
    let width = null;
    let height = null;
    
    try {
      imageMetadata = await sharp(buffer).metadata();
      width = imageMetadata.width || null;
      height = imageMetadata.height || null;
      console.log(`Image dimensions: ${width}x${height}`);
    } catch (error) {
      console.error("Error reading image metadata:", error);
      return NextResponse.json(
        { error: "Invalid image file. Please ensure the file is a valid image." },
        { status: 400 }
      );
    }

    // Generate thumbnail (400x400 max, maintain aspect ratio)
    let thumbnailBuffer;
    try {
      thumbnailBuffer = await sharp(buffer)
        .resize(400, 400, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      console.log(`Generated thumbnail (${thumbnailBuffer.length} bytes)`);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return NextResponse.json(
        { error: "Failed to generate thumbnail. Please try again." },
        { status: 500 }
      );
    }

    // Upload original image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Upload thumbnail to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailS3Key,
        Body: thumbnailBuffer,
        ContentType: "image/jpeg",
      })
    );

    // Generate URLs - ensure protocol is included
    let cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || `https://${bucketName}.s3.us-east-1.amazonaws.com`;
    
    // Add https:// if not present
    if (cdnDomain && !cdnDomain.startsWith('http://') && !cdnDomain.startsWith('https://')) {
      cdnDomain = `https://${cdnDomain}`;
    }
    
    const url = `${cdnDomain}/${s3Key}`;
    const thumbnailUrl = `${cdnDomain}/${thumbnailS3Key}`;

    // Save to database with organizationId for shared access
    const photo = await prisma.photoGallery.create({
      data: {
        userId,
        organizationId, // Tag with organization for shared gallery
        s3Key,
        url,
        thumbnailUrl, // Add thumbnail URL
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width, // Store image dimensions
        height,
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

