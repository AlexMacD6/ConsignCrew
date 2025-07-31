import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update the redemption status to paid
    const updatedRedemption = await prisma.treasureRedemption.update({
      where: { id },
      data: { 
        paymentStatus: 'paid',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      redemption: updatedRedemption,
      message: "Payment marked as completed",
    });

  } catch (error) {
    console.error("Error marking payment as paid:", error);
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