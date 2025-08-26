"use client";
import React from "react";
import { Lock } from "lucide-react";

interface AdditionalFormFieldsProps {
  // Reserve Price
  reservePrice: string;
  setReservePrice: (value: string) => void;
  price: string;

  // Serial Number
  serialNumber: string;
  setSerialNumber: (value: string) => void;

  // Model Number
  modelNumber: string;
  setModelNumber: (value: string) => void;

  // Estimated Retail Price
  estimatedRetailPrice: string;
  setEstimatedRetailPrice: (value: string) => void;
  selectedInventoryItem?: {
    unitRetail?: number;
  };

  // Discount Schedule
  discountSchedule: string;
  setDiscountSchedule: (value: string) => void;
  discountSchedules: readonly string[];

  // GTIN/UPC
  facebookGtin: string;
  setFacebookGtin: (value: string) => void;
  setGtinEdited: (value: boolean) => void;

  // Generated fields (read-only)
  generatedListingId?: string;
  itemId?: string;
  generateQRCode?: (id: string) => string;
  generatedQRCode?: string;
}

export default function AdditionalFormFields({
  reservePrice,
  setReservePrice,
  price,
  serialNumber,
  setSerialNumber,
  modelNumber,
  setModelNumber,
  estimatedRetailPrice,
  setEstimatedRetailPrice,
  selectedInventoryItem,
  discountSchedule,
  setDiscountSchedule,
  discountSchedules,
  facebookGtin,
  setFacebookGtin,
  setGtinEdited,
  generatedListingId,
  itemId,
  generateQRCode,
  generatedQRCode,
}: AdditionalFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Reserve Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reserve Price ($)
        </label>
        <input
          type="number"
          value={reservePrice}
          onChange={(e) => setReservePrice(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="0.00"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum price you're willing to accept (default: 60% of list price)
        </p>
      </div>

      {/* GTIN/UPC Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GTIN/UPC Code
        </label>
        <input
          type="text"
          value={facebookGtin}
          onChange={(e) => {
            setFacebookGtin(e.target.value);
            setGtinEdited(true);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="e.g., 1234567890123"
          maxLength={13}
        />
        <p className="text-xs text-gray-500 mt-1">
          Global Trade Item Number or UPC code for better Facebook matching
        </p>
      </div>

      {/* Serial Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Serial Number
        </label>
        <input
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="Enter serial number if available"
        />
      </div>

      {/* Model Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model Number
        </label>
        <input
          type="text"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="Enter model number if available"
        />
      </div>

      {/* Estimated Retail Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Retail Price
        </label>
        <input
          type="number"
          value={estimatedRetailPrice}
          onChange={(e) => setEstimatedRetailPrice(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="0.00"
        />
        <p className="text-xs text-gray-500 mt-1">
          {typeof selectedInventoryItem?.unitRetail === "number"
            ? `MSRP: $${selectedInventoryItem.unitRetail}`
            : "Original retail price for comparison"}
        </p>
      </div>

      {/* Discount Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Schedule *
        </label>
        <select
          value={discountSchedule}
          onChange={(e) => setDiscountSchedule(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          required
        >
          <option value="">Select Discount Schedule</option>
          {discountSchedules.map((schedule) => (
            <option key={schedule} value={schedule}>
              {schedule}
            </option>
          ))}
        </select>
      </div>

      {/* QR Code (Read-only) */}
      {(generatedListingId || itemId || generatedQRCode) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={
                generatedQRCode ||
                (itemId && generateQRCode
                  ? generateQRCode(itemId)
                  : "Generating...")
              }
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-xs"
            />
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* Listing ID (Read-only) */}
      {(generatedListingId || itemId) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Listing ID
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={generatedListingId || itemId || "Generating..."}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for this listing
          </p>
        </div>
      )}
    </div>
  );
}
