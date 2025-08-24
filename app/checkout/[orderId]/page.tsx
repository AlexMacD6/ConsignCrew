"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckoutTimer } from "@/components/CheckoutTimer";
import CheckoutAddressModal from "@/components/CheckoutAddressModal";
import { authClient } from "@/lib/auth-client";
import {
  Loader2,
  ShoppingCart,
  Clock,
  CreditCard,
  AlertTriangle,
  Shield,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface Order {
  id: string;
  listingId: string;
  amount: number;
  checkoutExpiresAt: string;
  stripeCheckoutSessionId: string;
  createdAt: string;
  listing: {
    itemId: string;
    title: string;
    photos?: { hero?: string };
  };
}

interface User {
  zipCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoStatus, setPromoStatus] = useState<null | {
    valid: boolean;
    discount: number;
  }>(null);
  const [deliveryCategory, setDeliveryCategory] = useState<"NORMAL" | "BULK">(
    "NORMAL"
  );

  // Harris County, TX sales tax rate (8.25%)
  const HARRIS_COUNTY_TAX_RATE = 0.0825;
  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

  // Debug: Log error state changes
  useEffect(() => {
    if (error) {
      console.log("Checkout Page: Error state set:", error);
    }
  }, [error]);
  const [zipCodeValid, setZipCodeValid] = useState<boolean | null>(null);
  const [validatingZip, setValidatingZip] = useState(false);
  const [showZipCodeModal, setShowZipCodeModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [timeExtensionUsed, setTimeExtensionUsed] = useState(false);
  const [extendingTime, setExtendingTime] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Fetch order details and user profile
  useEffect(() => {
    const fetchData = async () => {
      // If session is still undefined, it's still loading
      if (session === undefined) {
        console.log("Checkout Page: Session still undefined, waiting...");
        return; // Still loading, don't do anything yet
      }

      // If session is null, user is not authenticated
      if (session === null) {
        // Only set error if we're not still loading and we've waited a bit
        if (!loading) {
          console.log(
            "Checkout Page: Session is null, setting authentication error"
          );
          setError("Authentication required");
          setLoading(false);
        }
        return;
      }

      // Session is available, clear any authentication errors
      if (error === "Authentication required") {
        console.log(
          "Checkout Page: Session available, clearing authentication error"
        );
        setError(null);
      }

      if (!params.orderId || !session?.user) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        // Fetch order details
        console.log("Checkout Page: Fetching order:", params.orderId);
        const orderResponse = await fetch(
          `/api/orders/${params.orderId}?checkout=true`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Checkout Page: Order response status:",
          orderResponse.status
        );

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          console.error("Checkout Page: Order API error:", errorText);

          // Handle specific error cases
          if (orderResponse.status === 410) {
            // Checkout session expired - handle gracefully
            console.log(
              "Checkout Page: Detected expired checkout session, handling cleanup"
            );
            await handleExpiredCheckout();
            return; // Don't throw error, let the cleanup function handle it
          } else if (orderResponse.status === 404) {
            throw new Error("Order not found");
          } else {
            throw new Error(`Failed to load order (${orderResponse.status})`);
          }
        }

        const orderData = await orderResponse.json();
        console.log("Checkout Page: Order API response:", orderData);

        if (orderData.success) {
          console.log(
            "Checkout Page: Order loaded successfully:",
            orderData.order
          );
          console.log("Checkout Page: Order structure:", {
            id: orderData.order.id,
            listingId: orderData.order.listingId,
            buyerId: orderData.order.buyerId,
            stripeCheckoutSessionId: orderData.order.stripeCheckoutSessionId,
            checkoutExpiresAt: orderData.order.checkoutExpiresAt,
          });
          setOrder(orderData.order);

          // Check if time extension has already been used
          // Compare the expiration time with what it should be (10 min from creation)
          const orderCreatedAt = new Date(orderData.order.createdAt);
          const expectedExpirationWithoutExtension = new Date(
            orderCreatedAt.getTime() + 10 * 60 * 1000
          ); // 10 minutes
          const actualExpiration = new Date(orderData.order.checkoutExpiresAt);

          // If actual expiration is more than 10 minutes from creation, extension was used
          const extensionUsed =
            actualExpiration.getTime() >
            expectedExpirationWithoutExtension.getTime();

          console.log("Checkout Page: Extension check:", {
            orderCreatedAt: orderCreatedAt.toISOString(),
            expectedExpiration:
              expectedExpirationWithoutExtension.toISOString(),
            actualExpiration: actualExpiration.toISOString(),
            extensionUsed,
          });

          setTimeExtensionUsed(extensionUsed);
        } else {
          console.error(
            "Checkout Page: Order API returned error:",
            orderData.error
          );
          throw new Error(orderData.error || "Failed to fetch order");
        }

        // Fetch user profile for zip code validation
        const userResponse = await fetch("/api/profile", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("Checkout Page: User API response:", userData);
          if (userData.success) {
            console.log("Checkout Page: User profile loaded:", userData.user);
            setUser(userData.user);

            // Automatically validate zip code if user has one
            if (userData.user.zipCode) {
              const isValid = await validateZipCode(userData.user.zipCode);
              setZipCodeValid(isValid);
            }
          }
        } else {
          console.error("Checkout Page: User API failed:", userResponse.status);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
        setSuccess(null); // Clear any success messages
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.orderId, session?.user, session]);

  // Debug: Log user state changes
  useEffect(() => {
    console.log("Checkout Page: User state changed:", user);
  }, [user]);

  // Clear authentication errors when session becomes available
  useEffect(() => {
    if (session && error === "Authentication required") {
      console.log(
        "Checkout Page: Session available, clearing authentication error"
      );
      setError(null);
    }
  }, [session, error]);

  // Periodic check for expired sessions
  useEffect(() => {
    if (!order) return;

    const checkExpiredSession = async () => {
      const now = new Date();
      const orderExpiry = new Date(order.checkoutExpiresAt);
      const isExpired = now > orderExpiry;

      if (isExpired) {
        console.log("Checkout Page: Periodic check detected expired session");
        await handleTimerExpired();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkExpiredSession, 30000);

    // Also check immediately
    checkExpiredSession();

    // Cleanup function to handle expired sessions when user leaves the page
    const handleBeforeUnload = async () => {
      const now = new Date();
      const orderExpiry = new Date(order.checkoutExpiresAt);
      const isExpired = now > orderExpiry;

      if (isExpired) {
        console.log(
          "Checkout Page: User leaving page with expired session, cleaning up"
        );
        // Use sendBeacon for reliable cleanup when page is unloading
        const data = JSON.stringify({ orderId: order.id });
        navigator.sendBeacon("/api/checkout/cleanup-expired", data);
      }
    };

    // Add beforeunload event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [order]);

  // Validate zip code for buying
  const validateZipCode = async (zipCode: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/zipcodes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zipCode }),
      });

      const data = await response.json();
      return data.success && data.isValid;
    } catch (error) {
      console.error("Error validating zip code:", error);
      return false;
    }
  };

  // Handle continue to payment
  const handleContinueToPayment = async () => {
    if (!order || !user) return;

    // Check if user has complete address information
    if (!user.zipCode || !user.addressLine1) {
      setShowZipCodeModal(true);
      return;
    }

    // If zip code hasn't been validated yet, validate it now
    if (zipCodeValid === null) {
      setValidatingZip(true);
      const isValid = await validateZipCode(user.zipCode);
      setValidatingZip(false);
      setZipCodeValid(isValid);

      if (!isValid) {
        setShowZipCodeModal(true);
        return;
      }
    }

    // If zip code is invalid, show modal
    if (zipCodeValid === false) {
      setShowZipCodeModal(true);
      return;
    }

    // Zip code is valid, proceed to payment
    setRedirecting(true);

    try {
      console.log("Checkout Page: Processing payment for order:", order.id);

      // Check if we need to create a fresh checkout session
      const now = new Date();
      const orderExpiry = new Date(order.checkoutExpiresAt);
      const isExpired = now > orderExpiry;

      if (isExpired) {
        console.log(
          "Checkout Page: Order expired, creating fresh checkout session"
        );
        // Create a new checkout session for expired orders
        const response = await fetch("/api/checkout/refresh-session", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to refresh checkout session"
          );
        }

        const data = await response.json();
        if (data.success && data.checkoutUrl) {
          console.log(
            "Checkout Page: Redirecting to fresh Stripe session:",
            data.checkoutUrl
          );
          window.location.href = data.checkoutUrl;
          return;
        } else {
          throw new Error("Failed to create fresh checkout session");
        }
      } else {
        // Use existing session if still valid
        console.log("Checkout Page: Using existing Stripe session");
        const response = await fetch(`/api/checkout/stripe-url/${order.id}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to get checkout URL`
          );
        }

        const data = await response.json();
        console.log("Checkout Page: Stripe URL response:", data);

        if (data.success && data.checkoutUrl) {
          console.log(
            "Checkout Page: Redirecting to Stripe:",
            data.checkoutUrl
          );
          window.location.href = data.checkoutUrl;
        } else {
          console.error("Checkout Page: Failed to get Stripe URL:", data.error);
          throw new Error(data.error || "Failed to get checkout URL");
        }
      }
    } catch (err) {
      console.error("Checkout Page: Error in handleContinueToPayment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to continue to payment"
      );
      setSuccess(null); // Clear any success messages
      setRedirecting(false);
    }
  };

  // Handle expired checkout session from API
  const handleExpiredCheckout = async () => {
    if (!params.orderId) return;

    try {
      console.log("Checkout Page: Handling expired checkout session from API");

      // Cleanup the expired session
      const response = await fetch("/api/checkout/cleanup-expired", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: params.orderId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          "Checkout Page: Expired session cleaned up from API:",
          data
        );

        // Show success message and redirect back to listings
        setSuccess(
          "Checkout session expired. The item has been released and is available for purchase again."
        );

        // Redirect back to listings after a short delay
        setTimeout(() => {
          router.push("/listings");
        }, 3000);
      } else {
        console.error(
          "Checkout Page: Failed to cleanup expired session from API"
        );
        // Still redirect even if cleanup fails
        setTimeout(() => {
          router.push("/listings");
        }, 2000);
      }
    } catch (error) {
      console.error(
        "Checkout Page: Error cleaning up expired session from API:",
        error
      );
      // Still redirect even if cleanup fails
      setTimeout(() => {
        router.push("/listings");
      }, 2000);
    }
  };

  // Handle timer expiration
  const handleTimerExpired = async () => {
    if (!order) return;

    console.log("Checkout Page: Timer expired for order:", order.id);

    try {
      // Automatically cleanup the expired session
      console.log("Checkout Page: Automatically cleaning up expired session");

      const response = await fetch("/api/checkout/cleanup-expired", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Checkout Page: Expired session cleaned up:", data);

        // Show success message and redirect back to listing
        setSuccess(
          "Checkout session expired. The item has been released and is available for purchase again."
        );

        // Redirect back to the listing page after a short delay
        setTimeout(() => {
          router.push(`/list-item/${order.listing.itemId}`);
        }, 3000);
      } else {
        console.error("Checkout Page: Failed to cleanup expired session");
        setError("Your checkout session has expired. Please try again.");
        setTimeout(() => {
          router.push(`/list-item/${order.listing.itemId}`);
        }, 3000);
      }
    } catch (error) {
      console.error("Checkout Page: Error cleaning up expired session:", error);
      setError("Your checkout session has expired. Please try again.");
      setTimeout(() => {
        router.push(`/list-item/${order.listing.itemId}`);
      }, 3000);
    }
  };

  // Handle address change from modal
  const handleAddressChange = async (addressData: any) => {
    // Update the user state with the new address for this checkout session
    setUser((prev) =>
      prev
        ? {
            ...prev,
            addressLine1: addressData.streetAddress,
            addressLine2: addressData.apartment,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.postalCode,
          }
        : null
    );

    // Reset validation and confirmation state
    setZipCodeValid(null);
    setAddressConfirmed(false);

    // Validate the new zip code
    if (addressData.postalCode) {
      setValidatingZip(true);
      const isValid = await validateZipCode(addressData.postalCode);
      setZipCodeValid(isValid);
      setValidatingZip(false);
    }
  };

  // Handle address confirmation
  const handleAddressConfirmation = async () => {
    if (!order || !user) return;

    try {
      // Prepare shipping address data
      const shippingAddressData = {
        streetAddress: user.addressLine1,
        apartment: user.addressLine2 || "",
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country || "US",
      };

      // Update the order with the confirmed shipping address
      const response = await fetch(`/api/orders/${order.id}/shipping-address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shippingAddress: shippingAddressData }),
      });

      if (response.ok) {
        console.log("Shipping address saved to order successfully");
        setAddressConfirmed(true);
        setSuccess("Shipping address confirmed and saved!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        console.error("Failed to save shipping address:", errorData);
        setError(`Failed to save shipping address: ${errorData.error}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error confirming shipping address:", error);
      setError("Failed to confirm shipping address. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!order) return;

    try {
      console.log(
        "Checkout Page: User cancelled purchase, cleaning up session"
      );

      // Cleanup the session when user cancels
      const response = await fetch("/api/checkout/cleanup-expired", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Checkout Page: Session cleaned up on cancel:", data);
        setSuccess(
          "Purchase cancelled. The item has been released and is available for purchase again."
        );

        // Redirect back to the listing page after a short delay
        setTimeout(() => {
          router.push(`/list-item/${order.listing.itemId}`);
        }, 2000);
      } else {
        console.error("Checkout Page: Failed to cleanup session on cancel");
        // Still redirect even if cleanup fails
        router.push(`/list-item/${order.listing.itemId}`);
      }
    } catch (error) {
      console.error(
        "Checkout Page: Error cleaning up session on cancel:",
        error
      );
      // Still redirect even if cleanup fails
      router.push(`/list-item/${order.listing.itemId}`);
    }
  };

  // Handle update address
  const handleUpdateAddress = () => {
    router.push("/profile");
  };

  // Handle adding more time to checkout
  const handleAddMoreTime = async () => {
    if (!order || timeExtensionUsed || extendingTime) return;

    setExtendingTime(true);

    try {
      console.log("Checkout Page: Adding 5 more minutes to order:", order.id);

      const response = await fetch("/api/checkout/extend-time", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extend checkout time");
      }

      const data = await response.json();

      if (data.success) {
        console.log("Checkout Page: Time extended successfully");
        setTimeExtensionUsed(true);

        // Update the order with new expiry time
        setOrder((prevOrder) =>
          prevOrder
            ? {
                ...prevOrder,
                checkoutExpiresAt: data.newExpiryTime,
              }
            : null
        );

        // Show success message
        setSuccess("Checkout time extended by 5 minutes!");
      } else {
        throw new Error(data.error || "Failed to extend checkout time");
      }
    } catch (err) {
      console.error("Checkout Page: Error extending time:", err);
      setError(
        err instanceof Error ? err.message : "Failed to extend checkout time"
      );
    } finally {
      setExtendingTime(false);
    }
  };

  if (loading || session === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF3D]" />
          <p className="mt-4 text-gray-600">
            {session === undefined
              ? "Loading session..."
              : "Loading checkout..."}
          </p>
        </div>
      </div>
    );
  }

  // Clear any previous errors when session becomes available
  if (session && error === "Authentication required") {
    setError(null);
  }

  if (error || !order) {
    // Don't show error if we're still loading or if session is available
    if (loading || session === undefined || (session && !error)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF3D]" />
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      );
    }

    // Don't show authentication error if we have a session and order
    if (error === "Authentication required" && session && order) {
      console.log(
        "Checkout Page: Ignoring authentication error - session and order available"
      );
      // Continue to render the checkout page
    } else {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <h2 className="font-semibold mb-2">Checkout Error</h2>
              <p>{error || "Order not found"}</p>

              {/* Special handling for expired checkout sessions */}
              {error && error.includes("expired") && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <p className="text-sm mt-2">
                    <strong>Next steps:</strong> Return to the listings to
                    purchase the item again.
                  </p>
                </div>
              )}
            </div>
            <Button className="mt-4" onClick={() => router.push("/listings")}>
              Back to Listings
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600 mb-4">
            Your item is reserved. Complete payment within the time limit to
            secure your purchase.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>⏱️ Timer Info:</strong> If the timer expires, your
              reservation will be automatically released and the item will
              become available for other buyers. You can extend your time once
              for up to 15 minutes total.
            </p>
          </div>
        </div>

        {/* Checkout Timer with Extension */}
        <div className="mb-8">
          <CheckoutTimer
            expiresAt={order.checkoutExpiresAt}
            onExpired={handleTimerExpired}
            className="mb-4"
          />

          {/* Add More Time Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleAddMoreTime}
              disabled={timeExtensionUsed || extendingTime}
              variant="outline"
              size="sm"
              className={`${
                timeExtensionUsed
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                  : "border-[#D4AF3D] text-[#D4AF3D] hover:bg-[#D4AF3D] hover:text-white"
              } transition-colors`}
            >
              {extendingTime ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Time...
                </>
              ) : timeExtensionUsed ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Max Time Reached (15 min)
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Add 5 More Minutes
                </>
              )}
            </Button>
          </div>

          {/* Extension Info */}
          {!timeExtensionUsed && (
            <div className="text-center text-sm text-gray-500 mt-2">
              <p>
                You can extend your processing time once by 5 minutes (max 15
                minutes total)
              </p>
              {(() => {
                if (timeExtensionUsed) {
                  return null; // No extension info if already used
                }

                const now = new Date();
                const orderCreatedAt = new Date(order.createdAt);
                const timeSinceCreation =
                  now.getTime() - orderCreatedAt.getTime();
                const maxAllowedTime = 15 * 60 * 1000; // 15 minutes max total
                const remainingTimeForExtension = Math.max(
                  0,
                  maxAllowedTime - timeSinceCreation
                );
                const remainingMinutes = Math.ceil(
                  remainingTimeForExtension / 1000 / 60
                );

                if (remainingTimeForExtension > 0) {
                  return (
                    <p className="text-blue-600 font-medium mt-1">
                      Extension available for {remainingMinutes} more minutes
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {timeExtensionUsed && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Time extension used - maximum checkout time reached
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-green-800">
                <p className="font-medium mb-1">Success!</p>
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Status */}
        {(() => {
          const now = new Date();
          const orderExpiry = new Date(order.checkoutExpiresAt);
          const isExpired = now > orderExpiry;
          const timeUntilExpiry = orderExpiry.getTime() - now.getTime();
          const minutesUntilExpiry = Math.ceil(timeUntilExpiry / 1000 / 60);

          if (isExpired) {
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-orange-800">
                    <p className="font-medium mb-1">Session Expired</p>
                    <p className="text-sm">
                      Your checkout session has expired. When you continue to
                      payment, we'll create a fresh checkout session
                      automatically.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Show warning when less than 2 minutes remaining
          if (minutesUntilExpiry <= 2 && minutesUntilExpiry > 0) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-yellow-800">
                    <p className="font-medium mb-1">Session Expiring Soon</p>
                    <p className="text-sm">
                      Your checkout session expires in {minutesUntilExpiry}{" "}
                      minute{minutesUntilExpiry !== 1 ? "s" : ""}. Complete your
                      purchase or use the "Add More Time" button to extend.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}

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
              {/* Price Breakdown with Harris County Sales Tax */}
              {(() => {
                const subtotal = order.amount || 0;
                const deliveryFee = deliveryCategory === "BULK" ? 100 : 50;
                const promoDiscount = promoStatus?.valid
                  ? promoStatus.discount
                  : 0;
                const taxedBase = Math.max(
                  0,
                  subtotal + deliveryFee - promoDiscount
                );
                const salesTax = subtotal * HARRIS_COUNTY_TAX_RATE;
                const estimatedTotal =
                  taxedBase + taxedBase * HARRIS_COUNTY_TAX_RATE;
                return (
                  <div className="text-sm text-gray-800">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-600">
                        Delivery (
                        {deliveryCategory === "BULK" ? "Bulk" : "Normal"})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(deliveryFee)}
                      </span>
                    </div>
                    {promoStatus?.valid && (
                      <div className="flex items-center justify-between py-0.5 text-green-700">
                        <span className="">Promo Discount</span>
                        <span className="font-medium">
                          - {formatCurrency(promoStatus.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-600">
                        Sales Tax ({(HARRIS_COUNTY_TAX_RATE * 100).toFixed(2)}%)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(taxedBase * HARRIS_COUNTY_TAX_RATE)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 mt-1 border-t">
                      <span className="font-semibold">Estimated Total</span>
                      <span className="text-[#D4AF3D] font-semibold">
                        {formatCurrency(estimatedTotal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tax shown is calculated at{" "}
                      {(HARRIS_COUNTY_TAX_RATE * 100).toFixed(2)}%.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Shipping Address Confirmation */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Confirm Your Shipping Address
          </h2>
          <p className="text-gray-600 mb-4">
            We'll use your profile shipping address. Please confirm it's correct
            before proceeding to payment.
          </p>

          {user?.zipCode && user?.addressLine1 ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Your current shipping address:
                    </p>
                    <div className="font-medium text-gray-900">
                      <p>{user.addressLine1}</p>
                      {user.addressLine2 && <p>{user.addressLine2}</p>}
                      <p>
                        {user.city}, {user.state} {user.zipCode}
                      </p>
                    </div>
                  </div>

                  {/* Validation status moved to the right */}
                  <div className="ml-4 flex-shrink-0">
                    {zipCodeValid === null && (
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Address not yet validated
                      </div>
                    )}
                    {zipCodeValid === true && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          ✓ Valid for delivery
                        </span>
                      </div>
                    )}
                    {zipCodeValid === false && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Not in service area
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddressModal(true)}
                    variant="outline"
                    size="sm"
                    className="text-[#D4AF3D] border-[#D4AF3D] hover:bg-[#D4AF3D] hover:text-white"
                  >
                    Change Address
                  </Button>

                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel Purchase
                  </Button>
                </div>
              </div>

              {/* Confirm Address Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleAddressConfirmation}
                  disabled={zipCodeValid !== true || addressConfirmed}
                  className="bg-[#D4AF3D] hover:bg-[#D4AF3D]/90 text-white font-semibold py-3 px-8"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {addressConfirmed
                    ? "Address Confirmed ✓"
                    : "Confirm Shipping Address"}
                </Button>
              </div>

              {zipCodeValid === false && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    Your shipping address is not in our service area. Please
                    update your address to continue.
                  </p>
                </div>
              )}

              {zipCodeValid === null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Please confirm this is your correct shipping address. We'll
                    validate your zip code before proceeding to payment.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium mb-1">
                    Shipping Address Required
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    To complete your purchase, please add your shipping address
                    to your profile.
                  </p>
                  <Button
                    onClick={handleUpdateAddress}
                    size="sm"
                    className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                  >
                    Add Address to Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Promo + Delivery Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">Delivery & Promo</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Delivery Type
              </label>
              <select
                value={deliveryCategory}
                onChange={(e) => setDeliveryCategory(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="NORMAL">Normal ($50)</option>
                <option value="BULK">Bulk ($100)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Enter code"
                  className="border rounded px-3 py-2 flex-1"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout/validate-promo", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          code: promo,
                          subtotal: order?.amount || 0,
                        }),
                      });
                      const data = await res.json();
                      if (data.valid)
                        setPromoStatus({
                          valid: true,
                          discount: data.discount,
                        });
                      else setPromoStatus({ valid: false, discount: 0 });
                    } catch {
                      setPromoStatus({ valid: false, discount: 0 });
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
              {promoStatus && (
                <p
                  className={`text-sm mt-1 ${
                    promoStatus.valid ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {promoStatus.valid
                    ? `Promo applied: -$${promoStatus.discount.toFixed(2)}`
                    : "Invalid promo code"}
                </p>
              )}
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
                After confirming your shipping address, you'll be redirected to
                our secure payment processor (Stripe) to complete your purchase
                safely.
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
            disabled={redirecting || validatingZip}
          >
            Cancel
          </Button>

          <Button
            onClick={handleContinueToPayment}
            className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            disabled={
              redirecting ||
              validatingZip ||
              !user?.zipCode ||
              !user?.addressLine1 ||
              zipCodeValid === false ||
              !addressConfirmed
            }
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Redirecting to Payment...
              </>
            ) : validatingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Validating Address...
              </>
            ) : !user?.zipCode || !user?.addressLine1 ? (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Add Shipping Address
              </>
            ) : zipCodeValid === false ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Address Not in Service Area
              </>
            ) : zipCodeValid === null ? (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Confirm Address & Continue
              </>
            ) : !addressConfirmed ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Address First
              </>
            ) : (
              (() => {
                const now = new Date();
                const orderExpiry = new Date(order.checkoutExpiresAt);
                const isExpired = now > orderExpiry;

                if (isExpired) {
                  return (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Session & Continue
                    </>
                  );
                }
                return (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Continue to Payment
                  </>
                );
              })()
            )}
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by Stripe for secure payment processing
        </p>

        {/* Address Update Modal */}
        {showZipCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#D4AF3D] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {!user?.zipCode || !user?.addressLine1
                      ? "Shipping Address Required"
                      : "Address Not in Service Area"}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {!user?.zipCode || !user?.addressLine1
                      ? "To complete your purchase, please add your shipping address to your profile. This helps us ensure smooth delivery."
                      : "Your current shipping address is not in our service area. Please update your address to continue with your purchase."}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleUpdateAddress}
                    className="w-full bg-[#D4AF3D] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#c4a235] transition-colors"
                  >
                    {!user?.zipCode || !user?.addressLine1
                      ? "Add Address to Profile"
                      : "Update Address"}
                  </button>
                  <button
                    onClick={() => setShowZipCodeModal(false)}
                    className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  You can update your address from your profile page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Address Modal */}
        <CheckoutAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onAddressSelect={handleAddressChange}
          currentAddress={
            user
              ? `${user.addressLine1}${
                  user.addressLine2 ? ", " + user.addressLine2 : ""
                }, ${user.city}, ${user.state} ${user.zipCode}`
              : ""
          }
          currentAddressData={
            user
              ? {
                  streetAddress: user.addressLine1 || "",
                  apartment: user.addressLine2 || "",
                  city: user.city || "",
                  state: user.state || "",
                  postalCode: user.zipCode || "",
                  country: "United States",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
