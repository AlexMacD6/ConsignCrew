import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
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
      <body className="bg-gray-50 min-h-screen">
        <ModalProvider>
          <NavBar />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
