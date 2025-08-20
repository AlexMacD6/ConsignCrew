"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PriceSlider from "./PriceSlider";
import ScrollSection from "./ScrollSection";
import TreasureMapCards from "./TreasureMapCards";
import Roadmap from "./Roadmap";
import EarlyAccessTracker from "./EarlyAccessTracker";
import HeroListingsCarousel from "./HeroListingsCarousel";
import { trackCompleteRegistration } from "../lib/meta-pixel-client";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { authClient } from "../lib/auth-client";

// Dynamically import the 3D background to prevent SSR issues
const ThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f9fafb] flex items-center justify-center">
      <div className="text-gray-800 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-treasure-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});

// Dynamically import buyer pain points section
const BuyerPainPointsSection = dynamic(
  () => import("./BuyerPainPointsSection"),
  {
    ssr: false,
  }
);

export default function HomePageClient() {
  const { data: session } = authClient.useSession();
  const { canListItems } = useUserPermissions();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Ensure page starts at the top when loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle hash navigation from other pages
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        const sectionId = hash.substring(1); // Remove the # symbol
        const element = document.getElementById(sectionId);
        if (element) {
          // Small delay to ensure page is fully loaded
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    };

    // Handle initial load with hash
    handleHashNavigation();

    // Handle hash changes
    const handleHashChange = () => {
      handleHashNavigation();
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle success message fade-out
  useEffect(() => {
    if (submitSuccess) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const handleEmailSubmit = async (
    e: React.FormEvent,
    source: string = "hero"
  ) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError("");
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        setEmail("");
        setRefreshTrigger((prev) => prev + 1);

        // Track the conversion with Meta Pixel
        trackCompleteRegistration(email);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Successfully signed up! Welcome to TreasureHub.</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <ThreeScene />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Your Clutter's
            <span className="block text-treasure-500">Hidden Treasure</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional consignment service that handles everything from pickup
            to sale. We clean, photograph, authenticate, and sell your items
            with transparent pricing.
          </p>

          {/* Email Signup Form */}
          <form
            onSubmit={(e) => handleEmailSubmit(e, "hero")}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-12"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-treasure-500 focus:border-transparent text-lg"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-treasure-500 hover:bg-treasure-600 text-white font-semibold rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? "Joining..." : "Get Early Access"}
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm mb-4 max-w-md mx-auto">
              {error}
            </p>
          )}

          {/* CTA Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session?.user && canListItems && (
              <Link
                href="/list-item"
                className="inline-flex items-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-colors duration-200 text-lg"
              >
                List Your Item
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            )}
            <Link
              href="/listings"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 font-semibold rounded-full transition-colors duration-200 text-lg"
            >
              Browse Treasures
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Early Access Tracker */}
      <EarlyAccessTracker key={refreshTrigger} />

      {/* Hero Listings Carousel */}
      <HeroListingsCarousel />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How TreasureHub Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process turns your unwanted items into cash while
              you sit back and relax.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Schedule Pickup",
                description:
                  "Book a free pickup at your convenience. Our team comes to you.",
                icon: "📅",
              },
              {
                step: "02",
                title: "We Handle Everything",
                description:
                  "Professional cleaning, authentication, photography, and listing across multiple platforms.",
                icon: "✨",
              },
              {
                step: "03",
                title: "Get Paid",
                description:
                  "Receive your share when items sell. Transparent pricing, no hidden fees.",
                icon: "💰",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-treasure-500 font-bold text-lg mb-2">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Slider Section */}
      <section className="py-20 bg-[#f9fafb]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See exactly how much you'll earn with our sliding commission
              structure. Higher-value items = lower commission rates.
            </p>
          </div>
          <PriceSlider />
        </div>
      </section>

      {/* Buyer Pain Points Section */}
      <BuyerPainPointsSection />

      {/* Treasure Map Cards Section */}
      <TreasureMapCards />

      {/* Roadmap Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow our progress as we build the future of consignment
              services.
            </p>
          </div>
          <Roadmap />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Turn Clutter into Cash?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who've discovered the treasure
            hidden in their homes.
          </p>

          {/* Email Signup Form */}
          <form
            onSubmit={(e) => handleEmailSubmit(e, "footer")}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-treasure-500 focus:border-transparent text-lg"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-treasure-500 hover:bg-treasure-600 text-white font-semibold rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? "Joining..." : "Get Started"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm mb-4 max-w-md mx-auto">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session?.user && canListItems && (
              <Link
                href="/list-item"
                className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-full transition-colors duration-200 text-lg"
              >
                List Your Item
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            )}
            <Link
              href="/listings"
              className="inline-flex items-center px-8 py-4 border-2 border-white hover:bg-white hover:text-gray-900 text-white font-semibold rounded-full transition-colors duration-200 text-lg"
            >
              Browse Treasures
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll Sections */}
      <ScrollSection />
    </div>
  );
}
