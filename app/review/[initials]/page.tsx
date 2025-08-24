"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface ReviewPageProps {
  params: {
    initials: string;
  };
}

interface DriverInfo {
  initials: string;
  fullName: string;
  redirectUrl: string;
}

// Component to handle the review pre-screening and redirect
export default function ReviewPage({ params }: ReviewPageProps) {
  const [step, setStep] = useState<
    "loading" | "rating" | "redirecting" | "thankyou"
  >("loading");
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    async function loadDriverInfo() {
      try {
        const { initials } = await params;

        // Get driver info and log the scan
        const response = await fetch(`/api/review/${initials.toUpperCase()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            window.location.href = "/review/not-found";
            return;
          }
          throw new Error("Failed to process review redirect");
        }

        const data = await response.json();
        setDriverInfo({
          initials: data.driver.initials,
          fullName: data.driver.fullName,
          redirectUrl: data.redirectUrl,
        });
        setStep("rating");
      } catch (error) {
        console.error("Error processing review redirect:", error);
        window.location.href = "/review/not-found";
      }
    }

    loadDriverInfo();
  }, [params]);

  const handleRating = async (rating: number) => {
    if (!driverInfo) return;

    try {
      // Log the rating
      await fetch(`/api/review/${driverInfo.initials}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (rating >= 4) {
        // High rating: redirect to Google Reviews
        setStep("redirecting");
        setTimeout(() => {
          window.location.href = driverInfo.redirectUrl;
        }, 2000);
      } else {
        // Low rating: show thank you message
        setStep("thankyou");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      // On error, still proceed with the flow
      if (rating >= 4) {
        window.location.href = driverInfo.redirectUrl;
      } else {
        setStep("thankyou");
      }
    }
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-600 mx-auto mb-4"></div>
          <p className="text-treasure-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Rating selection state
  if (step === "rating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              How was your delivery experience?
            </h1>
            <p className="text-gray-600">
              Your feedback helps us improve our service
            </p>
            {driverInfo && (
              <p className="text-sm text-treasure-600 mt-2">
                Driver: {driverInfo.fullName}
              </p>
            )}
          </div>

          <div className="mb-8">
            <p className="text-lg font-medium text-gray-800 mb-4">
              How was your delivery experience with TreasureHub?
            </p>

            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-12 w-12 ${
                      star <= hoveredStar
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex justify-between text-sm text-gray-500 mt-4 px-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirecting to Google Reviews state
  if (step === "redirecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-600 mx-auto mb-4"></div>
          <p className="text-treasure-700 font-medium">
            Thanks for the great rating! Redirecting to Google Reviews...
          </p>
          <p className="text-sm text-treasure-600 mt-2">
            Your review helps our driver earn a bonus!
          </p>
        </div>
      </div>
    );
  }

  // Thank you message for low ratings
  if (step === "thankyou") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-treasure-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-treasure-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you for your feedback!
            </h1>
            <p className="text-gray-600 mb-4">
              Our team will follow up to ensure we improve your experience.
            </p>
            <p className="text-sm text-gray-500">
              We appreciate you taking the time to let us know how we can serve
              you better.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
