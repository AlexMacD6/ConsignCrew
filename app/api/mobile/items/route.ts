/**
 * Mobile Items API Endpoint
 * 
 * Receives metadata from Selling to Sold mobile app and links it to uploaded photos.
 * This allows users to attach dimensions, notes, and custom IDs to their photos.
 * 
 * POST /api/mobile/items
 * - Create a new item with metadata and link to existing photos
 * 
 * GET /api/mobile/items
 * - Retrieve all mobile items for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { headers } from 'next/headers';

/**
 * GET /api/mobile/items
 * Retrieve all mobile items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get all mobile items for this user with their media and metadata
    const items = await prisma.mobileItem.findMany({
      where: { userId },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error fetching mobile items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/items
 * Create a new item with metadata and link to existing photos
 * 
 * Body: {
 *   mediaIds: string[],  // Array of PhotoGallery IDs
 *   metadata: {
 *     itemId?: string,   // User-provided item ID
 *     height?: string,   // Dimensions in inches
 *     width?: string,
 *     depth?: string,
 *     notes?: string     // User notes
 *   },
 *   appSource?: string,  // Source app (default: "selling-to-sold")
 *   createdAt?: number   // Unix timestamp
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    console.log('📦 Mobile item creation request received');
    console.log('   User ID:', userId);
    
    const body = await request.json();
    const { mediaIds, metadata, appSource, createdAt } = body;

    console.log('   Media IDs:', mediaIds);
    console.log('   Metadata:', metadata);

    // Validate required fields
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'mediaIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Verify that all mediaIds belong to this user
    const photos = await prisma.photoGallery.findMany({
      where: {
        id: { in: mediaIds },
        userId: userId,
      },
    });

    if (photos.length !== mediaIds.length) {
      console.error('❌ Some media IDs do not belong to user or do not exist');
      return NextResponse.json(
        { error: 'Some media IDs are invalid or do not belong to you' },
        { status: 400 }
      );
    }

    // Create mobile item
    const mobileItem = await prisma.mobileItem.create({
      data: {
        userId,
        appSource: appSource || 'selling-to-sold',
        status: 'pending',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    console.log('✅ Mobile item created:', mobileItem.id);

    // Create metadata if provided
    if (metadata) {
      await prisma.mobileItemMetadata.create({
        data: {
          mobileItemId: mobileItem.id,
          customItemId: metadata.itemId || null,
          height: metadata.height || null,
          width: metadata.width || null,
          depth: metadata.depth || null,
          notes: metadata.notes || null,
        },
      });

      console.log('✅ Metadata created for mobile item');
    }

    // Link photos to this mobile item
    await prisma.photoGallery.updateMany({
      where: {
        id: { in: mediaIds },
      },
      data: {
        mobileItemId: mobileItem.id,
      },
    });

    console.log('✅ Linked', mediaIds.length, 'photos to mobile item');

    // Fetch the complete item with relations
    const completeItem = await prisma.mobileItem.findUnique({
      where: { id: mobileItem.id },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
        metadata: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        item: completeItem,
        message: 'Item created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating mobile item:', error);
    return NextResponse.json(
      { error: 'Failed to create mobile item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mobile/items/:id
 * Update an existing mobile item's metadata or status
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get session from auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { itemId, metadata, status } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Verify item belongs to user
    const item = await prisma.mobileItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      await prisma.mobileItem.update({
        where: { id: itemId },
        data: { status },
      });
    }

    // Update metadata if provided
    if (metadata) {
      // Check if metadata exists
      const existingMetadata = await prisma.mobileItemMetadata.findUnique({
        where: { mobileItemId: itemId },
      });

      if (existingMetadata) {
        // Update existing metadata
        await prisma.mobileItemMetadata.update({
          where: { mobileItemId: itemId },
          data: {
            customItemId: metadata.itemId ?? existingMetadata.customItemId,
            height: metadata.height ?? existingMetadata.height,
            width: metadata.width ?? existingMetadata.width,
            depth: metadata.depth ?? existingMetadata.depth,
            notes: metadata.notes ?? existingMetadata.notes,
          },
        });
      } else {
        // Create new metadata
        await prisma.mobileItemMetadata.create({
          data: {
            mobileItemId: itemId,
            customItemId: metadata.itemId || null,
            height: metadata.height || null,
            width: metadata.width || null,
            depth: metadata.depth || null,
            notes: metadata.notes || null,
          },
        });
      }
    }

    // Fetch updated item
    const updatedItem = await prisma.mobileItem.findUnique({
      where: { id: itemId },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
        },
        metadata: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating mobile item:', error);
    return NextResponse.json(
      { error: 'Failed to update mobile item' },
      { status: 500 }
    );
  }
}

