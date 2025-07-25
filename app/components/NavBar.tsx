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

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeClass = "font-bold text-blue-600";
  const inactiveClass = "text-gray-600 hover:text-blue-600";
  const { data: session } = authClient.useSession();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    setPopoverOpen(false);
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eee] flex items-center justify-between px-4 py-2 shadow-sm">
      {/* Branding/Logo */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <img
            src="/Consign Crew Banner Logo.png"
            alt="ConsignCrew logo"
            className="h-10 w-auto object-contain drop-shadow-md cursor-pointer"
          />
        </Link>
      </div>
      {/* Marketing Links (center, hidden on mobile) */}
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
      {/* Session-aware buttons (right) */}
      <div className="flex items-center gap-2">
        {session?.user ? (
          <>
            <Link
              href="/list-item"
              className="px-4 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
            >
              List an Item
            </Link>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 font-bold"
                >
                  Profile <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2">
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
          <>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
