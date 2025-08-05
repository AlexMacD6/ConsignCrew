import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...");
    
    // Test basic database connection
    const listingCount = await prisma.listing.count();
    console.log(`Database connection successful. Found ${listingCount} listings.`);
    
    return NextResponse.json({
      success: true,
      message: "Database connection working",
      listingCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        error: "Database test failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 