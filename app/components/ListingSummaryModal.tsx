"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Package, Calendar, TrendingUp } from "lucide-react";

interface ListingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onUpdate: (updatedListing: any) => void;
}

export default function ListingSummaryModal({
  isOpen,
  onClose,
  listing,
  onUpdate,
}: ListingSummaryModalProps) {
  const [formData, setFormData] = useState({
    status: "",
    transactionPrice: "",
    paymentMethod: "",
    salesTax: "",
    taxRate: "8.25", // Default Texas sales tax rate
    dateSold: "",
    comments: "",
    fulfillmentMethod: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when listing changes
  useEffect(() => {
    if (listing) {
      setFormData({
        status: listing.status || "",
        transactionPrice: listing.transactionPrice?.toString() || "",
        paymentMethod: listing.paymentMethod || "",
        salesTax: listing.salesTax?.toString() || "",
        taxRate: listing.taxRate?.toString() || "8.25",
        dateSold: listing.soldAt
          ? new Date(listing.soldAt).toISOString().split("T")[0]
          : "",
        comments: listing.comments || "",
        fulfillmentMethod: listing.fulfillmentMethod || "",
      });
    }
  }, [listing]);

  // Calculate purchase price from inventory or existing data
  const getPurchasePrice = () => {
    // If already set in listing, use that
    if (listing?.purchasePrice) {
      return listing.purchasePrice;
    }

    // Otherwise calculate from inventory
    if (listing?.inventoryItems && listing.inventoryItems.length > 0) {
      const inventoryItem = listing.inventoryItems[0];
      if (
        inventoryItem.purchasePrice &&
        inventoryItem.quantity &&
        inventoryItem.quantity > 0
      ) {
        return inventoryItem.purchasePrice / inventoryItem.quantity;
      }
    }

    return null;
  };

  // Auto-calculate sales tax when transaction price or tax rate changes
  useEffect(() => {
    if (formData.transactionPrice && formData.taxRate) {
      const totalPrice = parseFloat(formData.transactionPrice);
      const rate = parseFloat(formData.taxRate) / 100;

      // For cash payments, the transaction price includes tax, so we need to back-calculate
      // For other payments, the transaction price is pre-tax
      let calculatedTax;
      if (formData.paymentMethod === "cash") {
        // Transaction price is tax-inclusive
        // Net amount = totalPrice / (1 + rate)
        // Tax = totalPrice - net amount
        const netAmount = totalPrice / (1 + rate);
        calculatedTax = totalPrice - netAmount;
      } else {
        // Transaction price is pre-tax, so: tax = totalPrice * rate
        calculatedTax = totalPrice * rate;
      }

      setFormData((prev) => ({
        ...prev,
        salesTax: calculatedTax.toFixed(2),
      }));
    }
  }, [formData.transactionPrice, formData.taxRate, formData.paymentMethod]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: any = {
        status: formData.status,
        transactionPrice: formData.transactionPrice
          ? parseFloat(formData.transactionPrice)
          : null,
        paymentMethod: formData.paymentMethod || null,
        salesTax: formData.salesTax ? parseFloat(formData.salesTax) : null,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
        comments: formData.comments || null,
        fulfillmentMethod: formData.fulfillmentMethod || null,
      };

      // Handle date sold - use provided date or auto-set when status changes to sold
      if (formData.dateSold) {
        updateData.dateSold = formData.dateSold;
      } else if (formData.status === "sold" && listing.status !== "sold") {
        updateData.dateSold = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }

      const response = await fetch(`/api/listings/${listing.itemId}/summary`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      const result = await response.json();

      if (result.success) {
        // Update the listing in the parent component
        onUpdate(result.listing);
        onClose();
      } else {
        throw new Error(result.error || "Failed to update listing");
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      alert("Failed to update listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = () => {
    const purchase = getPurchasePrice() || 0;
    const transaction = parseFloat(formData.transactionPrice) || 0;
    const tax = parseFloat(formData.salesTax) || 0;

    // For cash payments, the transaction price is tax-inclusive, so actual revenue = transaction - tax
    // For other payment methods (Venmo, Zelle), the transaction price is pre-tax, so actual revenue = transaction
    const actualRevenue =
      formData.paymentMethod === "cash"
        ? transaction - tax // Cash: transaction price includes tax, so deduct tax to get net revenue
        : transaction; // Venmo/Zelle: transaction price is pre-tax, buyer pays tax separately

    return actualRevenue - purchase;
  };

  const calculateProfitMargin = () => {
    const purchase = getPurchasePrice() || 0;
    const profit = calculateProfit();

    if (purchase === 0) return 0;
    return (profit / purchase) * 100;
  };

  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Listing Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1">{listing.itemId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Item Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Title:</span>
                <p className="font-medium">{listing.title}</p>
              </div>
              <div>
                <span className="text-gray-500">Listed Price:</span>
                <p className="font-medium text-[#D4AF3D]">
                  ${listing.price?.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Views:</span>
                <p className="font-medium">{listing.views || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              required
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="processing">Processing</option>
              <option value="sold">Sold</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Purchase Price - Display Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Price (From Inventory)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={
                  getPurchasePrice()
                    ? `$${getPurchasePrice()?.toFixed(2)}`
                    : "Not available from inventory"
                }
                readOnly
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            {listing?.inventoryItems && listing.inventoryItems.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                From:{" "}
                {listing.inventoryItems[0].description || "Inventory Item"}
              </p>
            )}
          </div>

          {/* Transaction Details - Only show when status is 'sold' */}
          {formData.status === "sold" && (
            <div className="space-y-4 bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">
                Transaction Details
              </h3>

              {/* Transaction Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Price (Final sale price)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.transactionPrice}
                    onChange={(e) =>
                      handleInputChange("transactionPrice", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Payment Method and Fulfillment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      handleInputChange("paymentMethod", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="venmo">Venmo</option>
                    <option value="zelle">Zelle</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fulfillment Method
                  </label>
                  <select
                    value={formData.fulfillmentMethod}
                    onChange={(e) =>
                      handleInputChange("fulfillmentMethod", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Method</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              {/* Tax Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) =>
                      handleInputChange("taxRate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="8.25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Tax (Auto-calculated)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.salesTax}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Date Sold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Sold
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    value={formData.dateSold}
                    onChange={(e) =>
                      handleInputChange("dateSold", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments / Notes
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) =>
                    handleInputChange("comments", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent resize-none"
                  placeholder="Add any notes about this transaction..."
                />
              </div>

              {/* Profit Calculation */}
              {getPurchasePrice() && formData.transactionPrice && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Profit Analysis
                  </h4>

                  {/* Revenue Breakdown for Cash Payments */}
                  {formData.paymentMethod === "cash" && formData.salesTax && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="font-medium text-yellow-800 mb-1">
                        Cash Payment - Tax-Inclusive Breakdown:
                      </p>
                      <div className="space-y-1 text-yellow-700">
                        <div className="flex justify-between">
                          <span>Your Net Revenue:</span>
                          <span>
                            $
                            {(
                              parseFloat(formData.transactionPrice) -
                              parseFloat(formData.salesTax)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sales Tax (you pay):</span>
                          <span>
                            ${parseFloat(formData.salesTax).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-yellow-300 pt-1">
                          <span>Total Transaction Price:</span>
                          <span>
                            ${parseFloat(formData.transactionPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Net Profit:</span>
                      <p
                        className={`font-medium ${
                          calculateProfit() >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ${calculateProfit().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Profit Margin:</span>
                      <p
                        className={`font-medium ${
                          calculateProfitMargin() >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {calculateProfitMargin().toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
