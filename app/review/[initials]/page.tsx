"use client";

import { useEffect } from "react";

interface ReviewPageProps {
  params: {
    initials: string;
  };
}

// Component to handle the review redirect
export default function ReviewPage({ params }: ReviewPageProps) {
  useEffect(() => {
    async function handleRedirect() {
      try {
        const { initials } = await params;

        // Log the scan and get redirect URL from API
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

        const { redirectUrl } = await response.json();

        // Redirect to Google Reviews
        window.location.href = redirectUrl;
      } catch (error) {
        console.error("Error processing review redirect:", error);
        window.location.href = "/review/not-found";
      }
    }

    handleRedirect();
  }, [params]);

  // Show loading state while processing
  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-600 mx-auto mb-4"></div>
        <p className="text-treasure-700 font-medium">
          Redirecting to reviews...
        </p>
      </div>
    </div>
  );
}
