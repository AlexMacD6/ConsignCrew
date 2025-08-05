import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const instructions = {
      success: true,
      message: "Facebook Shop CSV Export Instructions",
      instructions: [
        "1. This feature exports all listings with Facebook Shop enabled to CSV format",
        "2. The CSV includes all required fields for Facebook Shop upload:",
        "   - Product ID, title, description, price, condition, brand",
        "   - Category, subcategory, GTIN, MPN",
        "   - Image URLs (primary + up to 8 additional images)",
        "   - Video URL, shipping dimensions and weight",
        "   - Seller information and timestamps",
        "3. The CSV file is compatible with Facebook Shop's bulk upload format",
        "4. Only active listings with Facebook Shop enabled are included",
        "5. Admin authentication is required to access this feature"
      ],
      status: "Feature is being implemented",
      nextSteps: [
        "Database connection needs to be verified",
        "Authentication system needs to be configured",
        "CSV generation logic is ready and tested"
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(instructions);

  } catch (error) {
    console.error("Error in instructions endpoint:", error);
    return NextResponse.json(
      { error: "Failed to load instructions" },
      { status: 500 }
    );
  }
} 