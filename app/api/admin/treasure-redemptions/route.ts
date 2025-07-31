import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd add authentication here
    // For now, we'll just return the data

    const redemptions = await prisma.treasureRedemption.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        // Include any related data if needed
      },
    });

    const treasureCodes = await prisma.treasureCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary statistics
    const totalRedemptions = redemptions.length;
    const pendingPayments = redemptions.filter(r => r.paymentStatus === 'pending').length;
    const paidRedemptions = redemptions.filter(r => r.paymentStatus === 'paid').length;
    const socialMediaBonuses = redemptions.filter(r => r.socialMediaBonus).length;

    const summary = {
      totalRedemptions,
      pendingPayments,
      paidRedemptions,
      socialMediaBonuses,
      totalCashValue: totalRedemptions * 25 + socialMediaBonuses * 10,
    };

    return NextResponse.json({
      redemptions,
      treasureCodes,
      summary,
    });

  } catch (error) {
    console.error("Error fetching treasure redemptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
} 