"use client";

import React, { useState } from "react";

export default function SESTestPage() {
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSESTest = async () => {
    if (!testEmail) {
      alert("Please enter a test email address");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test/ses-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
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
            AWS SES Test
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your email to receive a test email and verify SES is
                working
              </p>
            </div>

            <button
              onClick={runSESTest}
              disabled={isLoading}
              className="w-full bg-[#D4AF3D] text-white py-2 px-4 rounded-md hover:bg-[#b8932f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Testing SES..." : "Run SES Test"}
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
                      <p>{result.message || result.error}</p>
                      {result.details && (
                        <p className="mt-1 font-mono text-xs">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {result.diagnosis && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800">
                    Diagnosis
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    {result.diagnosis.message}
                  </p>
                  <p className="mt-2 text-sm text-blue-600">
                    <strong>Solution:</strong> {result.diagnosis.solution}
                  </p>
                </div>
              )}

              {result.data && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-800">Details</h4>
                  <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              {result.missingVars && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Missing Environment Variables
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {result.missingVars.map((envVar: string) => (
                      <li key={envVar}>{envVar}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AWS SES Setup Guide
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800">
                Required Environment Variables:
              </h3>
              <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-xs">
                <li>AWS_ACCESS_KEY_ID</li>
                <li>AWS_SECRET_ACCESS_KEY</li>
                <li>AWS_REGION (e.g., us-east-1)</li>
                <li>
                  AWS_SES_DEFAULT_FROM_EMAIL (e.g., no-reply@treasurehub.club)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Common Issues:</h3>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  <strong>Sandbox Mode:</strong> AWS SES starts in sandbox mode
                  - only verified emails can receive messages
                </li>
                <li>
                  <strong>Email Verification:</strong> Both sender and recipient
                  emails must be verified in SES console
                </li>
                <li>
                  <strong>Permissions:</strong> IAM user needs{" "}
                  <code>ses:SendEmail</code> and <code>ses:SendRawEmail</code>{" "}
                  permissions
                </li>
                <li>
                  <strong>Domain Verification:</strong> For production, verify
                  your domain in AWS SES
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Next Steps:</h3>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Run the test above to diagnose the issue</li>
                <li>Check AWS SES console for account status</li>
                <li>Verify your from email address in SES</li>
                <li>Request production access if still in sandbox</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}














