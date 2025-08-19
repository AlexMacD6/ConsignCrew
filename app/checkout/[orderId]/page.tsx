"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckoutTimer } from "@/components/CheckoutTimer";
import { authClient } from "@/lib/auth-client";
import {
  Loader2,
  ShoppingCart,
  Clock,
  CreditCard,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface Order {
  id: string;
  listingId: string;
  amount: number;
  checkoutExpiresAt: string;
  stripeCheckoutSessionId: string;
  listing: {
    itemId: string;
    title: string;
    photos?: { hero?: string };
  };
}

/**
 * Custom checkout page that shows the 10-minute timer before redirecting to Stripe
 * URL: /checkout/[orderId]
 */
export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.orderId || !session?.user) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        console.log("Checkout Page: Fetching order:", params.orderId);
        const response = await fetch(
          `/api/orders/${params.orderId}?checkout=true`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Checkout Page: Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Checkout Page: API error:", errorText);
          throw new Error("Order not found");
        }

        const data = await response.json();
        console.log("Checkout Page: API response:", data);

        if (data.success) {
          console.log("Checkout Page: Order loaded successfully:", data.order);
          setOrder(data.order);
        } else {
          console.error("Checkout Page: API returned error:", data.error);
          throw new Error(data.error || "Failed to fetch order");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId, session?.user]);

  // Handle continue to payment
  const handleContinueToPayment = async () => {
    if (!order) return;

    setRedirecting(true);

    try {
      console.log("Checkout Page: Getting Stripe URL for order:", order.id);
      // Get the Stripe checkout URL
      const response = await fetch(`/api/checkout/stripe-url/${order.id}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "Checkout Page: Stripe URL response status:",
        response.status
      );
      const data = await response.json();
      console.log("Checkout Page: Stripe URL response:", data);

      if (data.success && data.checkoutUrl) {
        console.log("Checkout Page: Redirecting to Stripe:", data.checkoutUrl);
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Checkout Page: Failed to get Stripe URL:", data.error);
        throw new Error(data.error || "Failed to get checkout URL");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to continue to payment"
      );
      setRedirecting(false);
    }
  };

  // Handle timer expiration
  const handleTimerExpired = () => {
    setError("Your checkout session has expired. Please try again.");
    setTimeout(() => {
      router.push(`/list-item/${order?.listing.itemId}`);
    }, 3000);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/list-item/${order?.listing.itemId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF3D]" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <h2 className="font-semibold mb-2">Checkout Error</h2>
            <p>{error || "Order not found"}</p>
          </div>
          <Button className="mt-4" onClick={() => router.push("/listings")}>
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600">
            Your item is reserved. Complete payment within the time limit.
          </p>
        </div>

        {/* Checkout Timer */}
        <CheckoutTimer
          expiresAt={order.checkoutExpiresAt}
          onExpired={handleTimerExpired}
          className="mb-8"
        />

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Summary
          </h2>

          <div className="flex gap-4">
            {/* Item Image */}
            {order.listing.photos?.hero && (
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={order.listing.photos.hero}
                  alt={order.listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Item Details */}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                {order.listing.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Item ID: {order.listing.itemId}
              </p>
              <p className="text-lg font-semibold text-[#D4AF3D]">
                ${order.amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800">
              <p className="font-medium mb-1">Secure Checkout Process</p>
              <p className="text-sm">
                This item is temporarily reserved for you. You'll be redirected
                to our secure payment processor (Stripe) to complete your
                purchase safely.
              </p>
            </div>
          </div>
        </div>

        {/* Timer Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-amber-800">
              <p className="font-medium mb-1">Time-Limited Reservation</p>
              <p className="text-sm">
                Your reservation will expire when the timer reaches zero. After
                that, this item will be available to other buyers again.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
            disabled={redirecting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleContinueToPayment}
            className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            disabled={redirecting}
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Redirecting...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Continue to Payment
              </>
            )}
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by Stripe for secure payment processing
        </p>
      </div>
    </div>
  );
}
