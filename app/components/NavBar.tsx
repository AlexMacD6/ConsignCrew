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
  const [sellerDropdownOpen, setSellerDropdownOpen] = useState(false);
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          // Logged out: Show streamlined navigation
          <button
            onClick={() => handleNavigation("how-it-works")}
            className="hover:text-[#D4AF3D] transition"
          >
            How It Works
          </button>
        )}
        <Link href="/faq" className="hover:text-[#D4AF3D] transition">
          FAQ
        </Link>
        <Popover open={originDropdownOpen} onOpenChange={setOriginDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 font-medium text-base text-[#222] hover:text-[#D4AF3D] transition h-auto p-0 hover:bg-transparent"
            >
              Our Origin <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3">
            <Link
              href="/our-origin"
              className="block w-full px-4 py-2 text-sm hover:bg-accent rounded-md"
              onClick={() => setOriginDropdownOpen(false)}
            >
              Our Origin
            </Link>
            <Link
              href="/contact"
              className="block w-full px-4 py-2 text-sm hover:bg-accent rounded-md mt-1"
              onClick={() => setOriginDropdownOpen(false)}
            >
              Contact
            </Link>
          </PopoverContent>
        </Popover>
        <Popover open={sellerDropdownOpen} onOpenChange={setSellerDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 font-medium text-base text-[#222] hover:text-[#D4AF3D] transition h-auto p-0 hover:bg-transparent"
            >
              Become a Seller <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3">
            <Link
              href="/seller-landing"
              className="block w-full px-4 py-2 text-sm hover:bg-accent rounded-md"
              onClick={() => setSellerDropdownOpen(false)}
            >
              Seller Information
            </Link>
            <Link
              href="/appraisal"
              className="block w-full px-4 py-2 text-sm hover:bg-accent rounded-md mt-1"
              onClick={() => setSellerDropdownOpen(false)}
            >
              Quick Appraisal
            </Link>
          </PopoverContent>
        </Popover>
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
            <Link href="/login" className="btn btn-secondary btn-md">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary btn-md">
              Register
            </Link>
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
                // Logged out: Show streamlined navigation
                <button
                  onClick={() => {
                    handleNavigation("how-it-works");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                >
                  How It Works
                </button>
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
            </div>

            {/* Seller Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Seller
              </h3>
              <Link
                href="/seller-landing"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seller Information
              </Link>
              <Link
                href="/appraisal"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Quick Appraisal
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

            {/* Our Origin Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Our Origin
              </h3>
              <Link
                href="/our-origin"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our Origin
              </Link>
              <Link
                href="/contact"
                className="block w-full text-left py-2 text-[#222] font-medium hover:text-[#D4AF3D] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </div>

            {/* Authentication Section for Non-Authenticated Users */}
            {!session?.user && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full text-center py-3 text-[#222] font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full text-center py-3 bg-[#D4AF3D] text-white font-semibold rounded-lg hover:bg-[#b8932f] transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
