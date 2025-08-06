/**
 * Product Meta Tags Utility
 * Generates metadata object for product pages (Next.js App Router)
 */

import { Metadata } from "next";

export interface ProductForMeta {
  item_id: string;
  title: string;
  description: string;
  list_price: number;
  status: string;
  brand?: string;
  condition?: string;
  all_images: Array<{ src: string; type?: string; label?: string | null }>;
  url: string;
}

// Map listing status to Facebook product availability
const getAvailability = (status: string) => {
  switch (status.toUpperCase()) {
    case "LISTED":
    case "ACTIVE":
      return "in stock";
    case "SOLD":
      return "out of stock";
    case "PENDING":
      return "pending";
    case "DISCONTINUED":
      return "discontinued";
    default:
      return "in stock";
  }
};

// Get the hero image (first image or first available image)
const getHeroImage = (product: ProductForMeta) => {
  const heroImg = product.all_images.find((img) => img.type === "hero");
  if (heroImg?.src) return heroImg.src;

  const firstImg = product.all_images.find(
    (img) => img.src && img.src.trim() !== ""
  );
  return firstImg?.src || "";
};

// Clean and truncate description for meta tags
const getMetaDescription = (description: string) => {
  return description
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .substring(0, 160); // Limit to 160 characters for SEO
};

export function generateProductMetadata(product: ProductForMeta): Metadata {
  const heroImage = getHeroImage(product);
  const metaDescription = getMetaDescription(product.description);
  const availability = getAvailability(product.status);

  return {
    title: `${product.title} | TreasureHub`,
    description: metaDescription,
    openGraph: {
      type: "website", // Facebook needs this to be 'website' for products
      title: product.title,
      description: metaDescription,
      url: product.url,
      siteName: "TreasureHub",
      locale: "en_US",
      images: heroImage
        ? [
            {
              url: heroImage,
              width: 1200,
              height: 630,
              alt: product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: metaDescription,
      images: heroImage ? [heroImage] : [],
    },
    other: {
      // Product-specific Open Graph tags
      "product:price:amount": product.list_price.toString(),
      "product:price:currency": "USD",
      "product:availability": availability,
      ...(product.condition && {
        "product:condition": product.condition.toLowerCase(),
      }),
      ...(product.brand && { "product:brand": product.brand }),

      // Product Schema Microdata
      "itemProp:name": product.title,
      "itemProp:description": metaDescription,
      ...(heroImage && { "itemProp:image": heroImage }),
      "itemProp:price": product.list_price.toString(),
      "itemProp:priceCurrency": "USD",
      "itemProp:availability": availability,
      ...(product.condition && { "itemProp:itemCondition": product.condition }),
      ...(product.brand && { "itemProp:brand": product.brand }),
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: product.url,
    },
  };
}
