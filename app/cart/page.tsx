"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { useCart } from "../contexts/CartContext";
import { authClient } from "../lib/auth-client";
import { getDisplayPrice } from "../lib/price-calculator";
import {
  calculateCartTotals,
  formatCurrency,
  getDeliveryFeeExplanation,
} from "../../lib/cart-calculations";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  Tag,
} from "lucide-react";
import PromoCodeInput from "../components/PromoCodeInput";

export default function CartPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Calculate fresh totals based on current cart items and delivery method
  const calculateCurrentTotals = (
    deliveryMethod: "delivery" | "pickup" = "delivery"
  ) => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
        hasBulkItems: false,
        hasNormalItems: false,
        promoDiscount: 0,
      };
    }

    // Transform cart items to match calculation function interface
    const transformedItems = cart.items.map((item: any) => {
      const currentPrice = getDisplayPrice(item.listing).price;
      return {
        id: item.id,
        quantity: item.quantity,
        listing: {
          price: currentPrice,
          bulkItem: item.listing.deliveryCategory === "BULK",
        },
      };
    });

    const baseTotals = calculateCartTotals(transformedItems, deliveryMethod);

    // Apply promo code discount
    let promoDiscount = 0;
    let adjustedDeliveryFee = baseTotals.deliveryFee;

    if (cart.promoDiscount) {
      if (cart.promoDiscount.type === "free_shipping") {
        promoDiscount = baseTotals.deliveryFee;
        adjustedDeliveryFee = 0;
      } else {
        promoDiscount = cart.promoDiscount.amount;
      }
    }

    // Recalculate tax on the correct taxable amount (subtotal + adjusted delivery fee)
    const taxableAmount = baseTotals.subtotal + adjustedDeliveryFee;
    const adjustedTax = taxableAmount * 0.0825; // 8.25% tax rate

    // Calculate final total with correct tax
    const adjustedTotal =
      baseTotals.subtotal + adjustedDeliveryFee + adjustedTax;

    return {
      ...baseTotals,
      deliveryFee: adjustedDeliveryFee,
      tax: adjustedTax,
      total: adjustedTotal,
      promoDiscount,
    };
  };
  const isAuthenticated = !!session?.user;
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activeCheckouts, setActiveCheckouts] = useState<any[]>([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const [expiredOrders, setExpiredOrders] = useState<any[]>([]);
  const [loadingExpired, setLoadingExpired] = useState(false);
  const [restoringOrders, setRestoringOrders] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">(
    "delivery"
  );
  const {
    cart,
    isLoading,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  // Load active checkout sessions
  const loadActiveCheckouts = async () => {
    if (!isAuthenticated) return;

    setLoadingCheckouts(true);
    try {
      const response = await fetch("/api/checkout/resume", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setActiveCheckouts(data.activeOrders || []);
      }
    } catch (error) {
      console.error("Error loading active checkouts:", error);
    } finally {
      setLoadingCheckouts(false);
    }
  };

  // Load expired orders that can be restored
  const loadExpiredOrders = async () => {
    if (!isAuthenticated) return;

    setLoadingExpired(true);
    try {
      const response = await fetch("/api/orders/expired", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExpiredOrders(data.expiredOrders || []);
      }
    } catch (error) {
      console.error("Error loading expired orders:", error);
    } finally {
      setLoadingExpired(false);
    }
  };

  // Restore expired orders to cart
  const handleRestoreExpiredOrders = async (orderIds: string[]) => {
    setRestoringOrders(true);
    try {
      const response = await fetch("/api/orders/expired/restore", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderIds }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh both expired orders and cart
        await Promise.all([loadExpiredOrders(), refreshCart()]);

        // Show success message
        const message =
          data.message ||
          `${data.stats?.restored || orderIds.length} item(s) restored to cart`;
        alert(message);
      } else {
        alert(data.error || "Failed to restore orders");
      }
    } catch (error) {
      console.error("Error restoring expired orders:", error);
      alert("Failed to restore orders. Please try again.");
    } finally {
      setRestoringOrders(false);
    }
  };

  // Load active checkouts and expired orders when page loads
  useEffect(() => {
    if (isAuthenticated) {
      loadActiveCheckouts();
      loadExpiredOrders();
    }
  }, [isAuthenticated]);

  // Handle checkout
  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryMethod: deliveryMethod,
          promoCode: cart.promoCode?.code,
          promoDiscount: cart.promoDiscount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to checkout page
        router.push(data.checkoutUrl);
      } else {
        setCheckoutError(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError("Failed to create checkout session. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Refresh cart on component mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    const success = await removeFromCart(itemId);
    if (!success) {
      alert("Failed to remove item from cart");
    }
    setRemovingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    const success = await updateQuantity(itemId, newQuantity);
    if (!success) {
      alert("Failed to update quantity");
    }
    setUpdatingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      const success = await clearCart();
      if (!success) {
        alert("Failed to clear cart");
      }
    }
  };

  const getImageUrl = (photos: any) => {
    if (!photos) return "/placeholder-image.png";
    if (typeof photos === "string") return photos;
    if (photos.hero) return photos.hero;
    if (photos.staged) return photos.staged;
    if (photos.back) return photos.back;
    if (photos.proof) return photos.proof;
    return "/placeholder-image.png";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Shopping Cart
            </h1>
            {cart && cart.items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Checkout Sessions */}
        {activeCheckouts.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    You have {activeCheckouts.length} active checkout session
                    {activeCheckouts.length > 1 ? "s" : ""}
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    You can resume your checkout or cancel to return items to
                    your cart.
                  </p>
                  <div className="space-y-2">
                    {activeCheckouts.map((checkout) => {
                      const minutes = Math.floor(checkout.timeRemaining / 60);
                      const seconds = checkout.timeRemaining % 60;

                      return (
                        <div
                          key={checkout.id}
                          className="bg-white rounded border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {checkout.listing.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                ${checkout.amount.toFixed(2)} • Expires in{" "}
                                {minutes}m {seconds}s
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={async () => {
                                  try {
                                    // Call resume API to extend timer, then redirect
                                    const response = await fetch(
                                      "/api/checkout/resume",
                                      {
                                        method: "POST",
                                        credentials: "include",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          orderId: checkout.id,
                                        }),
                                      }
                                    );

                                    const data = await response.json();

                                    if (response.ok && data.success) {
                                      // Show success message and redirect
                                      console.log(
                                        "Checkout resumed with 10 minutes added"
                                      );
                                      router.push(data.checkoutUrl);
                                    } else {
                                      console.error(
                                        "Failed to resume checkout:",
                                        data.error
                                      );
                                      // Fallback: just redirect without extending time
                                      router.push(checkout.resumeUrl);
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error resuming checkout:",
                                      error
                                    );
                                    // Fallback: just redirect without extending time
                                    router.push(checkout.resumeUrl);
                                  }
                                }}
                                size="sm"
                                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                              >
                                Resume (+10 min)
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    await fetch(
                                      "/api/checkout/cleanup-expired",
                                      {
                                        method: "POST",
                                        credentials: "include",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          orderId: checkout.id,
                                        }),
                                      }
                                    );
                                    // Refresh both active checkouts and cart
                                    loadActiveCheckouts();
                                    refreshCart();
                                  } catch (error) {
                                    console.error(
                                      "Error cancelling checkout:",
                                      error
                                    );
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                className="text-gray-600 border-gray-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expired Orders that can be restored */}
        {expiredOrders.length > 0 && (
          <div className="mb-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-orange-800 mb-2">
                    You have {expiredOrders.length} expired order
                    {expiredOrders.length > 1 ? "s" : ""} that can be restored
                  </h3>
                  <p className="text-sm text-orange-700 mb-3">
                    These orders expired before payment was completed. You can
                    restore them back to your cart to continue shopping.
                  </p>
                  <div className="space-y-2">
                    {expiredOrders.map((expiredOrder) => {
                      const hoursAgo = Math.floor(
                        expiredOrder.expiredMinutesAgo / 60
                      );
                      const minutesAgo = expiredOrder.expiredMinutesAgo % 60;
                      const timeAgoText =
                        hoursAgo > 0
                          ? `${hoursAgo}h ${minutesAgo}m ago`
                          : `${minutesAgo}m ago`;

                      return (
                        <div
                          key={expiredOrder.id}
                          className="bg-white border border-orange-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {expiredOrder.isMultiItem ? (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                                  </div>
                                ) : (
                                  expiredOrder.listing?.photos?.hero && (
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                      <img
                                        src={expiredOrder.listing.photos.hero}
                                        alt={expiredOrder.listing.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {expiredOrder.isMultiItem
                                      ? `${expiredOrder.itemCount} items (Cart Order)`
                                      : expiredOrder.listing?.title}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    ${expiredOrder.amount.toFixed(2)} • Expired{" "}
                                    {timeAgoText}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() =>
                                  handleRestoreExpiredOrders([expiredOrder.id])
                                }
                                disabled={restoringOrders}
                                size="sm"
                                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                              >
                                {restoringOrders ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Restoring...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Restore to Cart
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Restore All Button */}
                  {expiredOrders.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <Button
                        onClick={() =>
                          handleRestoreExpiredOrders(
                            expiredOrders.map((o) => o.id)
                          )
                        }
                        disabled={restoringOrders}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        {restoringOrders ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Restoring All...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Restore All {expiredOrders.length} Orders
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any treasures to your cart yet.
            </p>
            <Button
              onClick={() => router.push("/listings")}
              className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Discover Treasures
            </Button>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Items in your cart ({cart.items.length})
              </h2>

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex gap-4">
                    {/* Item Image - Clickable */}
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(item.listing.photos)}
                        alt={item.listing.title}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() =>
                          router.push(`/list-item/${item.listing.itemId}`)
                        }
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            className="text-lg font-semibold text-gray-900 mb-1 hover:text-[#D4AF3D] transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(`/list-item/${item.listing.itemId}`)
                            }
                          >
                            {item.listing.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Sold by TreasureHub
                          </p>
                          <p
                            className="text-sm text-gray-600 mb-2 hover:text-[#D4AF3D] cursor-pointer transition-colors"
                            onClick={() =>
                              router.push(`/list-item/${item.listing.itemId}`)
                            }
                          >
                            SKU: {item.listing.itemId}
                          </p>
                          {item.listing.deliveryCategory === "BULK" && (
                            <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              Bulk Item
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {(() => {
                            const priceInfo = getDisplayPrice(item.listing);
                            return (
                              <div>
                                {priceInfo.isDiscounted &&
                                  priceInfo.originalPrice && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ${priceInfo.originalPrice.toFixed(2)}
                                    </p>
                                  )}
                                <p className="text-xl font-bold text-gray-900">
                                  ${priceInfo.price.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">each</p>
                                {priceInfo.isDiscounted && (
                                  <p className="text-xs text-green-600 font-medium">
                                    Sale Price
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Quantity Controls and Remove */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            Quantity:
                          </span>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={
                                item.quantity <= 1 || updatingItems.has(item.id)
                              }
                              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 min-w-[3rem] text-center">
                              {updatingItems.has(item.id)
                                ? "..."
                                : item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={updatingItems.has(item.id)}
                              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItems.has(item.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingItems.has(item.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>

                {(() => {
                  // Calculate fresh totals based on current delivery method
                  const calculations = calculateCurrentTotals(deliveryMethod);

                  return (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Subtotal (
                          {cart.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                          )}{" "}
                          items)
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(calculations.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          {deliveryMethod === "pickup"
                            ? "Pickup Fee"
                            : "Delivery Fee"}
                          {cart.promoDiscount?.type === "free_shipping" &&
                            calculations.deliveryFee === 0 && (
                              <span className="text-xs text-green-600 ml-1">
                                - {cart.promoCode?.code} Applied
                              </span>
                            )}
                          {calculations.deliveryFee > 0 && (
                            <div className="group relative">
                              <AlertCircle className="h-3 w-3 text-gray-400" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {getDeliveryFeeExplanation(
                                  calculations,
                                  deliveryMethod
                                )}
                              </div>
                            </div>
                          )}
                        </span>
                        <span className="font-medium">
                          {calculations.deliveryFee > 0
                            ? `$${formatCurrency(calculations.deliveryFee)}`
                            : "FREE"}
                        </span>
                      </div>

                      {/* Free Delivery Message - Hide when free shipping promo is applied */}
                      {deliveryMethod === "delivery" &&
                        calculations.subtotal < 150 &&
                        !calculations.hasBulkItems &&
                        !(cart.promoDiscount?.type === "free_shipping") && (
                          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <Sparkles className="h-4 w-4 inline mr-1" />
                                Add $
                                {formatCurrency(
                                  150 - calculations.subtotal
                                )}{" "}
                                more to your order to qualify for free delivery!
                              </div>
                              <Button
                                onClick={() => router.push("/listings")}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-6 flex-shrink-0"
                              >
                                Continue Shopping
                              </Button>
                            </div>
                          </div>
                        )}

                      {/* Promo Code Discount - Only show for non-free-shipping promos */}
                      {calculations.promoDiscount > 0 &&
                        cart.promoDiscount?.type !== "free_shipping" && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Promo Code Discount
                            </span>
                            <span className="font-medium text-green-600">
                              -${formatCurrency(calculations.promoDiscount)}
                            </span>
                          </div>
                        )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (8.25%)</span>
                        <span className="font-medium">
                          ${formatCurrency(calculations.tax)}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>${formatCurrency(calculations.total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Promo Code Input */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <PromoCodeInput
                    onApply={applyPromoCode}
                    onRemove={removePromoCode}
                    appliedCode={cart?.promoCode}
                    discount={cart?.promoDiscount}
                    disabled={isLoading}
                  />
                </div>

                {/* Delivery Info */}
                {calculateCurrentTotals(deliveryMethod).hasBulkItems && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-orange-800">
                        <p className="font-medium mb-1">Bulk Item Notice</p>
                        <p>
                          Your cart contains bulk items. These may require
                          special delivery arrangements.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Method Selector */}
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Delivery Options
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        checked={deliveryMethod === "pickup"}
                        onChange={(e) =>
                          setDeliveryMethod(
                            e.target.value as "pickup" | "delivery"
                          )
                        }
                        className="w-4 h-4 text-[#D4AF3D] border-gray-300 focus:ring-[#D4AF3D]"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <span className="font-medium">Pickup</span> - Free
                        <span className="block text-xs text-gray-500 ml-6">
                          Pick up at our location
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="delivery"
                        checked={deliveryMethod === "delivery"}
                        onChange={(e) =>
                          setDeliveryMethod(
                            e.target.value as "pickup" | "delivery"
                          )
                        }
                        className="w-4 h-4 text-[#D4AF3D] border-gray-300 focus:ring-[#D4AF3D]"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <span className="font-medium">Delivery</span> -{" "}
                        {(() => {
                          const subtotal = cart?.subtotal || 0;
                          const hasBulkItems = cart?.hasBulkItems || false;

                          if (subtotal >= 150) {
                            return "FREE";
                          } else if (hasBulkItems) {
                            return "$100";
                          } else {
                            return "$50";
                          }
                        })()}
                        <span className="block text-xs text-gray-500 ml-6">
                          {cart?.subtotal >= 150
                            ? "Free delivery for orders over $150"
                            : "Delivered to your address"}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                  size="lg"
                  disabled={checkingOut || !cart || cart.items.length === 0}
                >
                  {checkingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Checkout...
                    </>
                  ) : deliveryMethod === "pickup" ? (
                    "Proceed to Pickup Checkout"
                  ) : (
                    "Proceed to Delivery Checkout"
                  )}
                </Button>

                {checkoutError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Checkout Error
                        </p>
                        <p className="text-sm text-red-700">{checkoutError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center mt-3">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
