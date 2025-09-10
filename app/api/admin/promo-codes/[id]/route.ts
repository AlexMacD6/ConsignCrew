import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

/**
 * GET /api/admin/promo-codes/[id]
 * Fetch a specific promo code by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { id: params.id },
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

    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Calculate status
    const now = new Date();
    let calculatedStatus = 'active';
    
    if (!promoCode.isActive) {
      calculatedStatus = 'inactive';
    } else if (promoCode.endDate && promoCode.endDate < now) {
      calculatedStatus = 'expired';
    } else if (promoCode.startDate && promoCode.startDate > now) {
      calculatedStatus = 'scheduled';
    } else if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      calculatedStatus = 'limit_reached';
    }

    return NextResponse.json({
      success: true,
      promoCode: {
        ...promoCode,
        calculatedStatus
      }
    });

  } catch (error) {
    console.error("Error fetching promo code:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo code" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/promo-codes/[id]
 * Update a specific promo code
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive,
      startDate,
      endDate,
      usageLimit
    } = body;

    // Check if promo code exists
    const existingPromo = await prisma.promoCode.findUnique({
      where: { id: params.id }
    });

    if (!existingPromo) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (code && code !== existingPromo.code) {
      // Validate promo code format
      const codeRegex = /^[A-Z0-9]+$/;
      if (!codeRegex.test(code)) {
        return NextResponse.json(
          { error: "Promo code must be uppercase alphanumeric characters only" },
          { status: 400 }
        );
      }

      // Check if new code already exists
      const codeExists = await prisma.promoCode.findUnique({
        where: { code }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Promo code already exists" },
          { status: 409 }
        );
      }
    }

    if (type) {
      const validTypes = ['percentage', 'fixed_amount', 'free_shipping'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (value !== undefined) {
      const promoType = type || existingPromo.type;
      if (promoType === 'percentage' && (value < 0 || value > 100)) {
        return NextResponse.json(
          { error: "Percentage value must be between 0 and 100" },
          { status: 400 }
        );
      }

      if (promoType === 'fixed_amount' && value < 0) {
        return NextResponse.json(
          { error: "Fixed amount must be positive" },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const newStartDate = startDate ? new Date(startDate) : existingPromo.startDate;
    const newEndDate = endDate ? new Date(endDate) : existingPromo.endDate;
    
    if (newStartDate && newEndDate && newStartDate >= newEndDate) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Update the promo code
    const updatedPromoCode = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(value !== undefined && { value }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(usageLimit !== undefined && { usageLimit })
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
      promoCode: updatedPromoCode,
      message: "Promo code updated successfully"
    });

  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promo-codes/[id]
 * Delete a specific promo code
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if promo code exists
    const existingPromo = await prisma.promoCode.findUnique({
      where: { id: params.id }
    });

    if (!existingPromo) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Delete the promo code
    await prisma.promoCode.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
