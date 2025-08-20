"use client";

import Script from "next/script";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  noIndex?: boolean;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = "/TreasureHub - Banner Black.png",
  ogType = "website",
  structuredData,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | TreasureHub`
    : "TreasureHub | Houston's Treasure Chest - Professional Consignment Service";
  const fullDescription =
    description ||
    "TreasureHub is a professional consignment service that handles everything from pickup to sale. We clean, photograph, authenticate, and sell your items with transparent pricing.";

  return (
    <>
      {/* Meta Tags */}
      <meta name="title" content={fullTitle} />
      <meta name="description" content={fullDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={ogType} />
      <meta
        property="og:image"
        content={`https://treasurehub.club${ogImage}`}
      />
      <meta
        property="og:url"
        content={canonical || "https://treasurehub.club"}
      />
      <meta property="og:site_name" content="Houston's Treasure Chest" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta
        name="twitter:image"
        content={`https://treasurehub.club${ogImage}`}
      />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Structured Data */}
      {structuredData && (
        <Script
          id="page-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </>
  );
}
