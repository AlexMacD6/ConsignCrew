import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public Facebook Shop CSV Export Endpoint (for testing)
 * 
 * Exports all listings in CSV format compatible with Facebook Shop upload requirements.
 * This version doesn't require authentication for testing purposes.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Starting Facebook Shop CSV export...");

    // Fetch all listings with Facebook Shop enabled
    const listings = await prisma.listing.findMany({
      where: {
        facebookShopEnabled: true,
        status: "active"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log(`Found ${listings.length} listings for Facebook Shop export`);

    // Generate CSV content
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

    const csvRows = listings.map(listing => {
      // Extract image URLs from photos object
      const photos = listing.photos as any;
      const imageUrls = [];
      
      if (photos?.hero) imageUrls.push(photos.hero);
      if (photos?.back) imageUrls.push(photos.back);
      if (photos?.proof) imageUrls.push(photos.proof);
      if (photos?.additional) {
        imageUrls.push(...photos.additional);
      }

      // Facebook Shop condition mapping
      const facebookCondition = listing.facebookCondition || listing.condition;
      
      // Facebook Shop brand (use Facebook brand if available, otherwise main brand)
      const facebookBrand = listing.facebookBrand || listing.brand || "";

      // Calculate shipping dimensions (convert inches to cm for Facebook)
      const shippingLength = listing.width ? Math.round(parseFloat(listing.width) * 2.54) : "";
      const shippingWidth = listing.depth ? Math.round(parseFloat(listing.depth) * 2.54) : "";
      const shippingHeight = listing.height ? Math.round(parseFloat(listing.height) * 2.54) : "";

      // Estimate shipping weight based on dimensions (rough calculation)
      const width = parseFloat(listing.width || '0');
      const depth = parseFloat(listing.depth || '0');
      const height = parseFloat(listing.height || '0');
      const volume = width * depth * height;
      const estimatedWeight = volume > 0 ? Math.max(1, Math.round(volume * 0.1)) : 5; // lbs

      return [
        listing.id,
        listing.title,
        listing.description,
        listing.price.toFixed(2),
        facebookCondition,
        facebookBrand,
        "in stock", // Facebook Shop availability
        listing.category,
        listing.subCategory || "",
        listing.facebookGtin || "", // GTIN for Facebook
        listing.modelNumber || "", // MPN (Manufacturer Part Number)
        imageUrls[0] || "", // Primary image
        imageUrls[1] || "", // Additional images
        imageUrls[2] || "",
        imageUrls[3] || "",
        imageUrls[4] || "",
        imageUrls[5] || "",
        imageUrls[6] || "",
        imageUrls[7] || "",
        imageUrls[8] || "",
        listing.videoUrl || "", // Video URL if available
        estimatedWeight.toString(),
        shippingLength.toString(),
        shippingWidth.toString(),
        shippingHeight.toString(),
        listing.user?.name || "TreasureHub Seller",
        listing.user?.email || "",
        listing.createdAt.toISOString(),
        listing.updatedAt.toISOString()
      ];
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    console.log(`Generated CSV with ${csvRows.length} rows`);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="treasurehub-facebook-shop-${new Date().toISOString().split('T')[0]}.csv"`,
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    console.error("Error generating Facebook Shop CSV export:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to generate CSV export", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 