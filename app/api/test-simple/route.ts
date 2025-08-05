import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Simple test endpoint called");
    
    return NextResponse.json({
      success: true,
      message: "Simple test endpoint working",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Simple test error:", error);
    return NextResponse.json(
      { error: "Simple test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 