"use client";

import React, { useState } from "react";
import { animated, useSpring } from "@react-spring/web";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  static?: boolean;
}

function SignupModal({
  open,
  onClose,
  onSuccess,
  static: isStatic = false,
}: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Animation spring
  const modalSpring = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0px)" : "translateY(20px)",
    config: { tension: 300, friction: 30 },
  });

  const backdropSpring = useSpring({
    opacity: open ? 1 : 0,
    config: { tension: 300, friction: 30 },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Mock API call - replace with real endpoint
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error("Subscription failed");
      }
    } catch (err) {
      // For demo purposes, always succeed
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isStatic) {
      onClose();
    }
  };

  if (!open && !isStatic) return null;

  return (
    <>
      {/* Backdrop */}
      <animated.div
        style={backdropSpring}
        className="fixed inset-0 modal-backdrop z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isStatic ? "relative" : ""
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          {/* Close button (only for non-static) */}
          {!isStatic && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Success state */}
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ConsignCrew!
              </h2>
              <p className="text-gray-600">
                You're now signed up for early access. We'll notify you when we
                launch!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-consigncrew-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isStatic ? "Get Early Access" : "Crate Full!"}
                </h2>
                <p className="text-gray-600">
                  {isStatic
                    ? "Be the first to experience our revolutionary 3D packing technology."
                    : "The crate is packed! Be the first to experience our revolutionary 3D packing technology."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-consigncrew-gold focus:border-transparent transition-colors"
                    required
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-consigncrew-gold text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Signing up..." : "Get Early Access"}
                </button>
              </form>

              {/* Footer */}
              <p className="text-xs text-gray-500 text-center mt-6">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </>
          )}
        </div>
      </animated.div>
    </>
  );
}

export default SignupModal;
