"use client";
import React from "react";
import { ConfidenceBadge } from "./ConfidenceIndicator";

interface BasicFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  condition: string;
  setCondition: (value: string) => void;
  confidenceScores?: {
    title?: { level: string };
    description?: { level: string };
    brand?: { level: string };
    facebookCondition?: { level: string };
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
  description,
  setDescription,
  brand,
  setBrand,
  condition,
  setCondition,
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

      {/* Description - Full Width */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Description *
          {confidenceScores?.description && (
            <ConfidenceBadge level={confidenceScores.description.level} />
          )}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          placeholder="Describe your item in detail. Include features, condition, dimensions, and any relevant information that would help buyers understand your item..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/2000 characters recommended
        </p>
      </div>
    </>
  );
}
