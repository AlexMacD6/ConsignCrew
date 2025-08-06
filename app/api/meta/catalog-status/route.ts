import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { metaPixelAPI } from '@/lib/meta-pixel-api';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get catalog status from Meta
    const catalogStatus = await metaPixelAPI.getCatalogStatus();

    // Get sync statistics from database
    const syncStats = await prisma.listing.groupBy({
      by: ['metaSyncStatus'],
      where: {
        facebookShopEnabled: true,
      },
      _count: {
        id: true,
      },
    });

    // Get recent sync activity
    const recentSyncs = await prisma.listing.findMany({
      where: {
        facebookShopEnabled: true,
        metaLastSync: {
          not: null,
        },
      },
      select: {
        id: listing.id,
        title: listing.title,
        metaLastSync: listing.metaLastSync,
        metaSyncStatus: listing.metaSyncStatus,
        metaErrorDetails: listing.metaErrorDetails,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        metaLastSync: 'desc',
      },
      take: 10,
    });

    // Calculate statistics
    const stats = {
      total: 0,
      synced: 0,
      pending: 0,
      error: 0,
      deleted: 0,
    };

    syncStats.forEach((stat) => {
      const count = stat._count.id;
      stats.total += count;
      
      switch (stat.metaSyncStatus) {
        case 'success':
          stats.synced += count;
          break;
        case 'pending':
          stats.pending += count;
          break;
        case 'error':
          stats.error += count;
          break;
        case 'deleted':
          stats.deleted += count;
          break;
        default:
          // Count as pending if no sync status
          stats.pending += count;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      catalog: catalogStatus.success ? catalogStatus.data : null,
      catalogError: catalogStatus.error,
      statistics: stats,
      recentSyncs,
      metaConfig: {
        pixelId: process.env.META_PIXEL_ID ? 'Configured' : 'Not configured',
        accessToken: process.env.META_ACCESS_TOKEN ? 'Configured' : 'Not configured',
        catalogId: process.env.META_CATALOG_ID ? 'Configured' : 'Not configured',
        businessId: process.env.META_BUSINESS_ID ? 'Configured' : 'Not configured',
      },
    });

  } catch (error) {
    console.error('Error getting catalog status:', error);
    return NextResponse.json({
      error: 'Failed to get catalog status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 