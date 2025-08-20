import { Metadata } from 'next';

export const homePageMetadata: Metadata = {
  title: "TreasureHub | Professional Consignment Service in Houston, Texas",
  description: "TreasureHub (also known as Treasure Hub) at TreasureHub.Club is Houston's premier consignment service. We handle everything from pickup to sale - cleaning, photographing, authenticating, and selling your items with transparent pricing. Visit Treasure Hub Club online to get maximum value for your belongings with our expert team.",
  keywords: [
    // Primary brand variations (most important)
    "TreasureHub",
    "Treasure Hub", 
    "TreasureHub.Club",
    "Treasure Hub Club",
    "TreasureHub Club",
    "Treasure Hub.Club",
    "treasurehub",
    "treasure hub",
    "treasurehub.club",
    "treasure hub club",
    
    // Brand + location
    "TreasureHub Houston",
    "Treasure Hub Houston",
    "TreasureHub Texas",
    "Treasure Hub Texas", 
    "TreasureHub Houston Texas",
    "Treasure Hub Houston Texas",
    "TreasureHub.Club Houston",
    "Treasure Hub Club Houston",
    
    // Brand + services
    "TreasureHub consignment",
    "Treasure Hub consignment",
    "TreasureHub consignment service",
    "Treasure Hub consignment service",
    "TreasureHub selling",
    "Treasure Hub selling",
    
    // Services
    "consignment service Houston",
    "sell items Houston Texas", 
    "professional consignment",
    "item authentication Houston",
    "luxury resale Houston",
    "professional selling service",
    
    // Local
    "Houston consignment", 
    "Texas consignment service",
    "Houston marketplace",
    "sell belongings Houston",
    
    // Specific items
    "sell designer items Houston",
    "luxury goods consignment",
    "authenticated resale",
    "professional item photography"
  ],
  openGraph: {
    title: "TreasureHub (Treasure Hub) - Houston's Premier Consignment Service",
    description: "TreasureHub.Club (Treasure Hub Club) - Professional consignment service in Houston, Texas. We handle everything from pickup to sale with transparent pricing.",
    type: "website",
    locale: "en_US",
    url: "https://treasurehub.club",
    siteName: "TreasureHub",
    images: [
      {
        url: "/TreasureHub - Banner Black.png",
        width: 1200,
        height: 630,
        alt: "TreasureHub - Professional Consignment Service in Houston",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TreasureHub (Treasure Hub) - Houston's Premier Consignment Service", 
    description: "TreasureHub.Club (Treasure Hub Club) - Professional consignment service in Houston, Texas. We handle everything from pickup to sale.",
    images: ["/TreasureHub - Banner Black.png"],
  },
  alternates: {
    canonical: "https://treasurehub.club",
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "Houston",
    "geo.position": "29.7604;-95.3698",
    "ICBM": "29.7604, -95.3698",
  },
};
