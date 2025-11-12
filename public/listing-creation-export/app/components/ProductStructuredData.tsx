/**
 * Product Structured Data Component
 * Generates Schema.org Product JSON-LD for Facebook Shop catalog integration
 */

interface ProductStructuredDataProps {
  product: {
    item_id?: string;
    itemId?: string;
    title?: string;
    description?: string;
    list_price?: number;
    price?: number;
    status?: string;
    brand?: string;
    facebookCondition?: string;
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
    if (!status) return "https://schema.org/InStock";

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
    if (!product.all_images || !Array.isArray(product.all_images)) {
      return [];
    }

    return product.all_images
      .filter((img) => {
        // Handle both string URLs and objects with src property
        const src = typeof img === "string" ? img : img?.src;
        return src && typeof src === "string" && src.trim() !== "";
      })
      .map((img) => (typeof img === "string" ? img : img.src));
  };

  // Get the price - handle both old and new field names
  const getPrice = () => {
    const price = product.list_price || product.price;
    if (typeof price === "number") {
      return price.toString();
    }
    return "0";
  };

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    productID: product.item_id || product.itemId,
    sku: product.item_id || product.itemId,
    name: product.title || "Product",
    description: product.description || "",
    category: getCategory(),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    offers: {
      "@type": "Offer",
      price: getPrice(),
      priceCurrency: "USD",
      availability: getAvailability(product.status || ""),
      itemCondition: getCondition(product.facebookCondition),
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
