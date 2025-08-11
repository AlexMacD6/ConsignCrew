"use client";

import React, { useState } from "react";

export default function PebblelyTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runPebblelyTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test/pebblely-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
            Pebblely API Test
          </h1>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This test will verify your Pebblely API integration by checking
              credits, themes, and generating a sample background using their
              sample image.
            </p>

            <button
              onClick={runPebblelyTest}
              disabled={isLoading}
              className="w-full bg-[#D4AF3D] text-white py-2 px-4 rounded-md hover:bg-[#b8932f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Testing Pebblely API..." : "Run Pebblely Test"}
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
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="font-medium">Credits Available:</span>
                      <span>{result.data.creditsAvailable}</span>

                      <span className="font-medium">Credits Used:</span>
                      <span>{result.data.creditsUsed || 0}</span>

                      <span className="font-medium">Credits Remaining:</span>
                      <span>{result.data.creditsRemaining}</span>

                      <span className="font-medium">Themes Available:</span>
                      <span>{result.data.themesAvailable}</span>
                    </div>

                    {result.data.sampleThemes && (
                      <div>
                        <span className="text-xs font-medium">
                          Sample Themes:
                        </span>
                        <div className="text-xs text-gray-600 mt-1">
                          {result.data.sampleThemes.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pebblely Setup Guide
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800">
                Required Environment Variable:
              </h3>
              <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-xs">
                <li>PEBBLELY_API_KEY</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">
                Implementation Comparison:
              </h3>
              <div className="mt-2 space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-xs">
                    Python Sample (Direct):
                  </h4>
                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                    {`# Direct background creation
response = requests.post(api_url + endpoint, {
  "images": [base64_image],
  "theme": "Surprise me"
})`}
                  </pre>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-medium text-xs">Our Implementation:</h4>
                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                    {`// Two options:
// 1. Direct (like Python)
await client.createBackgroundDirect({
  imageUrl: "...",
  theme: "Surprise me"
});

// 2. Full workflow (remove + create)
await client.generateStagedPhoto({
  imageUrl: "...",
  skipBackgroundRemoval: false
});`}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Getting Started:</h3>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>
                  Sign up at{" "}
                  <a
                    href="https://pebblely.com/docs/"
                    className="text-blue-600 hover:underline"
                  >
                    pebblely.com
                  </a>
                </li>
                <li>Get your API key (20 free credits included)</li>
                <li>Add PEBBLELY_API_KEY to your .env file</li>
                <li>Run this test to verify the integration</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Credit Usage:</h3>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  <strong>Background Creation:</strong> 1 credit
                </li>
                <li>
                  <strong>Background Removal:</strong> 1 credit
                </li>
                <li>
                  <strong>Full Workflow:</strong> 2 credits (removal + creation)
                </li>
                <li>
                  <strong>Upscaling:</strong> 1 credit
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


