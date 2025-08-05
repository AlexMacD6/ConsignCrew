import { NextRequest, NextResponse } from "next/server";

/**
 * Simple Facebook Shop CSV Export Endpoint (for testing)
 * 
 * Generates a sample CSV file without database queries to test the CSV generation logic.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Starting simple Facebook Shop CSV export...");

    // Generate sample CSV content
    const csvHeaders = [
      "id",
      "title",
      "description", 
      "price",
      "condition",
      "brand",
      "availability",
      "category",
      "subcategory",
      "gtin",
      "mpn",
      "image_url",
      "additional_image_url_1",
      "additional_image_url_2",
      "additional_image_url_3",
      "additional_image_url_4",
      "additional_image_url_5",
      "additional_image_url_6",
      "additional_image_url_7",
      "additional_image_url_8",
      "video_url",
      "shipping_weight",
      "shipping_length",
      "shipping_width", 
      "shipping_height",
      "seller_name",
      "seller_email",
      "created_at",
      "updated_at"
    ];

    // Sample data
    const sampleListings = [
      {
        id: "sample-1",
        title: "Sample Product 1",
        description: "This is a sample product description",
        price: "99.99",
        condition: "new",
        brand: "Sample Brand",
        availability: "in stock",
        category: "Electronics",
        subcategory: "Computers",
        gtin: "1234567890123",
        mpn: "SAMPLE-MPN-001",
        image_url: "https://example.com/image1.jpg",
        additional_image_url_1: "https://example.com/image2.jpg",
        additional_image_url_2: "",
        additional_image_url_3: "",
        additional_image_url_4: "",
        additional_image_url_5: "",
        additional_image_url_6: "",
        additional_image_url_7: "",
        additional_image_url_8: "",
        video_url: "",
        shipping_weight: "5",
        shipping_length: "50",
        shipping_width: "30",
        shipping_height: "20",
        seller_name: "TreasureHub Seller",
        seller_email: "seller@treasurehub.club",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "sample-2",
        title: "Sample Product 2",
        description: "Another sample product description",
        price: "149.99",
        condition: "used",
        brand: "Another Brand",
        availability: "in stock",
        category: "Furniture",
        subcategory: "Chairs",
        gtin: "9876543210987",
        mpn: "SAMPLE-MPN-002",
        image_url: "https://example.com/image3.jpg",
        additional_image_url_1: "",
        additional_image_url_2: "",
        additional_image_url_3: "",
        additional_image_url_4: "",
        additional_image_url_5: "",
        additional_image_url_6: "",
        additional_image_url_7: "",
        additional_image_url_8: "",
        video_url: "",
        shipping_weight: "15",
        shipping_length: "60",
        shipping_width: "40",
        shipping_height: "35",
        seller_name: "TreasureHub Seller",
        seller_email: "seller@treasurehub.club",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const csvRows = sampleListings.map(listing => [
      listing.id,
      listing.title,
      listing.description,
      listing.price,
      listing.condition,
      listing.brand,
      listing.availability,
      listing.category,
      listing.subcategory,
      listing.gtin,
      listing.mpn,
      listing.image_url,
      listing.additional_image_url_1,
      listing.additional_image_url_2,
      listing.additional_image_url_3,
      listing.additional_image_url_4,
      listing.additional_image_url_5,
      listing.additional_image_url_6,
      listing.additional_image_url_7,
      listing.additional_image_url_8,
      listing.video_url,
      listing.shipping_weight,
      listing.shipping_length,
      listing.shipping_width,
      listing.shipping_height,
      listing.seller_name,
      listing.seller_email,
      listing.created_at,
      listing.updated_at
    ]);

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    console.log(`Generated sample CSV with ${csvRows.length} rows`);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="treasurehub-facebook-shop-sample-${new Date().toISOString().split('T')[0]}.csv"`,
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    console.error("Error generating sample Facebook Shop CSV export:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to generate sample CSV export", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 