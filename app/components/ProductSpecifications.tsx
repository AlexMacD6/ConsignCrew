"use client";
import React, { Dispatch, SetStateAction } from "react";
import { ConfidenceBadge } from "./ConfidenceIndicator";
import HybridInput from "./HybridInput";

// Import types and options
interface ProductSpecificationsProps {
  quantity: string;
  setQuantity: (value: string) => void;
  salePrice: string;
  setSalePrice: (value: string) => void;
  salePriceEffectiveDate: string;
  setSalePriceEffectiveDate: (value: string) => void;
  itemGroupId: string;
  setItemGroupId: (value: string) => void;
  gender: "" | "male" | "female" | "unisex";
  setGender: Dispatch<SetStateAction<"" | "male" | "female" | "unisex">>;
  ageGroup: "" | "newborn" | "infant" | "toddler" | "kids" | "adult";
  setAgeGroup: Dispatch<
    SetStateAction<"" | "newborn" | "infant" | "toddler" | "kids" | "adult">
  >;
  color: string;
  setColor: (value: string) => void;
  size: string;
  setSize: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  pattern: string;
  setPattern: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  confidenceScores?: {
    quantity?: { level: string };
    salePrice?: { level: string };
    salePriceEffectiveDate?: { level: string };
    itemGroupId?: { level: string };
    gender?: { level: string };
    ageGroup?: { level: string };
    color?: { level: string };
    size?: { level: string };
    material?: { level: string };
    pattern?: { level: string };
    style?: { level: string };
  };
  genderOptions: readonly string[];
  ageGroupOptions: readonly string[];
  colorSuggestions: readonly string[];
  materialSuggestions: readonly string[];
  patternSuggestions: readonly string[];
  styleSuggestions: readonly string[];
}

export default function ProductSpecifications({
  quantity,
  setQuantity,
  salePrice,
  setSalePrice,
  salePriceEffectiveDate,
  setSalePriceEffectiveDate,
  itemGroupId,
  setItemGroupId,
  gender,
  setGender,
  ageGroup,
  setAgeGroup,
  color,
  setColor,
  size,
  setSize,
  material,
  setMaterial,
  pattern,
  setPattern,
  style,
  setStyle,
  confidenceScores,
  genderOptions,
  ageGroupOptions,
  colorSuggestions,
  materialSuggestions,
  patternSuggestions,
  styleSuggestions,
}: ProductSpecificationsProps) {
  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-[#D4AF3D]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Product Specifications
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Detailed product specifications for better categorization and search
        visibility.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Quantity Available
            {confidenceScores?.quantity && (
              <ConfidenceBadge level={confidenceScores.quantity.level} />
            )}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="1"
          />
        </div>

        {/* Sale Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Sale Price ($)
            {confidenceScores?.salePrice && (
              <ConfidenceBadge level={confidenceScores.salePrice.level} />
            )}
          </label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Special sale price (optional)
          </p>
        </div>

        {/* Sale Price Effective Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Sale Price Effective Date
            {confidenceScores?.salePriceEffectiveDate && (
              <ConfidenceBadge
                level={confidenceScores.salePriceEffectiveDate.level}
              />
            )}
          </label>
          <input
            type="date"
            value={salePriceEffectiveDate}
            onChange={(e) => setSalePriceEffectiveDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          />
        </div>

        {/* Item Group ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Item Group ID
            {confidenceScores?.itemGroupId && (
              <ConfidenceBadge level={confidenceScores.itemGroupId.level} />
            )}
            <div className="relative group">
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Used to group related product variants (e.g., same shirt in
                different colors/sizes)
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <input
            type="text"
            value={itemGroupId}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 50) {
                setItemGroupId(value);
              }
            }}
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="For product variants"
          />
          <p className="text-xs text-gray-500 mt-1">
            {itemGroupId.length}/50 characters
          </p>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Gender
            {confidenceScores?.gender && (
              <ConfidenceBadge level={confidenceScores.gender.level} />
            )}
          </label>
          <select
            value={gender}
            onChange={(e) =>
              setGender(e.target.value as "" | "male" | "female" | "unisex")
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          >
            <option value="">Select Gender</option>
            {genderOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Age Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Age Group
            {confidenceScores?.ageGroup && (
              <ConfidenceBadge level={confidenceScores.ageGroup.level} />
            )}
          </label>
          <select
            value={ageGroup}
            onChange={(e) =>
              setAgeGroup(
                e.target.value as
                  | ""
                  | "newborn"
                  | "infant"
                  | "toddler"
                  | "kids"
                  | "adult"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          >
            <option value="">Select Age Group</option>
            {ageGroupOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <HybridInput
          value={color}
          onChange={setColor}
          suggestions={colorSuggestions}
          placeholder="e.g., Red, Blue, Black"
          label="Color"
          confidenceBadge={
            confidenceScores?.color && (
              <ConfidenceBadge level={confidenceScores.color.level} />
            )
          }
        />

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Size
            {confidenceScores?.size && (
              <ConfidenceBadge level={confidenceScores.size.level} />
            )}
          </label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="e.g., Large, XL, 42"
          />
        </div>

        {/* Material */}
        <HybridInput
          value={material}
          onChange={setMaterial}
          suggestions={materialSuggestions}
          placeholder="e.g., Cotton, Wood, Metal"
          label="Material"
          confidenceBadge={
            confidenceScores?.material && (
              <ConfidenceBadge level={confidenceScores.material.level} />
            )
          }
        />

        {/* Pattern */}
        <HybridInput
          value={pattern}
          onChange={setPattern}
          suggestions={patternSuggestions}
          placeholder="e.g., Striped, Floral, Solid"
          label="Pattern"
          confidenceBadge={
            confidenceScores?.pattern && (
              <ConfidenceBadge level={confidenceScores.pattern.level} />
            )
          }
        />

        {/* Style */}
        <HybridInput
          value={style}
          onChange={setStyle}
          suggestions={styleSuggestions}
          placeholder="e.g., Modern, Vintage, Casual"
          label="Style"
          confidenceBadge={
            confidenceScores?.style && (
              <ConfidenceBadge level={confidenceScores.style.level} />
            )
          }
        />
      </div>
    </div>
  );
}
