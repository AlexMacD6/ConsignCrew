"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RedeemPage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "form" | "success" | "error">(
    "code"
  );
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    paymentMethod: "venmo" as "venmo" | "cashapp" | "zelle",
    venmoUsername: "",
    cashAppUsername: "",
    zelleEmail: "",
    socialMediaPost: "",
  });

  const validateCode = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-character code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch("/api/treasure/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (data.valid) {
        setStep("form");
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to validate code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/treasure/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep("success");
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to submit redemption. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
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
              🎉 Congratulations! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Your treasure redemption has been submitted successfully!
            </p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-amber-800 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>
                • You'll receive $25 via {formData.paymentMethod} within 24
                hours
              </li>
              <li>• $25 TreasureHub credit will be added to your account</li>
              <li>• Early access invite will be sent to your email</li>
              {formData.socialMediaPost && (
                <li>• +$10 bonus for your social media post!</li>
              )}
            </ul>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Return to TreasureHub
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>

          <button
            onClick={() => setStep("code")}
            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image
                src="/TreasureHub - Logo.png"
                alt="TreasureHub"
                width={200}
                height={60}
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎉 Treasure Redemption 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Found a hidden treasure? Let's get you your rewards!
            </p>
          </div>

          {/* Code Entry Step */}
          {step === "code" && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔍</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Your Treasure Code
                </h2>
                <p className="text-gray-600">
                  Enter the 6-character code from your treasure envelope
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AB12CD"
                    maxLength={6}
                    className="w-full text-center text-2xl font-mono tracking-widest py-4 px-6 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-center text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={validateCode}
                  disabled={isValidating || code.length !== 6}
                  className="w-full bg-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isValidating ? "Validating..." : "Validate Code"}
                </button>
              </div>
            </div>
          )}

          {/* Form Step */}
          {step === "form" && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Claim Your Rewards
                </h2>
                <p className="text-gray-600">
                  Fill out the form below to receive your $25 cash + $25 credit
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: "venmo", label: "Venmo", icon: "💚" },
                      { value: "cashapp", label: "CashApp", icon: "💚" },
                      { value: "zelle", label: "Zelle", icon: "💙" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() =>
                          handleInputChange("paymentMethod", method.value)
                        }
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          formData.paymentMethod === method.value
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Username/Email */}
                {formData.paymentMethod === "venmo" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venmo Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venmoUsername}
                      onChange={(e) =>
                        handleInputChange("venmoUsername", e.target.value)
                      }
                      placeholder="@username"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {formData.paymentMethod === "cashapp" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CashApp Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cashAppUsername}
                      onChange={(e) =>
                        handleInputChange("cashAppUsername", e.target.value)
                      }
                      placeholder="$username"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {formData.paymentMethod === "zelle" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zelle Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.zelleEmail}
                      onChange={(e) =>
                        handleInputChange("zelleEmail", e.target.value)
                      }
                      placeholder="your@email.com"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Social Media Bonus */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-800 mb-2">
                    💰 Want an extra $10?
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Post your treasure find on Instagram and tag
                    @TreasureHubClub with #TreasureHubClub
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      Instagram Post URL
                    </label>
                    <input
                      type="url"
                      value={formData.socialMediaPost}
                      onChange={(e) =>
                        handleInputChange("socialMediaPost", e.target.value)
                      }
                      placeholder="https://www.instagram.com/p/..."
                      className="w-full py-3 px-4 border border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-center text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Claim My Rewards!"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
