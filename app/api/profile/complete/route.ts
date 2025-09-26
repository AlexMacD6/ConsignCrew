import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Combined profile endpoint that returns user profile, permissions, admin status, listings, and purchases
 * This reduces the number of API calls needed for the profile page from 6+ to 1
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Complete Profile API: Request received');
    
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    console.log('Complete Profile API: Session retrieved');
    
    if (!session?.user?.id) {
      console.log('Complete Profile API: No valid session found');
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please log in to access your profile"
      }, { status: 401 });
    }

    console.log('Complete Profile API: Session found for user:', session.user.id);

    // Start all database queries in parallel
    const [
      user,
      memberships,
      listings,
      purchases
    ] = await Promise.all([
      // Get user profile
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          mobilePhone: true,
          emailVerified: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      
      // Get user's organization memberships for permissions
      prisma.member.findMany({
        where: { userId: session.user.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      }),
      
      // Get user's listings with inventory data for purchase price calculation
      prisma.listing.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          itemId: true,
          title: true,
          description: true,
          price: true,
          salePrice: true,
          salePriceEffectiveDate: true,
          discountSchedule: true,
          reservePrice: true,
          status: true,
          photos: true,
          views: true,
          saves: true,
          createdAt: true,
          updatedAt: true,
          // Transaction tracking fields
          purchasePrice: true,
          transactionPrice: true,
          paymentMethod: true,
          salesTax: true,
          taxRate: true,
          soldAt: true,
          comments: true,
          fulfillmentMethod: true,
          // Inventory relationship for purchase price calculation
          inventoryItems: {
            select: {
              id: true,
              purchasePrice: true,
              quantity: true,
              unitRetail: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get user's purchases
      prisma.order.findMany({
        where: { buyerId: session.user.id },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          deliveredAt: true,
          trackingNumber: true,
          listing: {
            select: {
              itemId: true,
              title: true,
              photos: true,
              estimatedRetailPrice: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!user) {
      console.log('Complete Profile API: User not found in database');
      return NextResponse.json({ 
        error: "User not found",
        message: "User account not found in database"
      }, { status: 404 });
    }

    // Calculate permissions based on organization membership
    const organizations = memberships.map(m => ({
      id: m.id,
      organizationId: m.organization.id,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      role: m.role,
      joinedAt: m.createdAt,
    }));

    const isSeller = organizations.some(org => org.organizationSlug === 'sellers');
    const isBuyer = organizations.some(org => org.organizationSlug === 'buyers');
    const isAdmin = organizations.some(org => 
      org.organizationSlug === 'treasurehub-admin' || 
      org.role === 'ADMIN' || 
      org.role === 'OWNER'
    );

    // Transform purchases data
    const transformedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      total: purchase.amount, // Use amount field from Order model
      status: purchase.status,
      purchaseDate: purchase.createdAt,
      deliveredAt: purchase.deliveredAt,
      trackingNumber: purchase.trackingNumber,
      listingId: purchase.listing.itemId,
      title: purchase.listing.title,
      photos: purchase.listing.photos,
      sellerName: purchase.listing.user.name,
      estimatedRetailPrice: purchase.listing.estimatedRetailPrice,
    }));

    console.log('Complete Profile API: Successfully compiled complete profile data');
    
    const response = NextResponse.json({
      success: true,
      user,
      organizations,
      permissions: {
        canListItems: isSeller || isAdmin,
        canBuyItems: isBuyer || isAdmin,
        isSeller,
        isBuyer,
        isAdmin,
      },
      listings: listings || [],
      purchases: transformedPurchases || [],
      stats: {
        totalListings: listings?.length || 0,
        activeListings: listings?.filter(l => l.status === 'ACTIVE')?.length || 0,
        soldListings: listings?.filter(l => l.status === 'SOLD')?.length || 0,
        totalPurchases: purchases?.length || 0,
        completedPurchases: purchases?.filter(p => p.status === 'completed')?.length || 0,
        totalSpent: purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      }
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Complete Profile API: Error fetching complete profile:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Failed to fetch complete profile",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
