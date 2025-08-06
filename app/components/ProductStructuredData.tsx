/**
 * Product Structured Data Component
 * Generates Schema.org Product JSON-LD for Facebook Shop catalog integration
 */

interface ProductStructuredDataProps {
  product: {
    item_id: string;
    title: string;
    description: string;
    list_price: number;
    status: string;
    brand?: string;
    condition?: string;
    department?: string;
    category?: string;
    subCategory?: string;
    all_images: Array<{ src: string; type?: string; label?: string | null }>;
    url: string;
  };
}

export default function ProductStructuredData({
  product,
}: ProductStructuredDataProps) {
  // Map listing status to Schema.org availability
  const getAvailability = (status: string) => {
    switch (status.toUpperCase()) {
      case "LISTED":
      case "ACTIVE":
        return "https://schema.org/InStock";
      case "SOLD":
        return "https://schema.org/OutOfStock";
      case "PENDING":
        return "https://schema.org/LimitedAvailability";
      case "DISCONTINUED":
        return "https://schema.org/Discontinued";
      default:
        return "https://schema.org/InStock";
    }
  };

  // Map condition to Schema.org condition
  const getCondition = (condition?: string) => {
    if (!condition) return "https://schema.org/UsedCondition";

    switch (condition.toLowerCase()) {
      case "new":
      case "brand new":
        return "https://schema.org/NewCondition";
      case "used":
      case "good":
      case "fair":
      case "poor":
        return "https://schema.org/UsedCondition";
      case "refurbished":
        return "https://schema.org/RefurbishedCondition";
      case "damaged":
        return "https://schema.org/DamagedCondition";
      default:
        return "https://schema.org/UsedCondition";
    }
  };

  // Get product category hierarchy
  const getCategory = () => {
    const parts = [
      product.department,
      product.category,
      product.subCategory,
    ].filter(Boolean);
    return parts.join(" > ") || "General";
  };

  // Get all product images
  const getImages = () => {
    return product.all_images
      .filter((img) => img.src && img.src.trim() !== "")
      .map((img) => img.src);
  };

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    productID: product.item_id,
    sku: product.item_id,
    name: product.title,
    description: product.description,
    category: getCategory(),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    offers: {
      "@type": "Offer",
      price: product.list_price.toString(),
      priceCurrency: "USD",
      availability: getAvailability(product.status),
      itemCondition: getCondition(product.condition),
      url: product.url,
      seller: {
        "@type": "Organization",
        name: "TreasureHub",
      },
    },
    image: getImages(),
    url: product.url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
