import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API route to validate if a ZIP code is approved
 * This replaces the client-side Prisma calls that were causing browser errors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zipCode } = body;

    if (!zipCode) {
      return NextResponse.json(
        { error: "ZIP code is required" },
        { status: 400 }
      );
    }

    // Check if the ZIP code exists in the database
    const zipCodeRecord = await prisma.zipCode.findFirst({
      where: { code: zipCode },
      select: { 
        code: true, 
        area: true,
        type: true 
      }
    });

    if (zipCodeRecord) {
      return NextResponse.json({
        success: true,
        isValid: true,
        area: zipCodeRecord.area,
        type: zipCodeRecord.type,
      });
    } else {
      return NextResponse.json({
        success: true,
        isValid: false,
        area: null,
        type: null,
      });
    }

  } catch (error) {
    console.error("Error validating ZIP code:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate ZIP code" },
      { status: 500 }
    );
  }
} 