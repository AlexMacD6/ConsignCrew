import Image from "next/image";
import Link from "next/link";

export default function ReviewNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-treasure-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-treasure-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Driver Not Found
        </h1>

        <p className="text-gray-600 mb-6">
          The QR code you scanned doesn't match any of our active delivery
          drivers. Please check with your driver or contact TreasureHub support.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <a
            href="https://g.page/r/CSDiB3DPr0hFEAI/review"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-treasure-500 hover:bg-treasure-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Leave a Review Anyway
          </a>

          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to TreasureHub
          </Link>
        </div>

        {/* Support */}
        <div className="mt-6">
          <Link
            href="/contact"
            className="text-treasure-600 hover:text-treasure-700 text-sm underline"
          >
            Contact Support
          </Link>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-treasure-50 rounded-lg">
          <p className="text-xs text-treasure-700">
            💡 <strong>Did you know?</strong> Your honest reviews help us
            recognize our exceptional drivers!
          </p>
        </div>
      </div>
    </div>
  );
}
