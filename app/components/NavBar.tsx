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
import { ChevronDown, Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useModal } from "../contexts/ModalContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useEarlyAuth } from "../hooks/useEarlyAuth";
import { useCart } from "../contexts/CartContext";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeClass = "font-bold text-blue-600";
  const inactiveClass = "text-gray-600 hover:text-blue-600";

  // Start early authentication process
  useEarlyAuth();

  const { data: session } = authClient.useSession();
  const { canListItems } = useUserPermissions();
  const { cartItemCount } = useCart();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    // Close mobile menu after navigation
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eee] flex items-center justify-between px-6 py-4 shadow-sm">
      {/* Branding/Logo */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <img
            src="/TreasureHub Banner Logo.png"
            alt="TreasureHub logo"
            className="h-12 sm:h-16 w-auto object-contain drop-shadow-md cursor-pointer"
          />
        </Link>
      </div>

      {/* Desktop Navigation Links (hidden on mobile) */}
      <div className="hidden md:flex gap-8 text-[#222] font-medium text-base">
        {session?.user ? (
          // Logged in: Show consolidated Home link
          <Link href="/" className="hover:text-[#D4AF3D] transition">
            Home
          </Link>
        ) : (
          // Logged out: Show individual landing page links
          <>
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
          </>
        )}
        <Link href="/faq" className="hover:text-[#D4AF3D] transition">
          FAQ
        </Link>
        <Link href="/contact" className="hover:text-[#D4AF3D] transition">
          Contact
        </Link>
        <Link href="/our-origin" className="hover:text-[#D4AF3D] transition">
          Our Origin
        </Link>
        <Link
          href="/seller-landing"
          className="hover:text-[#D4AF3D] transition"
        >
          Become a Seller
        </Link>
        {session?.user && (
          <Link
            href="/treasure-hunt"
            className="text-[#D4AF3D] font-semibold hover:text-[#b8932f] transition"
          >
            Treasure Hunt
          </Link>
        )}
      </div>

      {/* Mobile Menu Button and Session-aware buttons (right) */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-[#D4AF3D] transition"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {session?.user ? (
          <>
            {/* Cart Icon with Count */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-[#D4AF3D] transition"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF3D] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
            {canListItems && (
              <Link href="/list-item" className="btn btn-primary btn-md">
                List an Item
              </Link>
            )}
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
          <div className="flex items-center gap-3">
            <Link href="/listings" className="btn btn-secondary btn-md">
              Listings
            </Link>
            <button
              onClick={openSignupModal}
              className="btn btn-primary btn-md"
            >
              Get Early Access
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur border-b border-[#eee] shadow-lg">
          <div className="px-6 py-4 space-y-4">
            {/* Home Link */}
            <div className="space-y-2">
              {session?.user ? (
                // Logged in: Show consolidated Home link
                <Link
                  href="/"
                  className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              ) : (
                // Logged out: Show individual landing page links
                <>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Landing Page
                  </h3>
                  <button
                    onClick={() => {
                      handleNavigation("how-it-works");
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("pricing");
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("why-treasurehub");
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  >
                    Why TreasureHub
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation("roadmap");
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  >
                    Roadmap
                  </button>
                </>
              )}
            </div>

            {/* Other Pages */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Pages
              </h3>
              <Link
                href="/faq"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/listings"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Listings
              </Link>
              {session?.user && (
                <Link
                  href="/cart"
                  className="flex items-center justify-between w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Shopping Cart
                  </span>
                  {cartItemCount > 0 && (
                    <span className="bg-[#D4AF3D] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href="/our-origin"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our Origin
              </Link>
              <Link
                href="/seller-landing"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Become a Seller
              </Link>
              {session?.user && (
                <Link
                  href="/treasure-hunt"
                  className="block w-full text-left py-2 text-[#D4AF3D] font-semibold hover:text-[#b8932f] transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Treasure Hunt
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
