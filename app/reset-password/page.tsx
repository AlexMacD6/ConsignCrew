"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "../lib/auth-client";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link."
      );
    }
  }, [token]);

  /**
   * Handle password reset form submission
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link."
      );
      setIsLoading(false);
      return;
    }

    try {
      // Use BetterAuth client for password reset
      const result = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (result?.error) {
        let errorMessage = result.error.message || "Failed to reset password.";

        if (result.error.status === 400) {
          if (errorMessage.toLowerCase().includes("token")) {
            errorMessage =
              "Invalid or expired reset token. Please request a new password reset link.";
          } else if (errorMessage.toLowerCase().includes("password")) {
            errorMessage =
              "Password does not meet requirements. Please use at least 8 characters.";
          }
        } else if (result.error.status === 404) {
          errorMessage =
            "Reset token not found. Please request a new password reset link.";
        } else if (result.error.status >= 500) {
          errorMessage = "Server error. Please try again in a few minutes.";
        }

        setError(errorMessage);
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?message=password-reset-success");
        }, 3000);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7]">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="mb-6">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600">
              Your password has been updated successfully. You will be
              redirected to the login page in a few seconds.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-block bg-[#D4AF3D] text-white px-6 py-2 rounded-lg hover:bg-[#b8932f] transition-colors font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Password Reset Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              disabled={isLoading}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              disabled={isLoading}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] disabled:opacity-50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#D4AF3D] hover:underline font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

















