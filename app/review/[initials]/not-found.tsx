import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* TreasureHub Logo */}
        <div className="mb-6">
          <Image
            src="/TreasureHub - Logo.png"
            alt="TreasureHub"
            width={120}
            height={40}
            className="mx-auto"
            priority
          />
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Driver Not Found
          </h1>
          <p className="text-gray-600 leading-relaxed">
            The QR code you scanned doesn't match any of our active delivery
            drivers. Please check with your driver or contact TreasureHub
            support.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href="https://g.page/r/TreasureHub/review"
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

          <Link
            href="/contact"
            className="block text-treasure-600 hover:text-treasure-700 text-sm underline"
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
