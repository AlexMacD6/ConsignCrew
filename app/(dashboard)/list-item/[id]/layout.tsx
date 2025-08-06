import { Metadata } from "next";
import {
  generateProductMetadata,
  ProductForMeta,
} from "../../../components/ProductMetaTags";

// Generate dynamic metadata for product pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;

    // Fetch listing data for metadata
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/listings/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        title: "Product Not Found | TreasureHub",
        description: "The requested product could not be found.",
      };
    }

    const data = await response.json();

    // Transform listing data for metadata
    const productForMeta: ProductForMeta = {
      item_id: data.listing.itemId,
      title: data.listing.title,
      description: data.listing.description,
      list_price: data.listing.price,
      status: data.listing.status,
      brand: data.listing.brand,
      condition: data.listing.condition,
      all_images: [
        { src: data.listing.photos.hero, type: "hero", label: null },
        {
          src: data.listing.photos.proof,
          type: "ai_generated",
          label: "Staged scene - for inspiration",
        },
        { src: data.listing.photos.back, type: "back", label: null },
        ...(data.listing.photos.additional || []).map((photo: string) => ({
          src: photo,
          type: "additional",
          label: null,
        })),
      ].filter((img) => img.src),
      url: `https://treasurehub.club/list-item/${data.listing.itemId}`,
    };

    return generateProductMetadata(productForMeta);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "TreasureHub | Professional Consignment Service",
      description:
        "Professional consignment service that handles everything from pickup to sale.",
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
