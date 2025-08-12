"use client";

import React, { useState } from "react";
import { authClient } from "../lib/auth-client";

export default function TestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testPasswordReset = async () => {
    if (!email) {
      alert("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log("🧪 Testing password reset for:", email);

      const response = await authClient.forgetPassword({
        email: email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      console.log("🧪 Password reset response:", response);
      setResult({
        success: !response?.error,
        data: response,
        error: response?.error?.message || null,
      });
    } catch (error) {
      console.error("🧪 Password reset error:", error);
      setResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Password Reset
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your email to test the password reset flow
              </p>
            </div>

            <button
              onClick={testPasswordReset}
              disabled={isLoading}
              className="w-full bg-[#D4AF3D] text-white py-2 px-4 rounded-md hover:bg-[#b8932f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Testing Password Reset..." : "Test Password Reset"}
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <div
                className={`p-4 rounded-md ${
                  result.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex">
                  <div
                    className={`flex-shrink-0 ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.success ? (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3
                      className={`text-sm font-medium ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.success ? "Success" : "Error"}
                    </h3>
                    <div
                      className={`mt-2 text-sm ${
                        result.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <p>
                        {result.error || "Password reset request processed"}
                      </p>
                      {result.details && (
                        <p className="mt-1 font-mono text-xs">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-sm font-medium text-gray-800">
                  Raw Response Data
                </h4>
                <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Debugging Instructions
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800">
                What This Test Does:
              </h3>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Calls authClient.forgetPassword() directly</li>
                <li>Shows the exact response from Better Auth</li>
                <li>Captures any network errors or exceptions</li>
                <li>Displays detailed debugging information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Check Console:</h3>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Open browser dev tools (F12)</li>
                <li>Look for logs starting with 🧪, 🔐, or ✅</li>
                <li>Check both frontend and backend console logs</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Expected Flow:</h3>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Frontend sends request to Better Auth</li>
                <li>Better Auth validates email exists</li>
                <li>sendResetPassword callback is triggered</li>
                <li>SES sends email with reset link</li>
                <li>Frontend shows success message</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






