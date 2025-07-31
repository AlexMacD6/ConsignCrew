import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const codeValidationSchema = z.object({
  code: z.string().length(6).toUpperCase(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = codeValidationSchema.parse(body);

    // Check if code exists and is active
    const treasureCode = await prisma.treasureCode.findUnique({
      where: { code },
    });

    if (!treasureCode) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Invalid redemption code" 
        },
        { status: 200 }
      );
    }

    if (!treasureCode.isActive) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "This redemption code is no longer active" 
        },
        { status: 200 }
      );
    }

    // Check if code has been used up
    if (treasureCode.currentUses >= treasureCode.maxUses) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "This redemption code has already been used" 
        },
        { status: 200 }
      );
    }

    // Check if this specific code has already been redeemed
    const existingRedemption = await prisma.treasureRedemption.findUnique({
      where: { code },
    });

    if (existingRedemption) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "This redemption code has already been used" 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: treasureCode.code,
      maxUses: treasureCode.maxUses,
      currentUses: treasureCode.currentUses,
      remainingUses: treasureCode.maxUses - treasureCode.currentUses,
    });

  } catch (error) {
    console.error("Code validation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Invalid code format" 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        valid: false, 
        error: "Internal server error" 
      },
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