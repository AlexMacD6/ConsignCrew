"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackCompleteRegistration } from "../lib/meta-pixel-client";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle success message fade-out
  useEffect(() => {
    if (submitSuccess) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setSubmitSuccess(false);
        onClose(); // Close the modal after fade-out
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "modal" }),
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

          // Dispatch custom event to refresh tracker
          window.dispatchEvent(new CustomEvent("earlyAccessSignup"));

          // Track CompleteRegistration event for successful new signups (client-side)
          try {
            trackCompleteRegistration({
              content_name: "Early Access Signup",
              content_category: "Lead Generation",
              value: 1,
              currency: "USD",
              source: "modal",
              signup_number: data.signupNumber,
            }).catch((trackingError) => {
              console.error(
                "Error tracking CompleteRegistration (modal):",
                trackingError
              );
              // Don't fail the signup if tracking fails
            });
          } catch (trackingError) {
            console.error(
              "Error tracking CompleteRegistration (modal):",
              trackingError
            );
            // Don't fail the signup if tracking fails
          }

          // Close modal after 3 seconds
          setTimeout(() => {
            onClose();
            setSubmitSuccess(false);
          }, 3000);
        }
      } else {
        setError(data.error || "Failed to subscribe");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl pointer-events-auto mx-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
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

            {/* Content */}
            <div className="text-center">
              <div className="mb-6">
                <img
                  src="/TreasureHub - Logo.png"
                  alt="TreasureHub"
                  className="h-16 w-auto mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Get Early Access
                </h2>
                <p className="text-gray-600">
                  Be the first to know when we launch and get exclusive early
                  access to start selling with us.
                </p>
              </div>

              {!submitSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-treasure-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn btn-primary btn-lg"
                  >
                    {isSubmitting ? "Joining..." : "Join Seller List"}
                  </button>
                </form>
              ) : (
                <div
                  className={`text-center transition-opacity duration-500 ${
                    showSuccessMessage ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-gray-600">
                    We'll notify you when we launch.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
