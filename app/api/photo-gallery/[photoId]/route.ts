import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/photo-gallery/[photoId]
 * Delete a photo from the gallery
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
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
    const { photoId } = await params;

    // Verify photo belongs to user
    const photo = await prisma.photoGallery.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    if (photo.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this photo" },
        { status: 403 }
      );
    }

    // Check if photo is used in a listing
    if (photo.status === "listed" && photo.listingId) {
      return NextResponse.json(
        { error: "Cannot delete photo that is currently used in a listing" },
        { status: 400 }
      );
    }

    // Delete from S3
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_BUCKET!;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: photo.s3Key,
      })
    );

    // Delete from database
    await prisma.photoGallery.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting photo from gallery:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/photo-gallery/[photoId]
 * Update photo status (e.g., when used in listing)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
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
    const { photoId } = await params;
    const body = await request.json();
    const { status, listingId } = body;

    // Verify photo belongs to user
    const photo = await prisma.photoGallery.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    if (photo.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this photo" },
        { status: 403 }
      );
    }

    // Update photo
    const updatedPhoto = await prisma.photoGallery.update({
      where: { id: photoId },
      data: {
        status: status || photo.status,
        listingId: listingId !== undefined ? listingId : photo.listingId,
      },
    });

    return NextResponse.json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Error updating photo status:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

