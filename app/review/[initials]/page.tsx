"use client";

import { useEffect } from "react";

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

// Component to handle the review scan logging and redirect to Google Reviews
export default function ReviewPage({ params }: ReviewPageProps) {
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

        // Immediately redirect to Google Reviews (skip pre-screening)
        window.location.href = data.redirectUrl;
      } catch (error) {
        console.error("Error processing review redirect:", error);
        window.location.href = "/review/not-found";
      }
    }

    loadDriverInfo();
  }, [params]);

  // Show loading state while redirecting to Google Reviews
  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-600 mx-auto mb-4"></div>
        <p className="text-treasure-700 font-medium text-lg mb-2">
          Redirecting to Google Reviews...
        </p>
        <p className="text-gray-600 text-sm">
          Thank you for your feedback! Your review helps our driver earn a
          bonus.
        </p>
      </div>
    </div>
  );
}
