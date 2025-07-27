"use client";

import React, { useState, useEffect } from "react";
import SignupModal from "../components/SignupModal";

export default function PackingTetrisPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSignedUp, setHasSignedUp] = useState(false);

  // Check for existing signup
  useEffect(() => {
    const signedUp = localStorage.getItem("signedUp");
    if (signedUp) {
      setHasSignedUp(true);
    }
  }, []);

  // Handle signup success
  const handleSignupSuccess = () => {
    localStorage.setItem("signedUp", "true");
    setHasSignedUp(true);
    setIsModalOpen(false);
  };

  // If user has already signed up, show a simple message
  if (hasSignedUp) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-consigncrew-dark to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">
            Welcome back to ConsignCrew!
          </h1>
          <p className="text-xl text-gray-300">
            You're already signed up for early access.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("signedUp");
              setHasSignedUp(false);
            }}
            className="mt-6 px-6 py-3 bg-consigncrew-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            View Information Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-consigncrew-dark to-gray-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-consigncrew-gold mb-4">
            ConsignCrew
          </h1>
          <h2 className="text-3xl font-semibold text-white mb-6">
            The Future of Consignment
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience our revolutionary technology that optimizes space and
            maximizes value for your consigned items.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* How It Works */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <span className="bg-consigncrew-gold text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                  1
                </span>
                <p>List your items with photos and descriptions</p>
              </div>
              <div className="flex items-start">
                <span className="bg-consigncrew-gold text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                  2
                </span>
                <p>Our AI optimizes pricing and presentation</p>
              </div>
              <div className="flex items-start">
                <span className="bg-consigncrew-gold text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                  3
                </span>
                <p>We handle shipping and customer service</p>
              </div>
              <div className="flex items-start">
                <span className="bg-consigncrew-gold text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                  4
                </span>
                <p>Get paid quickly and securely</p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-white mb-4">Key Features</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                AI-powered pricing optimization
              </li>
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                Automated listing creation
              </li>
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                Smart shipping logistics
              </li>
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                Real-time inventory tracking
              </li>
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                Instant payment processing
              </li>
              <li className="flex items-center">
                <span className="text-consigncrew-gold mr-2">✓</span>
                24/7 customer support
              </li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Why Choose ConsignCrew
            </h3>
            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-1">
                  Higher Profits
                </h4>
                <p className="text-sm">
                  Our AI ensures you get the best possible price for your items
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Save Time</h4>
                <p className="text-sm">
                  No more endless listing, shipping, or customer service tasks
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Peace of Mind</h4>
                <p className="text-sm">
                  Professional handling of your valuable items from start to
                  finish
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-gray-300 mb-6">
              Join our waitlist and be among the first to experience the future
              of consignment.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-consigncrew-gold text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-all transform hover:scale-105 text-lg"
            >
              Join the Waitlist
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            Early access coming soon. Sign up to be notified when we launch.
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
}
