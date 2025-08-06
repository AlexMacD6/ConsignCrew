import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { ModalProvider } from "./contexts/ModalContext";
import MetaPixelScript from "./components/MetaPixelScript";
import ErrorBoundary from "./components/ErrorBoundary";
import "../app/lib/console-filter"; // Import console filter

export const metadata: Metadata = {
  title: {
    default:
      "TreasureHub | Sell Stress-Free - Professional Consignment Service",
    template: "%s | TreasureHub",
  },
  description:
    "TreasureHub is a professional consignment service that handles everything from pickup to sale. We clean, photograph, authenticate, and sell your items with transparent pricing. Get the most value for your belongings with our expert team.",
  keywords: [
    "consignment service",
    "sell items online",
    "professional selling",
    "item authentication",
    "stress-free selling",
    "online marketplace",
    "treasure hub",
    "sell belongings",
    "professional photography",
    "item cleaning",
  ],
  authors: [{ name: "TreasureHub Team" }],
  creator: "TreasureHub",
  publisher: "TreasureHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://treasurehub.club"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://treasurehub.club",
    siteName: "TreasureHub",
    title: "TreasureHub | Sell Stress-Free",
    description:
      "Professional consignment service that handles everything from pickup to sale. Get the most value for your belongings.",
    images: [
      {
        url: "/TreasureHub - Banner Black.png",
        width: 1200,
        height: 630,
        alt: "TreasureHub - Professional Consignment Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TreasureHub | Sell Stress-Free",
    description:
      "Professional consignment service that handles everything from pickup to sale.",
    images: ["/TreasureHub - Banner Black.png"],
    creator: "@treasurehub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  icons: {
    icon: "/TreasureHub - Favicon Black.png",
    shortcut: "/TreasureHub - Favicon Black.png",
    apple: "/TreasureHub - Favicon Black.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-T9SC7WZX');
          `}
        </Script>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B483BLYZEF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B483BLYZEF');
          `}
        </Script>

        {/* Meta Pixel Script */}
        <MetaPixelScript />

        {/* JSON-LD Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "TreasureHub",
              url: "https://treasurehub.club",
              logo: "https://treasurehub.club/TreasureHub - Logo.png",
              description:
                "Professional consignment service that handles everything from pickup to sale. We clean, photograph, authenticate, and sell your items with transparent pricing.",
              foundingDate: "2024",
              sameAs: [
                "https://x.com/TreasureHubClub",
                "https://facebook.com/treasurehubclub",
                "https://www.instagram.com/treasurehubclub/",
                "https://www.tiktok.com/@treasurehubclub",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                url: "https://treasurehub.club/contact",
              },
              serviceType: "Consignment Service",
              areaServed: "United States",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Consignment Services",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Professional Item Photography",
                      description: "High-quality photography for your items",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Item Authentication",
                      description:
                        "Professional authentication of valuable items",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Item Cleaning & Preparation",
                      description:
                        "Professional cleaning and preparation of items for sale",
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T9SC7WZX"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ErrorBoundary>
          <ModalProvider>
            <NavBar />
            {children}
            <Footer />
          </ModalProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
