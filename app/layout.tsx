import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import NavBar from "./components/NavBar";
import { ModalProvider } from "./contexts/ModalContext";

export const metadata: Metadata = {
  title: "TreasureHub | Sell Stress-Free",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
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
      </head>
      <body className="bg-gray-50 min-h-screen">
        <ModalProvider>
          <NavBar />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
