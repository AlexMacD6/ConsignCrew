import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/promo-codes/validate
 * Validate a promo code for checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return NextResponse.json(
        { 
          valid: false,
          error: "Invalid promo code" 
        },
        { status: 404 }
      );
    }

    // Check if promo code is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { 
          valid: false,
          error: "This promo code is no longer active" 
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if promo code has started
    if (promoCode.startDate && promoCode.startDate > now) {
      return NextResponse.json(
        { 
          valid: false,
          error: "This promo code is not yet active" 
        },
        { status: 400 }
      );
    }

    // Check if promo code has expired
    if (promoCode.endDate && promoCode.endDate < now) {
      return NextResponse.json(
        { 
          valid: false,
          error: "This promo code has expired" 
        },
        { status: 400 }
      );
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { 
          valid: false,
          error: "This promo code has reached its usage limit" 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    let discountType = promoCode.type;

    if (promoCode.type === 'percentage') {
      discountAmount = (orderTotal * promoCode.value) / 100;
    } else if (promoCode.type === 'fixed_amount') {
      discountAmount = Math.min(promoCode.value, orderTotal); // Don't exceed order total
    } else if (promoCode.type === 'free_shipping') {
      // For free shipping, we'll return the shipping amount as discount
      // This will need to be calculated based on your shipping logic
      discountAmount = 0; // Placeholder - implement shipping calculation
      discountType = 'free_shipping';
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description,
        type: promoCode.type,
        value: promoCode.value
      },
      discount: {
        amount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        type: discountType,
        description: promoCode.type === 'free_shipping' 
          ? 'Free shipping' 
          : promoCode.type === 'percentage'
          ? `${promoCode.value}% off`
          : `$${promoCode.value} off`
      }
    });

  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/promo-codes/validate
 * Apply/use a promo code (increment usage count)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Find and increment usage count
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 404 }
      );
    }

    // Update usage count
    const updatedPromoCode = await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Promo code applied successfully",
      usageCount: updatedPromoCode.usageCount
    });

  } catch (error) {
    console.error("Error applying promo code:", error);
    return NextResponse.json(
      { error: "Failed to apply promo code" },
      { status: 500 }
    );
  }
}
