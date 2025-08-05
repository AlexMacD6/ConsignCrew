"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

/**
 * Facebook Shop CSV Export Page
 *
 * Provides a clean URL (treasurehub.club/fbshop.csv) that redirects to the CSV export endpoint.
 * This page handles authentication and admin checks before allowing access to the CSV download.
 */
export default function FacebookShopCSVPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use client-side session hook
  const { data: session } = authClient.useSession();

  useEffect(() => {
    async function checkAuthAndAccess() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!session?.user) {
          setError(
            "Authentication required. Please log in to access this feature."
          );
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user is admin by calling our admin check API
        const adminCheckResponse = await fetch("/api/admin/check-status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!adminCheckResponse.ok) {
          setError(
            "Access denied. Admin privileges required to export Facebook Shop data."
          );
          setIsLoading(false);
          return;
        }

        const adminData = await adminCheckResponse.json();

        if (!adminData.isAdmin) {
          setError(
            "Access denied. Admin privileges required to export Facebook Shop data."
          );
          setIsLoading(false);
          return;
        }

        setIsAdmin(true);

        // If we get here, user is authenticated and is an admin
        // Redirect to the actual CSV export endpoint
        window.location.href = "/api/facebook-shop/export";
      } catch (error) {
        console.error("Error checking authentication and admin status:", error);
        setError(
          "An error occurred while checking access permissions. Please try again."
        );
        setIsLoading(false);
      }
    }

    checkAuthAndAccess();
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Checking Access Permissions
          </h2>
          <p className="text-gray-600">
            Verifying authentication and admin privileges...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              {!isAuthenticated && (
                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#D4AF3D] text-white py-2 px-4 rounded-md hover:bg-[#B8941F] transition-colors"
                >
                  Log In
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Preparing Facebook Shop Export
        </h2>
        <p className="text-gray-600">
          Generating CSV file for Facebook Shop upload...
        </p>
      </div>
    </div>
  );
}
