import { NextRequest, NextResponse } from 'next/server';
import { generateStagedPhotoPhase2 } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    // Test with minimal data
    const testData = {
      listingJSON: {
        title: "Test Product",
        description: "A test product for debugging",
        department: "Furniture",
        category: "Other",
        subCategory: "General",
        condition: "used" as const,
        estimatedRetailPrice: 100,
        listPrice: 80,
        priceReasoning: "Test pricing",
        brand: "Test Brand",
        discountSchedule: "Classic-60" as const,
        features: ["Test feature"],
        keywords: ["test", "product"],
        detailedDescription: "A test product for debugging purposes",
        marketingCopy: "Test marketing copy",
        technicalSpecs: "Test technical specifications",
        conditionDetails: "Test condition details",
        valueProposition: "Test value proposition",
        // Add some of the new fields to test
        quantity: 1,
        color: "Brown",
        material: "Wood",
        style: "Modern"
      },
      photoURLs: [
        "https://dtlqyjbwka60p.cloudfront.net/test-image.jpg"
      ],
      videoFrames: []
    };

    console.log("🧪 Test - Starting staged photo generation with test data");
    
    const result = await generateStagedPhotoPhase2(testData);

    console.log("🧪 Test - Successfully generated result:", result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('🧪 Test - Error in test endpoint:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 