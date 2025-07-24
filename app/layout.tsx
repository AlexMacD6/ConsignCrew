import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ConsignCrew | Sell Stress-Free",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eee] flex items-center justify-between px-4 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Link href="/">
              <img
                src="/Consign Crew Banner Logo.png"
                alt="ConsignCrew logo"
                className="h-10 w-auto object-contain drop-shadow-md cursor-pointer"
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 text-[#222] font-medium text-sm">
              <a href="#mission" className="hover:text-[#D4AF3D] transition">
                Mission
              </a>
              <a href="#problem" className="hover:text-[#D4AF3D] transition">
                Problem
              </a>
              <a href="#solution" className="hover:text-[#D4AF3D] transition">
                Solution
              </a>
              <a href="#waitlist" className="hover:text-[#D4AF3D] transition">
                Waitlist
              </a>
              <Link href="/faq" className="hover:text-[#D4AF3D] transition">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="px-4 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition">
                  Log In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-4 py-2 bg-white text-[#D4AF3D] font-bold rounded-lg border border-[#D4AF3D] shadow hover:bg-[#fffbe6] transition">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
