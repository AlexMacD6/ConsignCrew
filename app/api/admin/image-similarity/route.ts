import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getImageSimilarityScore } from '@/lib/image-similarity';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check here
    // For now, we'll assume authenticated users can access this
    // In production, you should check if the user has admin privileges

    const body = await request.json();
    const { imageUrl1, imageUrl2 } = body;

    if (!imageUrl1 || !imageUrl2) {
      return NextResponse.json(
        { error: 'Both imageUrl1 and imageUrl2 are required' },
        { status: 400 }
      );
    }

    // Calculate similarity score
    // Using mock function for now - in production, replace with actual implementation
    const similarityScore = await getImageSimilarityScore(imageUrl1, imageUrl2);

    return NextResponse.json({
      success: true,
      similarity: similarityScore,
      imageUrl1,
      imageUrl2,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating image similarity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}