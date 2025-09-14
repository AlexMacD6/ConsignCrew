import { NextRequest, NextResponse } from 'next/server';
import { autoReleaseExpiredHolds } from '@/lib/auto-release-holds';

/**
 * Test endpoint to manually trigger hold cleanup
 * GET /api/test/cleanup-holds
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Manual cleanup test: Starting...');
    
    const result = await autoReleaseExpiredHolds();
    
    console.log('Manual cleanup test: Completed', result);
    
    return NextResponse.json({
      success: true,
      message: `Released ${result.releasedCount} expired holds`,
      releasedCount: result.releasedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Manual cleanup test error:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export const POST = GET;
