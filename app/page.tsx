"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PriceSlider from "./components/PriceSlider";
import ScrollSection from "./components/ScrollSection";

// Dynamically import the 3D background to prevent SSR issues
const ThreeScene = dynamic(() => import("./components/ThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f9fafb] flex items-center justify-center">
      <div className="text-gray-800 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-consigncrew-gold mx-auto mb-4"></div>
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitSuccess(true);
    setIsSubmitting(false);
    setEmail("");
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
          <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <ScrollSection animationType="fadeInLeft" delay={200}>
                <div className="text-center lg:text-left">
                  <div className="mb-6">
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                      <img
                        src="/Logo.png"
                        alt="ConsignCrew"
                        className="h-24 w-auto"
                      />
                      <h1 className="text-5xl lg:text-6xl font-bold text-gray-900">
                        Sell{" "}
                        <span className="text-consigncrew-gold">
                          Stress-Free
                        </span>
                      </h1>
                    </div>
                    <p className="text-xl lg:text-2xl text-gray-700 mb-6 max-w-2xl mx-auto lg:mx-0">
                      Turn garage clutter into cash without the headaches.
                    </p>
                    <ul className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto lg:mx-0 space-y-2">
                      <li className="flex items-center">
                        <span className="text-consigncrew-gold mr-2">•</span>
                        Automatically generated listings
                      </li>
                      <li className="flex items-center">
                        <span className="text-consigncrew-gold mr-2">•</span>
                        Set discount schedules
                      </li>
                      <li className="flex items-center">
                        <span className="text-consigncrew-gold mr-2">•</span>
                        Concierge pick-up/delivery
                      </li>
                      <li className="flex items-center">
                        <span className="text-consigncrew-gold mr-2">•</span>
                        Instant payouts
                      </li>
                    </ul>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="w-full">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-6 py-4 bg-white/80 backdrop-blur-md border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-consigncrew-gold focus:bg-white transition-all text-lg font-medium shadow-lg"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg border-2 border-yellow-400 hover:bg-yellow-600 hover:border-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
                      >
                        {isSubmitting ? "Joining..." : "Get Early Access"}
                      </button>
                    </div>
                    {submitSuccess && (
                      <p className="text-green-600 text-sm mt-2">
                        ✅ You're on the list! We'll notify you when we launch.
                      </p>
                    )}
                  </form>
                </div>
              </ScrollSection>

              {/* Right Side - Video Placeholder */}
              <ScrollSection animationType="fadeInRight" delay={400}>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-lg">Demo Video Coming Soon</p>
                      <p className="text-sm">YouTube link will be added here</p>
                    </div>
                  </div>
                </div>
              </ScrollSection>
            </div>
          </section>
        </ScrollSection>

        {/* Pain Points Section */}
        <ScrollSection animationType="scaleIn" threshold={0.3}>
          <PainPointsSection />
        </ScrollSection>

        {/* How It Works Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
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
                          className="w-12 h-12 text-consigncrew-gold"
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
                        Take a photo, AI generates your listing with optimized
                        title, description, and keywords.
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
                          className="w-12 h-12 text-consigncrew-gold"
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
                        AI analyzes market data and suggests the optimal price.
                        Accept or adjust to your preference.
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
                          className="w-12 h-12 text-consigncrew-gold"
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
                          className="w-12 h-12 text-consigncrew-gold"
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
                          className="w-12 h-12 text-consigncrew-gold"
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
                        className="w-10 h-10 text-consigncrew-gold"
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
                      Take a photo, AI generates your listing with optimized
                      title, description, and keywords.
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
                      AI analyzes market data and suggests the optimal price.
                      Accept or adjust to your preference.
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
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
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

        {/* Benefits Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    Why Choose ConsignCrew
                  </h2>
                  <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                    Everything you need to sell successfully, nothing you don't.
                  </p>
                </div>
              </ScrollSection>

              <div className="grid md:grid-cols-3 gap-8">
                <ScrollSection
                  animationType="fadeInLeft"
                  delay={300}
                  stagger={true}
                  staggerIndex={0}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Easy Listing
                    </h3>
                    <p className="text-gray-700">
                      Snap photos, add descriptions. Our AI creates perfect
                      listings in minutes.
                    </p>
                  </div>
                </ScrollSection>

                <ScrollSection
                  animationType="fadeInUp"
                  delay={400}
                  stagger={true}
                  staggerIndex={1}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Smart Shipping
                    </h3>
                    <p className="text-gray-700">
                      We handle packaging, shipping, and tracking. Or drop off
                      at our locations.
                    </p>
                  </div>
                </ScrollSection>

                <ScrollSection
                  animationType="fadeInRight"
                  delay={500}
                  stagger={true}
                  staggerIndex={2}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                        <path d="M12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8C14 6.9 13.1 6 12 6Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Safe & Fast Payout
                    </h3>
                    <p className="text-gray-700">
                      Funds held securely in escrow. Instant payout when your
                      item sells.
                    </p>
                  </div>
                </ScrollSection>
              </div>
            </div>
          </section>
        </ScrollSection>

        {/* Roadmap Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    Roadmap
                  </h2>
                  <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                    Our journey to revolutionize consignment. Join us for the
                    ride.
                  </p>
                </div>
              </ScrollSection>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Phase 1 */}
                <ScrollSection
                  animationType="fadeInLeft"
                  delay={300}
                  stagger={true}
                  staggerIndex={0}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Private Beta
                    </h3>
                    <p className="text-gray-700 mb-6">August 2025</p>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Invite-only access for sellers</li>
                      <li>• Core platform features</li>
                      <li>• Limited item categories</li>
                      <li>• Direct feedback integration</li>
                    </ul>
                  </div>
                </ScrollSection>

                {/* Phase 2 */}
                <ScrollSection
                  animationType="fadeInUp"
                  delay={400}
                  stagger={true}
                  staggerIndex={1}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-consigncrew-gold text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Public Launch
                    </h3>
                    <p className="text-gray-700 mb-6">September 2025</p>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Open to all users</li>
                      <li>• Expanded categories</li>
                      <li>• Advanced pricing analytics</li>
                      <li>• Delivery tracking</li>
                    </ul>
                  </div>
                </ScrollSection>

                {/* Phase 3 */}
                <ScrollSection
                  animationType="fadeInRight"
                  delay={500}
                  stagger={true}
                  staggerIndex={2}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <svg
                        className="w-12 h-12 text-consigncrew-gold"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17 1H7C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V3C19 1.9 18.1 1 17 1ZM17 19H7V5H17V19Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Mobile App
                    </h3>
                    <p className="text-gray-700 mb-6">October 2025</p>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• iOS & Android apps</li>
                      <li>• Push notifications</li>
                      <li>• Camera integration</li>
                      <li>• Offline capabilities</li>
                    </ul>
                  </div>
                </ScrollSection>
              </div>
            </div>
          </section>
        </ScrollSection>

        {/* Final CTA Section */}
        <ScrollSection animationType="fadeInUp" threshold={0.2}>
          <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollSection animationType="fadeInUp" delay={200}>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Ready to Sell Stress-Free?
                </h2>
                <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                  Join the Crew to maximize value and minimize your hassle.
                </p>
              </ScrollSection>
              <ScrollSection animationType="scaleIn" delay={400}>
                <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
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
                      className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg border-2 border-yellow-400 hover:bg-yellow-600 hover:border-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSubmitting ? "Joining..." : "Get Early Access"}
                    </button>
                  </div>
                </form>
              </ScrollSection>
            </div>
          </section>
        </ScrollSection>
      </div>
    </div>
  );
}
