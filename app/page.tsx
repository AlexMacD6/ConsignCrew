"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PriceSlider from "./components/PriceSlider";
import ScrollSection from "./components/ScrollSection";
import TreasureMapCards from "./components/TreasureMapCards";
import Roadmap from "./components/Roadmap";

import EarlyAccessTracker from "./components/EarlyAccessTracker";

// Dynamically import the 3D background to prevent SSR issues
const ThreeScene = dynamic(() => import("./components/ThreeScene"), {
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
  () => import("./components/PainPointsSection"),
  {
    ssr: false,
  }
);

export default function HomePage() {
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
        if (data.message === "Email already subscribed") {
          setError(
            "You're already signed up! We'll notify you when we launch."
          );
        } else {
          setSubmitSuccess(true);
          setEmail("");
          setRefreshTrigger((prev) => prev + 1); // Trigger refresh of tracker
        }
      } else {
        setError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
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
        {/* Hero Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="min-h-[80vh] flex items-center justify-center px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-12 items-center">
                {/* Video Section - Left Side (3 columns) */}
                <div className="lg:col-span-3">
                  <ScrollSection animationType="fadeInLeft" delay={200}>
                    <div className="relative">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-treasure-500/20 to-treasure-600/20 p-2">
                        <iframe
                          src="https://www.youtube.com/embed/9hmtpNu3_Lk?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
                          title="TreasureHub - How Easy It Is To Get Paid"
                          className="w-full h-auto rounded-xl"
                          style={{ aspectRatio: "16/10", minHeight: "400px" }}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        {/* Subtle overlay for better text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-xl"></div>
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute -top-4 -left-4 w-8 h-8 bg-treasure-500 rounded-full opacity-20 animate-pulse"></div>
                      <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-treasure-600 rounded-full opacity-30 animate-pulse delay-1000"></div>
                    </div>
                  </ScrollSection>
                </div>

                {/* Text Content - Right Side (2 columns) */}
                <div className="lg:col-span-2">
                  <ScrollSection animationType="fadeInRight" delay={400}>
                    <div className="text-left">
                      <div className="mb-6">
                        <div className="flex items-center gap-4 mb-6">
                          <img
                            src="/TreasureHub - Logo.png"
                            alt="TreasureHub"
                            className="h-20 w-auto"
                          />
                          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 whitespace-nowrap">
                            Sell{" "}
                            <span className="text-treasure-500">
                              Stress-Free
                            </span>
                          </h1>
                        </div>
                        <div className="max-w-2xl">
                          <p className="text-xl lg:text-2xl text-gray-700 mb-8">
                            Turn clutter into cash without the hassle
                          </p>
                          <ul className="text-lg text-gray-700 mb-6 space-y-3">
                            <li className="flex items-center">
                              <span className="text-treasure-500 mr-3 text-xl">
                                •
                              </span>
                              Automatically generated listings
                            </li>
                            <li className="flex items-center">
                              <span className="text-treasure-500 mr-3 text-xl">
                                •
                              </span>
                              Set discount schedules
                            </li>
                            <li className="flex items-center">
                              <span className="text-treasure-500 mr-3 text-xl">
                                •
                              </span>
                              Concierge pick-up/delivery
                            </li>
                            <li className="flex items-center">
                              <span className="text-treasure-500 mr-3 text-xl">
                                •
                              </span>
                              Instant payouts
                            </li>
                          </ul>

                          {/* Houston Stamp/Seal */}
                          <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-treasure-500/10 border-2 border-treasure-500/30 rounded-full text-sm font-medium text-treasure-600 shadow-lg">
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Built in Houston, TX
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Early Access Tracker */}
                      <EarlyAccessTracker refreshTrigger={refreshTrigger} />

                      {/* Email Form */}
                      <form
                        onSubmit={handleEmailSubmit}
                        className="w-full max-w-lg"
                      >
                        <div className="flex gap-3">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 bg-white/80 backdrop-blur-md border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-treasure-500 focus:bg-white transition-all text-lg font-medium shadow-lg"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary btn-xl whitespace-nowrap"
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
            className="py-20 px-4 bg-white/80 backdrop-blur-sm"
          >
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    How It Works
                  </h2>
                  <p className="text-xl text-gray-700 max-w-3xl mx-auto">
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
                          <div className="w-6 h-1 bg-gradient-to-r from-consigncrew-gold to-consigncrew-gold/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
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
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Smart Price
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Our automated system analyzes market data and suggests
                        the optimal price. Accept or adjust to your preference.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">Instant</p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-consigncrew-gold to-consigncrew-gold/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
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
                          <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Stay-Home Storage
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Your item stays safely at home until it sells. No need
                        to ship or store elsewhere.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Days → weeks
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-consigncrew-gold to-consigncrew-gold/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
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
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Concierge Pickup
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Once buyer pays, our driver collects your item and
                        handles all shipping logistics.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Same / next day
                        </p>
                        {/* Arrow inside */}
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-consigncrew-gold to-consigncrew-gold/60"></div>
                          <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent ml-1"></div>
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
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                          <path d="M12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8C14 6.9 13.1 6 12 6Z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Escrow → Payout
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 flex-grow">
                        Funds are held securely in escrow and automatically
                        released once delivery is confirmed.
                      </p>
                      <div className="mt-auto">
                        <p className="text-gray-500 text-xs mb-3">
                          Money in ≤ 24 h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Flow Chart */}
                <div className="lg:hidden space-y-4">
                  {/* Step 1 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 text-center hover:bg-white transition-all relative shadow-lg">
                    <div className="text-gray-900 font-bold text-xl mb-2 text-left">
                      1
                    </div>
                    <div className="mb-2 flex justify-center">
                      <svg
                        className="w-10 h-10 text-treasure-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM20 5H17L15.8 3H8.2L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Snap & List
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      Take a photo, our automated system generates your listing
                      with optimized title, description, and keywords.
                    </p>
                    <p className="text-gray-500 text-xs mb-2">
                      ≈ 1 minute total
                    </p>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 text-center hover:bg-white transition-all relative shadow-lg">
                    <div className="text-gray-900 font-bold text-xl mb-2 text-left">
                      2
                    </div>
                    <div className="mb-2 flex justify-center">
                      <svg
                        className="w-10 h-10 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Smart Price
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      Our automated system analyzes market data and suggests the
                      optimal price. Accept or adjust to your preference.
                    </p>
                    <p className="text-gray-500 text-xs mb-2">Instant</p>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 text-center hover:bg-white transition-all relative shadow-lg">
                    <div className="text-gray-900 font-bold text-xl mb-2 text-left">
                      3
                    </div>
                    <div className="mb-2 flex justify-center">
                      <svg
                        className="w-10 h-10 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Stay-Home Storage
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      Your item stays safely at home until it sells. No need to
                      ship or store elsewhere.
                    </p>
                    <p className="text-gray-500 text-xs mb-2">Days → weeks</p>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 text-center hover:bg-white transition-all relative shadow-lg">
                    <div className="text-gray-900 font-bold text-xl mb-2 text-left">
                      4
                    </div>
                    <div className="mb-2 flex justify-center">
                      <svg
                        className="w-10 h-10 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Concierge Pickup
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      Once buyer pays, our driver collects your item and handles
                      all shipping logistics.
                    </p>
                    <p className="text-gray-500 text-xs mb-2">
                      Same / next day
                    </p>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-3 border-l-consigncrew-gold border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 text-center hover:bg-white transition-all relative shadow-lg">
                    <div className="text-gray-900 font-bold text-xl mb-2 text-left">
                      5
                    </div>
                    <div className="mb-2 flex justify-center">
                      <svg
                        className="w-10 h-10 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                        <path d="M12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8C14 6.9 13.1 6 12 6Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Escrow → Payout
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      Funds are held securely in escrow and automatically
                      released once delivery is confirmed.
                    </p>
                    <p className="text-gray-500 text-xs mb-2">
                      Money in ≤ 24 h
                    </p>
                    <div className="flex justify-center">
                      <div className="text-green-600 text-sm font-semibold">
                        ✓ Complete!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollSection>

        {/* Transparent Pricing Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section
            id="pricing"
            className="py-20 px-4 bg-white/80 backdrop-blur-sm"
          >
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    Transparent Pricing
                  </h2>
                  <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                    Interactive pricing calculator. See exactly what you'll earn
                    based on your item's value.
                  </p>
                </div>
              </ScrollSection>

              <ScrollSection animationType="scaleIn" delay={400}>
                <PriceSlider />
              </ScrollSection>
            </div>
          </section>
        </ScrollSection>

        {/* Treasure Map Cards Section */}
        <TreasureMapCards />

        {/* Roadmap Section */}
        <Roadmap />

        {/* Final CTA Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Ready to Sell{" "}
                  <span className="text-treasure-500">Stress-Free</span>?
                </h2>
                <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                  Join the Crew to maximize value and minimize your hassle.
                </p>
              </ScrollSection>
              <ScrollSection animationType="scaleIn" delay={400}>
                <form
                  onSubmit={(e) => handleEmailSubmit(e, "footer")}
                  className="max-w-md mx-auto"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-consigncrew-gold focus:bg-white transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg"
                    >
                      {isSubmitting ? "Joining..." : "Get Early Access"}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                  {showSuccessMessage && (
                    <p
                      className={`text-green-600 text-sm mt-2 transition-opacity duration-500 ${
                        showSuccessMessage ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      ✅ You're on the list! We'll notify you when we launch.
                    </p>
                  )}
                </form>
              </ScrollSection>
            </div>
          </section>
        </ScrollSection>
      </div>
    </div>
  );
}
