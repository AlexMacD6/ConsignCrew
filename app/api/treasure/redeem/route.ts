import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// Validation schema for redemption data
const redemptionSchema = z.object({
  code: z.string().length(6).toUpperCase(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  paymentMethod: z.enum(["venmo", "cashapp", "zelle"]),
  venmoUsername: z.string().optional(),
  cashAppUsername: z.string().optional(),
  zelleEmail: z.string().optional(),
  socialMediaPost: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const body = await request.json();
    const validatedData = redemptionSchema.parse(body);

    // Check if code exists and is active
    const treasureCode = await prisma.treasureCode.findUnique({
      where: { code: validatedData.code },
      include: {
        treasureDrop: {
          select: {
            id: true,
            name: true,
            status: true,
            reward: true,
          },
        },
        redemptions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!treasureCode || !treasureCode.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive redemption code" },
        { status: 400 }
      );
    }

    // Check if treasure drop exists and is active
    if (!treasureCode.treasureDrop) {
      return NextResponse.json(
        { error: "Treasure drop not found for this code" },
        { status: 400 }
      );
    }

    if (treasureCode.treasureDrop.status !== "active") {
      return NextResponse.json(
        { error: "This treasure has already been found" },
        { status: 400 }
      );
    }

    // Check if code has been used up
    if (treasureCode.currentUses >= treasureCode.maxUses) {
      return NextResponse.json(
        { error: "This redemption code has already been used" },
        { status: 400 }
      );
    }

    // Check if this specific code has already been redeemed
    if (treasureCode.redemptions.length > 0) {
      return NextResponse.json(
        { error: "This redemption code has already been used" },
        { status: 400 }
      );
    }

    // Check if user has already redeemed any treasure
    const existingUserRedemption = await prisma.treasureRedemption.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUserRedemption) {
      return NextResponse.json(
        { error: "You have already redeemed a treasure" },
        { status: 400 }
      );
    }

    // Validate payment method specific fields
    if (validatedData.paymentMethod === "venmo" && !validatedData.venmoUsername) {
      return NextResponse.json(
        { error: "Venmo username is required for Venmo payments" },
        { status: 400 }
      );
    }

    if (validatedData.paymentMethod === "cashapp" && !validatedData.cashAppUsername) {
      return NextResponse.json(
        { error: "CashApp username is required for CashApp payments" },
        { status: 400 }
      );
    }

    if (validatedData.paymentMethod === "zelle") {
      if (!validatedData.zelleEmail) {
        return NextResponse.json(
          { error: "Zelle email is required for Zelle payments" },
          { status: 400 }
        );
      }
      // Validate email format for Zelle
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(validatedData.zelleEmail)) {
        return NextResponse.json(
          { error: "Please enter a valid email address for Zelle payments" },
          { status: 400 }
        );
      }
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create redemption record
    const redemption = await prisma.treasureRedemption.create({
      data: {
        treasureCodeId: treasureCode.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        venmoUsername: validatedData.venmoUsername,
        cashAppUsername: validatedData.cashAppUsername,
        zelleEmail: validatedData.zelleEmail,
        paymentMethod: validatedData.paymentMethod,
        socialMediaPost: validatedData.socialMediaPost,
        socialMediaBonus: !!validatedData.socialMediaPost,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Update code usage count
    await prisma.treasureCode.update({
      where: { id: treasureCode.id },
      data: { currentUses: treasureCode.currentUses + 1 },
    });

    // Mark treasure drop as found
    await prisma.treasureDrop.update({
      where: { id: treasureCode.treasureDrop.id },
      data: {
        status: "found",
        foundBy: `${validatedData.firstName} ${validatedData.lastName}`,
        foundAt: new Date(),
      },
    });

    // Send confirmation email (you can implement this later)
    // await sendRedemptionConfirmationEmail(redemption);

    return NextResponse.json({
      success: true,
      redemptionId: redemption.id,
      message: "Redemption submitted successfully! You'll receive your payment within 24 hours.",
    });

  } catch (error) {
    console.error("Treasure redemption error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
} 