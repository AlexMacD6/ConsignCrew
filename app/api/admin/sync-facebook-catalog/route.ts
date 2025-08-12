import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { metaPixelAPI } from '@/lib/meta-pixel-api';

/**
 * Manual sync endpoint to sync existing listings to Facebook catalog
 * This fixes the catalog matching issue for ViewContent events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) missingVars.push('NEXT_PUBLIC_META_PIXEL_ID');
    if (!process.env.META_ACCESS_TOKEN) missingVars.push('META_ACCESS_TOKEN');
    if (!process.env.META_CATALOG_ID) missingVars.push('META_CATALOG_ID');

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing Meta environment variables',
        missingVars,
        message: 'Please configure the missing environment variables before syncing to Facebook catalog.'
      }, { status: 400 });
    }

    // Get all active listings that are enabled for Facebook Shop but haven't been synced
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
        facebookShopEnabled: true,
        OR: [
          { metaLastSync: null },
          { metaSyncStatus: 'error' },
          { metaSyncStatus: 'pending' }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            id: true
          }
        }
      },
      take: 50 // Process in batches to avoid timeout
    });

    console.log(`Found ${listings.length} listings to sync to Facebook catalog`);

    const results = {
      total: listings.length,
      synced: 0,
      errors: 0,
      details: [] as any[]
    };

    // Sync each listing to Facebook catalog
    for (const listing of listings) {
      try {
        console.log(`Syncing listing ${listing.itemId} (${listing.title}) to Facebook catalog...`);

        // Update status to pending
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            metaSyncStatus: 'pending',
            metaLastSync: new Date()
          }
        });

        // Sync to Meta catalog
        const syncResult = await metaPixelAPI.syncProduct(listing);

        if (syncResult.success) {
          // Update with success status
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              metaSyncStatus: 'success',
              metaProductId: syncResult.productId || listing.itemId,
              metaCatalogId: process.env.META_CATALOG_ID,
              metaErrorDetails: null,
              metaLastSync: new Date()
            }
          });

          results.synced++;
          results.details.push({
            itemId: listing.itemId,
            title: listing.title,
            status: 'success',
            metaProductId: syncResult.productId
          });

          console.log(`✅ Successfully synced ${listing.itemId} to Facebook catalog`);
        } else {
          // Update with error status
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              metaSyncStatus: 'error',
              metaErrorDetails: syncResult.error || 'Unknown error',
              metaLastSync: new Date()
            }
          });

          results.errors++;
          results.details.push({
            itemId: listing.itemId,
            title: listing.title,
            status: 'error',
            error: syncResult.error
          });

          console.error(`❌ Failed to sync ${listing.itemId}: ${syncResult.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing listing ${listing.itemId}:`, error);
        
        // Update with error status
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            metaSyncStatus: 'error',
            metaErrorDetails: error instanceof Error ? error.message : 'Processing error',
            metaLastSync: new Date()
          }
        });

        results.errors++;
        results.details.push({
          itemId: listing.itemId,
          title: listing.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Processing error'
        });
      }
    }

    console.log(`Facebook catalog sync complete: ${results.synced} synced, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Facebook catalog sync completed',
      results,
      nextSteps: results.synced > 0 ? [
        'Check Meta Commerce Manager for newly synced products',
        'ViewContent events should now match catalog products',
        'Test by visiting a listing page and checking Meta Pixel Helper'
      ] : []
    });

  } catch (error) {
    console.error('Error syncing Facebook catalog:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync Facebook catalog',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get sync status for all listings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sync statistics
    const stats = await prisma.listing.groupBy({
      by: ['metaSyncStatus'],
      where: {
        facebookShopEnabled: true
      },
      _count: {
        id: true
      }
    });

    // Get recent sync activity
    const recentSyncs = await prisma.listing.findMany({
      where: {
        facebookShopEnabled: true,
        metaLastSync: {
          not: null
        }
      },
      select: {
        itemId: true,
        title: true,
        metaLastSync: true,
        metaSyncStatus: true,
        metaErrorDetails: true,
        metaProductId: true
      },
      orderBy: {
        metaLastSync: 'desc'
      },
      take: 10
    });

    // Calculate summary
    const summary = {
      total: 0,
      synced: 0,
      pending: 0,
      error: 0,
      notSynced: 0
    };

    stats.forEach(stat => {
      const count = stat._count.id;
      summary.total += count;
      
      switch (stat.metaSyncStatus) {
        case 'success':
          summary.synced += count;
          break;
        case 'pending':
          summary.pending += count;
          break;
        case 'error':
          summary.error += count;
          break;
        default:
          summary.notSynced += count;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      summary,
      recentSyncs,
      environmentCheck: {
        pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ? 'Configured' : 'Missing',
        accessToken: process.env.META_ACCESS_TOKEN ? 'Configured' : 'Missing',
        catalogId: process.env.META_CATALOG_ID ? 'Configured' : 'Missing',
        businessId: process.env.META_BUSINESS_ID ? 'Configured' : 'Missing'
      }
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
