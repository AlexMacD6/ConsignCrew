"use client";
import { useState } from "react";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import React from "react";
import Link from "next/link";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#fffbe6] to-[#f7f7f7] min-h-screen flex flex-col">
      {/* Hero / Above the Fold */}
      <section className="relative flex flex-col items-center justify-center text-center py-28 px-4 bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none opacity-10 bg-[url('/Logo.png')] bg-center bg-no-repeat bg-contain" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#222] mb-6 drop-shadow-lg leading-tight animate-fade-in">
            Sell Stress‑Free
          </h1>
          <p className="text-xl md:text-2xl text-[#825E08] mb-10 max-w-xl mx-auto animate-fade-in delay-100">
            ConsignCrew helps you list, ship, and get paid in a click. Join our
            waitlist today and be first in line for early access.
          </p>
          <form
            onSubmit={handleEmailSubmit}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto justify-center animate-fade-in delay-200"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 shadow focus:ring-2 focus:ring-[#D4AF3D] text-[#222] bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitted || submitting}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
              disabled={submitted || submitting}
            >
              Get Early Access
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-3 animate-fade-in delay-300">
            No spam. Unsubscribe anytime.
          </div>
          {error && (
            <div className="text-red-400 mt-4 animate-fade-in delay-300">
              {error}
            </div>
          )}
          {submitted && (
            <div className="text-green-400 mt-4 animate-fade-in delay-300">
              You're on the list – we'll be in touch.
            </div>
          )}
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full flex justify-center my-8">
        <div className="h-1 w-24 bg-gradient-to-r from-[#D4AF3D] via-[#fffbe6] to-[#D4AF3D] rounded-full shadow" />
      </div>

      {/* Pain Point Section - Now Second */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center border-t-4 border-[#825E08] animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#222]">
            The Problem We're Solving
          </h2>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            Valuable items just sit collecting dust in your garage because
            selling means wading through hundreds of bot‑filled or tire‑kicking
            messages, arranging awkward cash meetups, and risking sketchy
            encounters with strangers.
          </p>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full flex justify-center my-8">
        <div className="h-1 w-24 bg-gradient-to-r from-[#825E08] via-[#fffbe6] to-[#825E08] rounded-full shadow" />
      </div>

      {/* Mission, Problem Details, Solution as Cards in a Responsive Grid */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {/* Mission Card */}
        <div
          id="mission"
          className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-[#D4AF3D] animate-fade-in"
        >
          <h2 className="text-2xl font-bold mb-4 text-[#222]">Our Mission</h2>
          <p className="text-base text-gray-700 mb-4">
            At <span className="font-bold">ConsignCrew</span>, we believe
            selling should be simple, transparent, and—dare we say—enjoyable.
            Too many people struggle with complicated listing sites, endless
            packaging headaches, and missing payouts. We're on a mission to
            change that by:
          </p>
          <ul className="space-y-2 text-base">
            <li>
              📦{" "}
              <span className="font-semibold">
                Automating the entire consignment flow
              </span>
            </li>
            <li>
              🤝 <span className="font-semibold">Putting you in control</span>
            </li>
            <li>
              🚀{" "}
              <span className="font-semibold">
                Making selling as easy as clicking a button
              </span>
            </li>
          </ul>
        </div>
        {/* Problem Details Card */}
        <div
          id="problem"
          className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-[#825E08] animate-fade-in delay-100"
        >
          <h2 className="text-2xl font-bold mb-4 text-[#222]">The Details</h2>
          <ol className="list-decimal list-inside space-y-2 text-base text-left mx-auto max-w-xs">
            <li>
              <span className="font-semibold">Listing overload.</span> Countless
              marketplaces, inconsistent rules, and confusing fees.
            </li>
            <li>
              <span className="font-semibold">Logistics headache.</span> Finding
              shipping labels, tracking packages, and chasing couriers.
            </li>
            <li>
              <span className="font-semibold">Payment uncertainty.</span>{" "}
              Delayed payouts, hidden discounts, and invoice surprises.
            </li>
          </ol>
        </div>
        {/* Solution Card */}
        <div
          id="solution"
          className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-[#D4AF3D] animate-fade-in delay-200"
        >
          <h2 className="text-2xl font-bold mb-4 text-[#222]">
            Our (Future) Solution
          </h2>
          <ul className="space-y-3 text-base">
            <li>
              <span className="font-bold">One‑Click Listing</span>
              <br />
              Snap a photo, set your price, and hit "List." We'll handle the
              rest.
            </li>
            <li>
              <span className="font-bold">Built‑In Pickup & Delivery</span>
              <br />
              Schedule a pickup in-app; we pack, ship, and track—end to end.
            </li>
            <li>
              <span className="font-bold">Instant Payouts</span>
              <br />
              Get paid as soon as your item sells, with zero hidden fees.
            </li>
          </ul>
          <div className="text-xs text-gray-500 mt-4">
            (…and more features coming soon!)
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full flex justify-center my-8">
        <div className="h-1 w-24 bg-gradient-to-r from-[#D4AF3D] via-[#fffbe6] to-[#D4AF3D] rounded-full shadow" />
      </div>

      {/* Waitlist / CTA */}
      <section
        id="waitlist"
        className="py-16 px-4 flex flex-col items-center bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#fffbe6] rounded-2xl shadow-lg max-w-3xl mx-auto mb-16 animate-fade-in delay-300"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-[#222]">
          Why Join the Waitlist?
        </h2>
        <ul className="space-y-3 text-lg mb-6">
          <li>
            🎁 <span className="font-semibold">Exclusive Early Access</span> —
            First dibs on private beta.
          </li>
          <li>
            💬 <span className="font-semibold">Influence the Product</span> —
            Tell us your pain points; we'll build the solutions you need.
          </li>
          <li>
            🔒 <span className="font-semibold">Founders‑Only Perks</span> —
            Lifetime fee discounts, special badges, and more.
          </li>
        </ul>
        <div className="w-full max-w-md">
          <form
            onSubmit={handleEmailSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <input
              type="email"
              required
              placeholder="Your best email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 shadow focus:ring-2 focus:ring-[#D4AF3D] text-[#222] bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitted || submitting}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
              disabled={submitted || submitting}
            >
              Join the Crew
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2">
            No spam. Unsubscribe anytime.
          </div>
          {error && <div className="text-red-400 mt-4">{error}</div>}
          {submitted && (
            <div className="text-green-400 mt-4">
              You're on the list – we'll be in touch.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#f7f7f7] border-t border-[#eee] flex flex-col md:flex-row items-center justify-between gap-4 text-[#222] text-sm mt-auto">
        <div className="flex items-center gap-2">
          <a href="#about" className="hover:underline">
            About
          </a>
          <span>•</span>
          <a href="#privacy" className="hover:underline">
            Privacy
          </a>
          <span>•</span>
          <a href="#terms" className="hover:underline">
            Terms
          </a>
          <span>•</span>
          <a href="mailto:info@consigncrew.com" className="hover:underline">
            Contact
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hover:text-[#D4AF3D]"
            title="LinkedIn"
            aria-label="LinkedIn"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.844-1.563 3.042 0 3.604 2.003 3.604 4.605v5.591z" />
            </svg>
          </a>
          <a
            href="#"
            className="hover:text-[#D4AF3D]"
            title="Instagram"
            aria-label="Instagram"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.069 1.646.069 4.851s-.011 3.584-.069 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608-.058-1.266-.069-1.646-.069-4.85s.011-3.584.069-4.851c.062-1.366.334-2.633 1.308-3.608.974-.974 2.242-1.246 3.608-1.308 1.266-.058 1.646-.069 4.85-.069zm0-2.163c-3.259 0-3.667.012-4.947.07-1.276.058-2.687.334-3.678 1.325-.991.991-1.267 2.402-1.325 3.678-.058 1.28-.07 1.688-.07 4.947s.012 3.667.07 4.947c.058 1.276.334 2.687 1.325 3.678.991.991 2.402 1.267 3.678 1.325 1.28.058 1.688.07 4.947.07s3.667-.012 4.947-.07c1.276-.058 2.687-.334 3.678-1.325.991-.991 1.267-2.402 1.325-3.678.058-1.28.07-1.688.07-4.947s-.012-3.667-.07-4.947c-.058-1.276-.334-2.687-1.325-3.678-.991-.991-2.402-1.267-3.678-1.325-1.28-.058-1.688-.07-4.947-.07zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </a>
          <a
            href="#"
            className="hover:text-[#D4AF3D]"
            title="Twitter"
            aria-label="Twitter"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482c-4.086-.205-7.713-2.164-10.141-5.144a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z" />
            </svg>
          </a>
        </div>
        <div className="text-center md:text-right w-full md:w-auto mt-4 md:mt-0">
          © 2025 ConsignCrew. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
