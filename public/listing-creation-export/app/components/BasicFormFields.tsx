"use client";
import React from "react";
import { ConfidenceBadge } from "./ConfidenceIndicator";
import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";

interface BasicFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  condition: string;
  setCondition: (value: string) => void;
  estimatedRetailPrice: string;
  setEstimatedRetailPrice: (value: string) => void;
  selectedInventoryItem?: {
    unitRetail?: number;
  };
  confidenceScores?: {
    title?: { level: ConfidenceLevel };
    brand?: { level: ConfidenceLevel };
    facebookCondition?: { level: ConfidenceLevel };
  };
}

const conditions = [
  "New",
  "Used - Like New",
  "Used - Good",
  "Used - Fair",
] as const;

export default function BasicFormFields({
  title,
  setTitle,
  price,
  setPrice,
  brand,
  setBrand,
  condition,
  setCondition,
  estimatedRetailPrice,
  setEstimatedRetailPrice,
  selectedInventoryItem,
  confidenceScores,
}: BasicFormFieldsProps) {
  return (
    <>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Title *
          {confidenceScores?.title && (
            <ConfidenceBadge level={confidenceScores.title.level} />
          )}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="Enter item title"
          required
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/100 characters
        </p>
      </div>

      {/* Estimated Retail Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Retail Price ($) *
        </label>
        <input
          type="number"
          value={estimatedRetailPrice}
          onChange={(e) => setEstimatedRetailPrice(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="0.00"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {typeof selectedInventoryItem?.unitRetail === "number"
            ? `MSRP: $${selectedInventoryItem.unitRetail}`
            : "Original retail price for comparison"}
        </p>
      </div>

      {/* List Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          List Price ($) *
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="0.00"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Price range: ${price ? Math.floor(parseFloat(price) * 0.8) : 0} - $
          {price ? Math.floor(parseFloat(price) * 1.2) : 0}
        </p>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Brand
          {confidenceScores?.brand && (
            <ConfidenceBadge level={confidenceScores.brand.level} />
          )}
        </label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="Enter brand name"
        />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Condition *
          {confidenceScores?.facebookCondition && (
            <ConfidenceBadge level={confidenceScores.facebookCondition.level} />
          )}
        </label>
        <select
          value={condition}
          onChange={(e) =>
            setCondition(e.target.value as (typeof conditions)[number] | "")
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          required
        >
          <option value="">Select Condition</option>
          <option value="New">New - Brand new, never used</option>
          <option value="Used - Like New">
            Used - Like New - Excellent condition, no visible wear
          </option>
          <option value="Used - Good">
            Used - Good - Light signs of use, fully functional
          </option>
          <option value="Used - Fair">
            Used - Fair - Heavily used, significant wear
          </option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Facebook-compatible condition format
        </p>
      </div>


    </>
  );
}
