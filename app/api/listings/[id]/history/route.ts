import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch listing history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    // Find the listing by itemId
    const listing = await prisma.listing.findUnique({
      where: { itemId: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Fetch history events for this listing
    const history = await prisma.listingHistory.findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error('Error fetching listing history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listing history' },
      { status: 500 }
    );
  }
}

// POST - Create a new history event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.id;
    const body = await request.json();
    const { eventType, eventTitle, description, metadata } = body;

    // Validate required fields
    if (!eventType || !eventTitle || !description) {
      return NextResponse.json({
        error: 'Missing required fields: eventType, eventTitle, description'
      }, { status: 400 });
    }

    // Find the listing by itemId
    const listing = await prisma.listing.findUnique({
      where: { itemId: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Create the history event
    const historyEvent = await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        eventType,
        eventTitle,
        description,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({
      success: true,
      historyEvent,
    });

  } catch (error) {
    console.error('Error creating listing history event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create history event' },
      { status: 500 }
    );
  }
} 