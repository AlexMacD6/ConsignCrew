"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PriceSlider from "../components/PriceSlider";
import ScrollSection from "../components/ScrollSection";
import TreasureMapCards from "../components/TreasureMapCards";
import Roadmap from "../components/Roadmap";

import EarlyAccessTracker from "../components/EarlyAccessTracker";
import IntegratedVideoPlayer from "../components/IntegratedVideoPlayer";
import { trackCompleteRegistration } from "../lib/meta-pixel-client";

// Dynamically import the 3D background to prevent SSR issues
const ThreeScene = dynamic(() => import("../components/ThreeScene"), {
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

// Dynamically import pain points section
const PainPointsSection = dynamic(
  () => import("../components/PainPointsSection"),
  {
    ssr: false,
  }
);

export default function SellerLandingPage() {
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
        body: JSON.stringify({
          email,
          source,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setEmail("");
        setRefreshTrigger((prev) => prev + 1);

        // Track registration completion
        trackCompleteRegistration();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to subscribe");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f9fafb]">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section - SELLER FOCUSED */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-treasure-500/5 to-treasure-600/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-treasure-600/5 to-treasure-700/5 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-treasure-500/3 to-treasure-600/3 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
                {/* Video Section - Left Side (3 columns) */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <ScrollSection animationType="fadeInLeft" delay={200}>
                    <IntegratedVideoPlayer
                      videoId="9hmtpNu3_Lk"
                      title="TreasureHub - How Easy It Is To Get Paid"
                      aspectRatio="16/10"
                      showControls={false}
                      autoplay={true}
                      muted={true}
                    />
                  </ScrollSection>
                </div>

                {/* Text Content - Right Side (2 columns) */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                  <ScrollSection animationType="fadeInRight" delay={400}>
                    <div className="text-left">
                      <div className="mb-6">
                        {/* Logo and Title - Stack on mobile, side by side on desktop */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                          <img
                            src="/TreasureHub - Logo.png"
                            alt="TreasureHub"
                            className="h-16 sm:h-20 w-auto"
                          />
                          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                            Sell{" "}
                            <span className="text-treasure-500">
                              Stress-Free
                            </span>
                          </h1>
                        </div>
                        <div className="max-w-2xl relative">
                          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 text-center sm:text-left">
                            Turn clutter into cash without the hassle
                          </p>
                          <ul className="text-base sm:text-lg text-gray-700 mb-6 space-y-3 text-left">
                            <li className="flex items-center justify-start">
                              <span className="text-treasure-500 mr-3 text-lg sm:text-xl">
                                •
                              </span>
                              Automatically generated listings
                            </li>
                            <li className="flex items-center justify-start">
                              <span className="text-treasure-500 mr-3 text-lg sm:text-xl">
                                •
                              </span>
                              Set discount schedules
                            </li>
                            <li className="flex items-center justify-start">
                              <span className="text-treasure-500 mr-3 text-lg sm:text-xl">
                                •
                              </span>
                              Concierge pick-up/delivery
                            </li>
                            <li className="flex items-center justify-start">
                              <span className="text-treasure-500 mr-3 text-lg sm:text-xl">
                                •
                              </span>
                              Instant payouts
                            </li>
                          </ul>

                          {/* Houston Stamp Image - Positioned absolutely to not affect text layout */}
                          <div className="absolute top-24 right-0 transform translate-x-4 z-10">
                            <img
                              src="/built_in_houston_top_right.png"
                              alt="Built in Houston, TX"
                              className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-contain drop-shadow-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Early Access Tracker */}
                      <EarlyAccessTracker refreshTrigger={refreshTrigger} />

                      {/* Email Form */}
                      <form
                        onSubmit={handleEmailSubmit}
                        className="w-full max-w-lg mx-auto sm:mx-0"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-treasure-500 focus:bg-white transition-all text-base sm:text-lg font-medium shadow-lg"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary btn-xl whitespace-nowrap w-full sm:w-auto"
                          >
                            {isSubmitting ? "Joining..." : "Get Early Access"}
                          </button>
                        </div>
                        {showSuccessMessage && (
                          <p
                            className={`text-green-600 text-sm mt-2 transition-opacity duration-500 ${
                              showSuccessMessage ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            ✅ You're on the list! We'll notify you when we
                            launch.
                          </p>
                        )}
                        {error && (
                          <p className="text-red-600 text-sm mt-2">{error}</p>
                        )}
                      </form>
                    </div>
                  </ScrollSection>
                </div>
              </div>
            </div>
          </section>
        </ScrollSection>

        {/* Pain Points Section */}
        <ScrollSection animationType="scaleIn" threshold={0.3}>
          <PainPointsSection />
        </ScrollSection>

        {/* How It Works Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section
            id="how-it-works"
            className="py-12 lg:py-20 px-4 bg-white/80 backdrop-blur-sm"
          >
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-12 lg:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
                    How It Works
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                    From listing to payout in 5 simple steps. We handle
                    everything else.
                  </p>
                </div>
              </ScrollSection>

              {/* Flow Chart */}
              <div className="relative">
                {/* Desktop Flow Chart */}
                <div className="hidden lg:block">
                  <div className="flex items-stretch justify-between relative gap-3">
                    {/* Step 1 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center hover:bg-white transition-all relative z-10 flex-1 max-w-xs flex flex-col shadow-lg">
                      <div className="text-gray-900 font-bold text-2xl mb-3 text-left">
                        1
                      </div>
                      <div className="mb-3 flex justify-center">
                        <svg
                          className="w-12 h-12 text-treasure-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM20 5H17L15.8 3H8.2L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5Z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Snap & List
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Take a photo, our automated system generates your
                        listing with optimized title, description, and keywords.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          ≈ 1 minute total
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-treasure-500 to-treasure-500/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-treasure-500 border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center hover:bg-white transition-all relative z-10 flex-1 max-w-xs flex flex-col shadow-lg">
                      <div className="text-gray-900 font-bold text-2xl mb-3 text-left">
                        2
                      </div>
                      <div className="mb-3 flex justify-center">
                        <svg
                          className="w-12 h-12 text-treasure-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Set & Forget
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Set your price and discount schedule. We automatically
                        drop prices to maximize your sale potential.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          ≈ 30 seconds
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-treasure-500 to-treasure-500/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-treasure-500 border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center hover:bg-white transition-all relative z-10 flex-1 max-w-xs flex flex-col shadow-lg">
                      <div className="text-gray-900 font-bold text-2xl mb-3 text-left">
                        3
                      </div>
                      <div className="mb-3 flex justify-center">
                        <svg
                          className="w-12 h-12 text-treasure-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        We Promote
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Our AI optimizes your listing for maximum visibility. We
                        handle marketing, SEO, and social media promotion.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Fully automated
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-treasure-500 to-treasure-500/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-treasure-500 border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center hover:bg-white transition-all relative z-10 flex-1 max-w-xs flex flex-col shadow-lg">
                      <div className="text-gray-900 font-bold text-2xl mb-3 text-left">
                        4
                      </div>
                      <div className="mb-3 flex justify-center">
                        <svg
                          className="w-12 h-12 text-treasure-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 7h-3V6c0-1.7-1.3-3-3-3h-2C10.3 3 9 4.3 9 6v1H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM12 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-6H9V6c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        We Pick Up
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        When your item sells, our concierge service picks it up
                        from your location. No need to leave your home.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Scheduled pickup
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-treasure-500 to-treasure-500/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-treasure-500 border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center hover:bg-white transition-all relative z-10 flex-1 max-w-xs flex flex-col shadow-lg">
                      <div className="text-gray-900 font-bold text-2xl mb-3 text-left">
                        5
                      </div>
                      <div className="mb-3 flex justify-center">
                        <svg
                          className="w-12 h-12 text-treasure-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Get Paid
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Money hits your account instantly. No waiting for checks
                        or bank transfers. Your cash, immediately.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Instant payout
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Flow Chart */}
                <div className="lg:hidden space-y-4">
                  {/* Step 1 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-left hover:bg-white transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-900 font-bold text-2xl">1</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Snap & List
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Take a photo, our automated system generates your
                          listing with optimized title, description, and
                          keywords.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          ≈ 1 minute total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-left hover:bg-white transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-900 font-bold text-2xl">2</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Set & Forget
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Set your price and discount schedule. We automatically
                          drop prices to maximize your sale potential.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          ≈ 30 seconds
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-left hover:bg-white transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-900 font-bold text-2xl">3</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          We Promote
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Our AI optimizes your listing for maximum visibility.
                          We handle marketing, SEO, and social media promotion.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          Fully automated
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-left hover:bg-white transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-900 font-bold text-2xl">4</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          We Pick Up
                        </h3>
                        <p className="text-gray-700 text-sm">
                          When your item sells, our concierge service picks it
                          up from your location. No need to leave your home.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          Scheduled pickup
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-left hover:bg-white transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-900 font-bold text-2xl">5</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Get Paid
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Money hits your account instantly. No waiting for
                          checks or bank transfers. Your cash, immediately.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          Instant payout
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollSection>

        {/* Treasure Map Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-12 lg:py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-12 lg:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
                    Your Treasure Map
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                    Navigate your selling journey with our comprehensive tools
                    and insights.
                  </p>
                </div>
              </ScrollSection>

              <TreasureMapCards />
            </div>
          </section>
        </ScrollSection>

        {/* Pricing Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-12 lg:py-20 px-4 bg-white/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-12 lg:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                    No hidden fees. No surprises. Just clear, fair pricing that
                    works for you.
                  </p>
                </div>
              </ScrollSection>

              <PriceSlider />
            </div>
          </section>
        </ScrollSection>

        {/* Roadmap Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-12 lg:py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-12 lg:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
                    Our Roadmap
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                    See what's coming next and how we're building the future of
                    hassle-free selling.
                  </p>
                </div>
              </ScrollSection>

              <Roadmap />
            </div>
          </section>
        </ScrollSection>

        {/* Final CTA Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-12 lg:py-20 px-4 bg-gradient-to-br from-treasure-500 to-treasure-600">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Turn Clutter Into Cash?
                </h2>
                <p className="text-xl text-treasure-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of sellers who are already making money without
                  the hassle. Start your stress-free selling journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/list-item"
                    className="bg-white text-treasure-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Start Selling Now
                  </Link>
                  <button
                    onClick={(e) => handleEmailSubmit(e, "final-cta")}
                    className="border-2 border-white text-white hover:bg-white hover:text-treasure-600 font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200"
                  >
                    Get Early Access
                  </button>
                </div>
              </ScrollSection>
            </div>
          </section>
        </ScrollSection>
      </div>
    </div>
  );
}

