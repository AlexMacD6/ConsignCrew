import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Facebook Shop CSV Export Endpoint
 * 
 * Exports all listings in CSV format compatible with Facebook Shop upload requirements.
 * Includes all required fields: title, description, price, condition, brand, availability, etc.
 * 
 * HTTP Basic Authentication is required for Facebook Shop access.
 * Username and password must be provided in the Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    // Check HTTP Basic Authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Facebook Shop CSV Export"'
        }
      });
    }

    // Decode the base64 credentials
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    // Check credentials against environment variables
    const expectedUsername = process.env.FACEBOOK_SHOP_USERNAME;
    const expectedPassword = process.env.FACEBOOK_SHOP_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      console.error('Facebook Shop credentials not configured in environment variables');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Facebook Shop CSV Export"'
        }
      });
    }

    // Optional: Also check session-based authentication for additional security
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      console.log('No session found, but Basic Auth passed - allowing access for Facebook');
    } else {
      // If session exists, check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          members: {
            where: {
              role: {
                in: ['ADMIN', 'OWNER']
              }
            }
          }
        }
      });

      if (!user?.members.length) {
        console.log('Session user is not admin, but Basic Auth passed - allowing access for Facebook');
      }
    }

    // Fetch all listings with Facebook Shop enabled
    const listings = await prisma.listing.findMany({
      where: {
        facebookShopEnabled: true,
        // Only include active listings
        status: "active"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        videos: {
          where: {
            status: "completed"
          },
          select: {
            processedVideoKey: true,
            rawVideoKey: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log(`Found ${listings.length} listings for Facebook Shop export`);

    // Generate CSV content with all required Facebook Shop fields
    const csvHeaders = [
      "id",
      "title", 
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category", 
      "quantity_to_sell_on_facebook",
      "sale_price",
      "sale_price_effective_date",
      "item_group_id",
      "gender",
      "color",
      "size",
      "age_group",
      "material",
      "pattern",
      "shipping",
      "shipping_weight",
      "gtin",
      "video[0].url",
      "video[0].tag",
      "product_type",
      "product_tag",
      "style[0]"
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
      const facebookCondition = listing.facebookCondition || listing.condition || "new";
      
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

      // Get video URL from either direct videoUrl field or related videos
      let videoUrl = listing.videoUrl || "";
      let videoTag = "";
      if (!videoUrl && listing.videos.length > 0) {
        // Use the first completed video's processed video key
        const firstVideo = listing.videos[0];
        if (firstVideo.processedVideoKey) {
          // Construct S3 URL for the processed video
          videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${firstVideo.processedVideoKey}`;
          videoTag = "Product Video";
        } else if (firstVideo.rawVideoKey) {
          // Fallback to raw video if processed video is not available
          videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${firstVideo.rawVideoKey}`;
          videoTag = "Product Video";
        }
      }

      // Generate product link (assuming you have a public listing page)
      const productLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treasurehub.club'}/list-item/${listing.id}`;

      // Map category to Google Product Category (simplified mapping)
      const googleProductCategory = listing.category || "Apparel & Accessories";
      
      // Map category to Facebook Product Category
      const fbProductCategory = listing.category || "Apparel & Clothing";

      // Use structured fields from schema (with fallbacks to description parsing)
      const gender = listing.gender || (listing.category?.toLowerCase().includes('men') ? 'male' :
                   listing.category?.toLowerCase().includes('women') ? 'female' : 'unisex');

      const color = listing.color || (listing.description?.toLowerCase().includes('blue') ? 'blue' :
                   listing.description?.toLowerCase().includes('red') ? 'red' :
                   listing.description?.toLowerCase().includes('green') ? 'green' :
                   listing.description?.toLowerCase().includes('black') ? 'black' :
                   listing.description?.toLowerCase().includes('white') ? 'white' : "");

      const size = listing.size || (listing.description?.toLowerCase().includes('large') ? 'L' :
                  listing.description?.toLowerCase().includes('medium') ? 'M' :
                  listing.description?.toLowerCase().includes('small') ? 'S' : "");

      const ageGroup = listing.ageGroup || "adult";

      const material = listing.material || (listing.description?.toLowerCase().includes('cotton') ? 'cotton' :
                      listing.description?.toLowerCase().includes('polyester') ? 'polyester' :
                      listing.description?.toLowerCase().includes('wool') ? 'wool' :
                      listing.description?.toLowerCase().includes('leather') ? 'leather' : "");

      const pattern = listing.pattern || (listing.description?.toLowerCase().includes('striped') ? 'striped' :
                     listing.description?.toLowerCase().includes('plaid') ? 'plaid' :
                     listing.description?.toLowerCase().includes('floral') ? 'floral' :
                     listing.description?.toLowerCase().includes('solid') ? 'solid' : "");

      // Shipping information
      const shipping = "US:CA:Ground:0 USD";

      // GTIN (Global Trade Item Number)
      const gtin = listing.facebookGtin || "";

      // Product type and tags
      const productType = listing.category || "";
      const productTag = listing.tags?.join(', ') || listing.description || "";

      // Style information
      const style = listing.style || (listing.description?.toLowerCase().includes('casual') ? 'casual' :
                   listing.description?.toLowerCase().includes('formal') ? 'formal' :
                   listing.description?.toLowerCase().includes('vintage') ? 'vintage' : "");

      return [
        listing.id,
        listing.title,
        listing.description,
        "in stock", // Facebook Shop availability
        facebookCondition,
        listing.price.toFixed(2),
        productLink,
        imageUrls[0] || "", // Primary image
        facebookBrand,
        googleProductCategory,
        fbProductCategory,
        listing.quantity.toString(), // Quantity to sell on Facebook
        listing.salePrice ? listing.salePrice.toFixed(2) : "", // Sale price if available
        listing.salePriceEffectiveDate ? listing.salePriceEffectiveDate.toISOString() : "", // Sale price effective date
        listing.itemGroupId || "", // Item group ID for variants
        gender,
        color,
        size,
        ageGroup,
        material,
        pattern,
        shipping,
        estimatedWeight.toString(),
        gtin,
        videoUrl,
        videoTag,
        productType,
        productTag,
        style
      ];
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

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