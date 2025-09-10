import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../lib/auth";

/**
 * GET /api/admin/promo-codes
 * Fetch all promo codes with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add proper admin role check here
    // For now, allowing all authenticated users to access admin endpoints

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'expired', 'inactive'
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {};

    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ];
    } else if (status === 'expired') {
      whereClause.endDate = { lt: new Date() };
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.min(limit, 100), // Cap at 100 for performance
      skip: offset
    });

    // Calculate status for each promo code
    const promoCodesWithStatus = promoCodes.map(promo => {
      const now = new Date();
      let calculatedStatus = 'active';
      
      if (!promo.isActive) {
        calculatedStatus = 'inactive';
      } else if (promo.endDate && promo.endDate < now) {
        calculatedStatus = 'expired';
      } else if (promo.startDate && promo.startDate > now) {
        calculatedStatus = 'scheduled';
      } else if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        calculatedStatus = 'limit_reached';
      }

      return {
        ...promo,
        calculatedStatus
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.promoCode.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      promoCodes: promoCodesWithStatus,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promo-codes
 * Create a new promo code
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      type,
      value,
      isActive = true,
      startDate,
      endDate,
      usageLimit
    } = body;

    // Validate required fields
    if (!code || !name || !type || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code, name, type, value" },
        { status: 400 }
      );
    }

    // Validate promo code format (uppercase, alphanumeric, no spaces)
    const codeRegex = /^[A-Z0-9]+$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: "Promo code must be uppercase alphanumeric characters only" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['percentage', 'fixed_amount', 'free_shipping'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate value based on type
    if (type === 'percentage' && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "Percentage value must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (type === 'fixed_amount' && value < 0) {
      return NextResponse.json(
        { error: "Fixed amount must be positive" },
        { status: 400 }
      );
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Check if promo code already exists
    const existingPromo = await prisma.promoCode.findUnique({
      where: { code }
    });

    if (existingPromo) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 409 }
      );
    }

    // Create the promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        name,
        description,
        type,
        value,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      promoCode,
      message: "Promo code created successfully"
    });

  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
