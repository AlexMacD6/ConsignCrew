import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface ConfirmationPageProps {
  params: {
    initials: string;
  };
  searchParams: {
    reviewId?: string;
  };
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { initials } = await params;
  const { reviewId } = await searchParams;

  try {
    // Find the driver
    const driver = await prisma.driver.findUnique({
      where: {
        initials: initials.toUpperCase(),
      },
    });

    if (!driver || !driver.isActive) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-treasure-50 via-white to-treasure-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center">
              <Image
                src="/TreasureHub - Logo.png"
                alt="TreasureHub"
                width={200}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-treasure-400 to-treasure-500 px-8 py-6 text-center">
              <div className="text-white">
                <div className="text-6xl mb-2">🎉</div>
                <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
                <p className="text-treasure-100">
                  Your review means the world to {driver.fullName}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  How Our Review-to-Tip System Works
                </h2>
                <div className="bg-treasure-50 rounded-lg p-6 text-left">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-treasure-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        1
                      </div>
                      <p className="text-gray-700">
                        <strong>QR Code Scanned:</strong> We've logged that you
                        scanned {driver.initials}'s QR code
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-treasure-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        2
                      </div>
                      <p className="text-gray-700">
                        <strong>Leave Your Review:</strong> Share your
                        experience on Google Reviews
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-treasure-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        3
                      </div>
                      <p className="text-gray-700">
                        <strong>Driver Recognition:</strong> Exceptional reviews
                        help us recognize outstanding service
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">🚚</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Your Driver: {driver.fullName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Driver Code: {driver.initials}
                  </p>
                </div>
              </div>

              {/* Review Message */}
              <div className="text-center mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="text-yellow-600 mb-2">
                    <svg
                      className="w-8 h-8 mx-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-yellow-800 font-medium">
                    "If you feel that we have exceeded your expectations, we
                    don't take tips. That's part of the concierge delivery
                    service.
                  </p>
                  <p className="text-yellow-800 font-medium mt-2">
                    If you'd like to share your experience, your honest feedback
                    on Google Reviews helps us continue to provide exceptional
                    service."
                  </p>
                  <p className="text-yellow-700 text-sm mt-3">
                    - {driver.fullName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <a
                  href={
                    driver.googleReviewsUrl ||
                    "https://g.page/r/TreasureHub/review"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-treasure-500 hover:bg-treasure-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center text-lg"
                >
                  ⭐ Leave a Google Review
                </a>

                <Link
                  href="/"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  Continue to TreasureHub
                </Link>
              </div>

              {/* Footer Note */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  Your honest feedback helps us maintain our high standards and
                  recognize exceptional service.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-gray-600 text-sm">
              © 2024 TreasureHub. Exceptional concierge delivery service.
            </p>
            <div className="mt-2 space-x-4 text-xs">
              <Link
                href="/policies/privacy"
                className="text-treasure-600 hover:text-treasure-700"
              >
                Privacy Policy
              </Link>
              <Link
                href="/policies/terms"
                className="text-treasure-600 hover:text-treasure-700"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-treasure-600 hover:text-treasure-700"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading confirmation page:", error);
    notFound();
  } finally {
    await prisma.$disconnect();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ConfirmationPageProps) {
  const { initials } = await params;

  try {
    const driver = await prisma.driver.findUnique({
      where: {
        initials: initials.toUpperCase(),
      },
    });

    if (!driver || !driver.isActive) {
      return {
        title: "Review Confirmation - TreasureHub",
        description:
          "Thank you for considering a review for TreasureHub delivery service.",
      };
    }

    return {
      title: `Thank You - Driver ${driver.initials} | TreasureHub Reviews`,
      description: `Thank you for scanning ${driver.fullName}'s QR code. Leave a 5-star Google review to help them earn a bonus!`,
      robots: "noindex, nofollow",
    };
  } catch (error) {
    return {
      title: "Review Confirmation - TreasureHub",
      description: "Thank you for your interest in reviewing TreasureHub.",
    };
  } finally {
    await prisma.$disconnect();
  }
}
