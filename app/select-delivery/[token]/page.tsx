"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  RefreshCw,
} from "lucide-react";

interface TimeSlot {
  date: string;
  dateLabel: string;
  windowId: string;
  windowLabel: string;
  startTime: string;
  endTime: string;
}

interface OrderDetails {
  id: string;
  itemTitle: string;
  itemId: string;
  customerName: string;
  customerEmail: string;
  timeSlots: TimeSlot[];
  version?: number;
  expiresAt?: string;
  confirmedSlot?: TimeSlot; // Add confirmed slot info
}

export default function DeliverySchedulePage() {
  const params = useParams();
  const deliveryToken = params.token as string;

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    if (deliveryToken) {
      fetchOrderDetails();
    }
  }, [deliveryToken]);

  // Check if there's already a confirmed slot and set it as selected
  useEffect(() => {
    if (orderDetails?.confirmedSlot) {
      setSelectedSlot(orderDetails.confirmedSlot);
      setSubmitted(true); // Show confirmation screen
    }
  }, [orderDetails]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/select-delivery/${deliveryToken}`);
      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.order);
      } else {
        setError(data.error || "Failed to load order details");
        setErrorDetails(data.details || null);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelection = async () => {
    if (!selectedSlot || !orderDetails) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/select-delivery/${deliveryToken}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedSlot: selectedSlot,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to select delivery time");
      }
    } catch (error) {
      console.error("Error selecting delivery time:", error);
      setError("Failed to select delivery time");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your delivery options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Special handling for superseded/expired links
    if (errorDetails?.reason === "SUPERSEDED") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <RefreshCw className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Link Superseded
            </h1>
            <p className="text-gray-600 mb-4">
              Hi {errorDetails.customerName}, this delivery selection link has
              been replaced with a newer one.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>📧 Check your email</strong> for the most recent
                delivery time selection link for:
              </p>
              <p className="font-semibold text-orange-900 mt-2">
                {errorDetails.itemTitle}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              If you can't find the newer email, please contact us at{" "}
              <a
                href="tel:+17138993656"
                className="text-[#D4AF3D] hover:text-[#b8932f]"
              >
                (713) 899-3656
              </a>
            </p>
          </div>
        </div>
      );
    }

    if (errorDetails?.reason === "EXPIRED") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#fffbe6] via-[#f7f7f7] to-[#f7f7f7] flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Link Expired
            </h1>
            <p className="text-gray-600 mb-4">
              Hi {errorDetails.customerName}, this delivery selection link has
              expired.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                The delivery selection for{" "}
                <strong>{errorDetails.itemTitle}</strong> is no longer available
                through this link.
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Please contact us to reschedule your delivery:
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

    // Generic error
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
            Delivery Time Confirmed!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for selecting your delivery time. We'll deliver your item
            during:
          </p>
          <div className="bg-[#fffbe6] border border-[#D4AF3D] rounded-lg p-4 mb-6">
            <p className="font-semibold text-[#825e08]">
              {selectedSlot?.dateLabel}
            </p>
            <p className="text-[#825e08]">{selectedSlot?.windowLabel}</p>
          </div>
          <p className="text-sm text-gray-500">
            You'll receive a confirmation email shortly with your delivery
            details.
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
            We couldn't find the order details for this delivery schedule.
          </p>
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
              Choose Your Delivery Time
            </h1>
            <p className="text-gray-600">
              We're ready to deliver your treasure!
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-[#D4AF3D] mr-2" />
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
                <strong>Customer:</strong> {orderDetails.customerName}
              </p>
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-[#D4AF3D] mr-2" />
              Available Delivery Windows
            </h2>
            <p className="text-gray-600 mb-6">
              Please select your preferred delivery time from the options below:
            </p>

            <div className="space-y-4">
              {orderDetails.timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSlot === slot
                      ? "border-[#D4AF3D] bg-[#fffbe6]"
                      : "border-gray-200 hover:border-[#D4AF3D] hover:bg-[#fffbe6]"
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {slot.dateLabel}
                      </p>
                      <p className="text-gray-600">{slot.windowLabel}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedSlot === slot
                          ? "bg-[#D4AF3D] border-[#D4AF3D]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedSlot === slot && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Please respond within 24 hours to
                secure your preferred time slot. Delivery windows are limited
                and assigned on a first-come, first-served basis.
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleSlotSelection}
              disabled={!selectedSlot || submitting}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                !selectedSlot || submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#D4AF3D] hover:bg-[#b8932f]"
              }`}
            >
              {submitting ? "Confirming..." : "Confirm Delivery Time"}
            </button>
          </div>

          {/* Need Help */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Phone className="h-5 w-5 text-[#D4AF3D] mr-2" />
              Need Help?
            </h3>
            <p className="text-gray-600 mb-2">
              If you have any questions or need to discuss alternative
              arrangements, please don't hesitate to contact us:
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
