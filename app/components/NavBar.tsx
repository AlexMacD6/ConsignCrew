"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { Button } from "./ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useModal } from "../contexts/ModalContext";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeClass = "font-bold text-blue-600";
  const inactiveClass = "text-gray-600 hover:text-blue-600";
  const { data: session } = authClient.useSession();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { openSignupModal } = useModal();

  const handleSignOut = async () => {
    await authClient.signOut();
    setPopoverOpen(false);
    router.push("/login");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigation = (sectionId: string) => {
    // If we're on the landing page, scroll to section
    if (pathname === "/") {
      scrollToSection(sectionId);
    } else {
      // If we're on another page, navigate to landing page with section hash
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eee] flex items-center justify-between px-6 py-4 shadow-sm">
      {/* Branding/Logo */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <img
            src="/TreasureHub Banner Logo.png"
            alt="TreasureHub logo"
            className="h-16 w-auto object-contain drop-shadow-md cursor-pointer"
          />
        </Link>
      </div>
      {/* Marketing Links (center, hidden on mobile) */}
      <div className="hidden md:flex gap-8 text-[#222] font-medium text-base">
        <button
          onClick={() => handleNavigation("how-it-works")}
          className="hover:text-[#D4AF3D] transition"
        >
          How It Works
        </button>
        <button
          onClick={() => handleNavigation("pricing")}
          className="hover:text-[#D4AF3D] transition"
        >
          Pricing
        </button>
        <button
          onClick={() => handleNavigation("why-treasurehub")}
          className="hover:text-[#D4AF3D] transition"
        >
          Why TreasureHub
        </button>
        <button
          onClick={() => handleNavigation("roadmap")}
          className="hover:text-[#D4AF3D] transition"
        >
          Roadmap
        </button>
        <Link href="/faq" className="hover:text-[#D4AF3D] transition">
          FAQ
        </Link>
        <Link href="/contact" className="hover:text-[#D4AF3D] transition">
          Contact
        </Link>
        <Link href="/our-origin" className="hover:text-[#D4AF3D] transition">
          Our Origin
        </Link>
      </div>
      {/* Session-aware buttons (right) */}
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <Link href="/list-item" className="btn btn-primary btn-md">
              List an Item
            </Link>
            <Link href="/listings" className="btn btn-primary btn-md">
              Listings
            </Link>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 font-bold text-base px-4 py-2"
                >
                  Profile <ChevronDown className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3">
                <Link
                  href="/profile"
                  className="block w-full px-4 py-2 text-sm hover:bg-accent rounded-md"
                >
                  View Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent rounded-md mt-1"
                >
                  Sign out
                </button>
              </PopoverContent>
            </Popover>
          </>
        ) : (
          <button onClick={openSignupModal} className="btn btn-primary btn-md">
            Get Early Access
          </button>
        )}
      </div>
    </nav>
  );
}
