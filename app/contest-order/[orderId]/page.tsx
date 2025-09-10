"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  ArrowLeft,
} from "lucide-react";

interface OrderDetails {
  id: string;
  itemTitle: string;
  itemId: string;
  customerName: string;
  customerEmail: string;
  deliveredAt: string;
  contestPeriodExpiresAt: string;
  status: string;
  deliveryPhotos?: string[];
}

const DISPUTE_REASONS = [
  {
    id: "damaged",
    label: "Item was damaged during delivery",
    description: "The item arrived with visible damage or defects",
  },
  {
    id: "missing_parts",
    label: "Missing parts or accessories",
    description: "Some components or accessories are missing from the order",
  },
  {
    id: "wrong_item",
    label: "Wrong item delivered",
    description: "The delivered item doesn't match what was ordered",
  },
  {
    id: "not_as_described",
    label: "Item not as described",
    description: "The item significantly differs from the listing description",
  },
  {
    id: "delivery_issues",
    label: "Delivery problems",
    description: "Issues with the delivery process or location",
  },
  {
    id: "other",
    label: "Other issue",
    description: "A different problem not listed above",
  },
];

export default function ContestOrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contactMethod, setContactMethod] = useState<string>("email");

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/contest-order/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.order);
      } else {
        setError(data.error || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!selectedReason || !description.trim()) {
      alert("Please select a reason and provide a description");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/contest-order/${orderId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: selectedReason,
          description: description.trim(),
          contactMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit dispute");
      }
    } catch (error) {
      console.error("Error submitting dispute:", error);
      setError("Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = orderDetails?.contestPeriodExpiresAt
    ? new Date() > new Date(orderDetails.contestPeriodExpiresAt)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrderDetails}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Dispute Submitted
          </h1>
          <p className="text-gray-600 mb-4">
            Your dispute has been submitted successfully. Our team will review
            your case and contact you within 24 hours.
          </p>
          <div className="bg-[#fffbe6] border border-[#D4AF3D] rounded-lg p-4 mb-6">
            <p className="font-semibold text-[#825e08]">
              Order #{orderDetails?.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-[#825e08]">
              Dispute:{" "}
              {DISPUTE_REASONS.find((r) => r.id === selectedReason)?.label}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            You'll receive updates via email about the resolution of your
            dispute.
          </p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h1>
          <p className="text-gray-600">
            We couldn't find the order details for this contest request.
          </p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Contest Period Expired
          </h1>
          <p className="text-gray-600 mb-4">
            The 24-hour contest period for this order has expired. The order has
            been automatically finalized.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              <strong>Order #{orderDetails.id.slice(-8).toUpperCase()}</strong>
              <br />
              Contest period ended:{" "}
              {new Date(orderDetails.contestPeriodExpiresAt).toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            If you still have concerns, please contact our support team:
          </p>
          <a
            href="tel:+17138993656"
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            Call (713) 899-3656
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="/TreasureHub Banner Logo.png"
              alt="TreasureHub"
              className="h-16 mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.src = "/TreasureHub - Logo.png";
              }}
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Report an Issue
            </h1>
            <p className="text-gray-600">
              Let us know if there's a problem with your delivered order
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 text-[#D4AF3D] mr-2" />
              Order Details
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Order #:</strong>{" "}
                {orderDetails.id.slice(-8).toUpperCase()}
              </p>
              <p>
                <strong>Item:</strong> {orderDetails.itemTitle}
              </p>
              <p>
                <strong>Item ID:</strong> {orderDetails.itemId}
              </p>
              <p>
                <strong>Delivered:</strong>{" "}
                {new Date(orderDetails.deliveredAt).toLocaleString()}
              </p>
              <p>
                <strong>Contest Period Expires:</strong>{" "}
                <span className="text-orange-600 font-semibold">
                  {new Date(
                    orderDetails.contestPeriodExpiresAt
                  ).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {/* Contest Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              What's the Issue?
            </h2>

            {/* Reason Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select the reason for your dispute:
              </label>
              <div className="space-y-3">
                {DISPUTE_REASONS.map((reason) => (
                  <div
                    key={reason.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedReason === reason.id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {reason.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reason.description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedReason === reason.id
                            ? "bg-red-500 border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedReason === reason.id && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the issue in detail:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide specific details about the problem..."
                className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Contact Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred contact method:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={contactMethod === "email"}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="phone"
                    checked={contactMethod === "phone"}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="mr-2"
                  />
                  Phone
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleSubmitDispute}
                disabled={!selectedReason || !description.trim() || submitting}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                  !selectedReason || !description.trim() || submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Phone className="h-5 w-5 text-[#D4AF3D] mr-2" />
              Need Help?
            </h3>
            <p className="text-gray-600 mb-2">
              If you have questions about the dispute process or need immediate
              assistance:
            </p>
            <p className="text-gray-900">
              <strong>Phone:</strong>{" "}
              <a
                href="tel:+17138993656"
                className="text-[#D4AF3D] hover:text-[#b8932f] transition-colors"
              >
                (713) 899-3656
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
