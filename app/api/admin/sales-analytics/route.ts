import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/sales-analytics
 * Returns comprehensive sales analytics data for admin dashboard
 * 
 * Includes:
 * - Monthly sales breakdown
 * - Total revenue and sales tax
 * - Profit margins
 * - Payment and fulfillment method distributions
 * - Category performance
 * - Growth trends
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all sold listings with transaction data
    const soldListings = await prisma.listing.findMany({
      where: {
        status: "sold",
        soldAt: { not: null },
        transactionPrice: { not: null },
      },
      select: {
        id: true,
        itemId: true,
        title: true,
        department: true,
        category: true,
        transactionPrice: true,
        purchasePrice: true,
        salesTax: true,
        taxRate: true,
        soldAt: true,
        paymentMethod: true,
        fulfillmentMethod: true,
        createdAt: true,
      },
      orderBy: {
        soldAt: "asc",
      },
    });

    // Calculate aggregate metrics
    const totalRevenue = soldListings.reduce(
      (sum, listing) => sum + (listing.transactionPrice || 0),
      0
    );

    const totalSalesTax = soldListings.reduce(
      (sum, listing) => sum + (listing.salesTax || 0),
      0
    );

    const totalPurchaseCost = soldListings.reduce(
      (sum, listing) => sum + (listing.purchasePrice || 0),
      0
    );

    const totalProfit = totalRevenue - totalPurchaseCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const averageTransactionValue = soldListings.length > 0 
      ? totalRevenue / soldListings.length 
      : 0;

    // Group sales by month for time series
    const monthlySales: Record<string, {
      month: string;
      revenue: number;
      salesCount: number;
      profit: number;
      salesTax: number;
    }> = {};

    soldListings.forEach((listing) => {
      if (!listing.soldAt) return;
      
      const date = new Date(listing.soldAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = {
          month: monthKey,
          revenue: 0,
          salesCount: 0,
          profit: 0,
          salesTax: 0,
        };
      }

      monthlySales[monthKey].revenue += listing.transactionPrice || 0;
      monthlySales[monthKey].salesCount += 1;
      monthlySales[monthKey].profit += 
        (listing.transactionPrice || 0) - (listing.purchasePrice || 0);
      monthlySales[monthKey].salesTax += listing.salesTax || 0;
    });

    // Convert to array and sort by month
    const monthlyData = Object.values(monthlySales).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    // Payment method breakdown
    const paymentMethodStats: Record<string, number> = {};
    soldListings.forEach((listing) => {
      const method = listing.paymentMethod || "Unknown";
      paymentMethodStats[method] = (paymentMethodStats[method] || 0) + 1;
    });

    // Fulfillment method breakdown
    const fulfillmentMethodStats: Record<string, number> = {};
    soldListings.forEach((listing) => {
      const method = listing.fulfillmentMethod || "Unknown";
      fulfillmentMethodStats[method] = (fulfillmentMethodStats[method] || 0) + 1;
    });

    // Category performance
    const categoryStats: Record<string, {
      department: string;
      revenue: number;
      salesCount: number;
      profit: number;
    }> = {};

    soldListings.forEach((listing) => {
      const dept = listing.department || "Uncategorized";
      
      if (!categoryStats[dept]) {
        categoryStats[dept] = {
          department: dept,
          revenue: 0,
          salesCount: 0,
          profit: 0,
        };
      }

      categoryStats[dept].revenue += listing.transactionPrice || 0;
      categoryStats[dept].salesCount += 1;
      categoryStats[dept].profit += 
        (listing.transactionPrice || 0) - (listing.purchasePrice || 0);
    });

    // Convert to array and sort by revenue
    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate month-over-month growth
    let monthOverMonthGrowth = 0;
    if (monthlyData.length >= 2) {
      const lastMonth = monthlyData[monthlyData.length - 1].revenue;
      const previousMonth = monthlyData[monthlyData.length - 2].revenue;
      
      if (previousMonth > 0) {
        monthOverMonthGrowth = ((lastMonth - previousMonth) / previousMonth) * 100;
      }
    }

    // Get most recent month's data
    const currentMonthData = monthlyData.length > 0 
      ? monthlyData[monthlyData.length - 1] 
      : null;

    // Format sales list for table display (most recent first)
    const salesList = soldListings
      .map((listing) => ({
        itemId: listing.itemId,
        title: listing.title,
        department: listing.department,
        category: listing.category,
        transactionPrice: listing.transactionPrice,
        purchasePrice: listing.purchasePrice,
        profit: (listing.transactionPrice || 0) - (listing.purchasePrice || 0),
        salesTax: listing.salesTax,
        soldAt: listing.soldAt,
        paymentMethod: listing.paymentMethod,
        fulfillmentMethod: listing.fulfillmentMethod,
      }))
      .reverse(); // Most recent first

    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        summary: {
          totalRevenue,
          totalSalesTax,
          totalPurchaseCost,
          totalProfit,
          profitMargin,
          salesCount: soldListings.length,
          averageTransactionValue,
          monthOverMonthGrowth,
        },
        // Time series data
        monthlyData,
        // Current month
        currentMonth: currentMonthData,
        // Breakdowns
        paymentMethods: Object.entries(paymentMethodStats).map(([method, count]) => ({
          method,
          count,
          percentage: (count / soldListings.length) * 100,
        })),
        fulfillmentMethods: Object.entries(fulfillmentMethodStats).map(([method, count]) => ({
          method,
          count,
          percentage: (count / soldListings.length) * 100,
        })),
        topCategories,
        // All sales for detailed table
        salesList,
      },
    });
  } catch (error) {
    console.error("Sales analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics" },
      { status: 500 }
    );
  }
}

