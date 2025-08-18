"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Clock, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";

interface Order {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  listing: {
    title: string;
    photos: any;
    itemId: string;
  };
  buyer: {
    name: string;
    email: string;
  };
}

// Component that handles the search params
function OrderThanksContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails(sessionId);
    }
  }, [sessionId]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      // Find order by session ID
      const response = await fetch(`/api/orders/search?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError("Failed to load order details");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-fit">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmation
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load order details"}
          </p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "PROCESSING":
        return <Package className="h-6 w-6 text-blue-500" />;
      case "SHIPPED":
        return <Package className="h-6 w-6 text-purple-500" />;
      case "DELIVERED":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Payment Confirmed";
      case "PROCESSING":
        return "Order Processing";
      case "SHIPPED":
        return "Order Shipped";
      case "DELIVERED":
        return "Order Delivered";
      default:
        return "Order Received";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="bg-green-100 rounded-full p-4 mx-auto w-fit mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You for Your Purchase!
          </h1>
          <p className="text-xl text-gray-600">
            Your order has been confirmed and is being processed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Order Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg text-[#D4AF3D]">
                    ${order.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-medium">
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Item Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item:</span>
                  <span className="font-medium text-right max-w-xs">
                    {order.listing.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium">{order.listing.itemId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer:</span>
                  <span className="font-medium">{order.buyer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.buyer.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Order Processing
                </h3>
                <p className="text-gray-600">
                  We're preparing your item for shipment. You'll receive updates
                  as your order progresses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-full p-2 mt-1">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Shipping & Delivery
                </h3>
                <p className="text-gray-600">
                  Once shipped, you'll receive tracking information. Delivery
                  typically takes 3-7 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  After Delivery
                </h3>
                <p className="text-gray-600">
                  You'll have 24 hours to inspect your item. After that, the
                  order will be finalized.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={() =>
              (window.location.href = `/list-item/${order.listing.itemId}`)
            }
            variant="outline"
            className="border-[#D4AF3D] text-[#D4AF3D] hover:bg-[#D4AF3D] hover:text-white mr-4"
          >
            View Item Details
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-2">Questions about your order?</p>
          <Button
            onClick={() => (window.location.href = "/contact")}
            variant="link"
            className="text-[#D4AF3D] hover:text-[#b8932f]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function OrderThanksLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your order details...</p>
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function OrderThanksPage() {
  return (
    <Suspense fallback={<OrderThanksLoading />}>
      <OrderThanksContent />
    </Suspense>
  );
}
