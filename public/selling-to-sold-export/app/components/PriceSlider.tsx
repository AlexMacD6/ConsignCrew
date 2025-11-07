"use client";

import React, { useState, useCallback } from "react";
import ServiceFeeBreakdown from "./ServiceFeeBreakdown";

interface PricingTier {
  minPrice: number;
  maxPrice: number;
  feePercentage: number;
  label: string;
  description: string;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    minPrice: 50,
    maxPrice: 99,
    feePercentage: 50,
    label: "Basic Items",
    description: "Items valued $50-$99",
    features: [
      "Standard photography",
      "Automated listing",
      "Self-shipping option",
    ],
  },
  {
    minPrice: 100,
    maxPrice: 499,
    feePercentage: 40,
    label: "Standard Items",
    description: "Items valued $100-$499",
    features: [
      "Professional photography",
      "AI pricing optimization",
      "Standard shipping included",
    ],
  },
  {
    minPrice: 500,
    maxPrice: 999999,
    feePercentage: 35,
    label: "Premium Items",
    description: "Items valued $500+",
    features: [
      "Premium photography",
      "Expert pricing analysis",
      "Priority customer support",
    ],
  },
];

export default function PriceSlider() {
  const [price, setPrice] = useState(300); // Start at $300 as requested
  const [isDragging, setIsDragging] = useState(false);

  // Calculate which tier the current price falls into
  const getCurrentTier = useCallback((currentPrice: number): PricingTier => {
    return (
      pricingTiers.find(
        (tier) => currentPrice >= tier.minPrice && currentPrice <= tier.maxPrice
      ) || pricingTiers[1]
    ); // Default to Standard tier
  }, []);

  const currentTier = getCurrentTier(price);
  const sellerCut = price * (1 - currentTier.feePercentage / 100);
  const conciergeFee = price * (currentTier.feePercentage / 100);

  // Calculate slider position (0-100%) for $50-$550 range
  const sliderPosition = ((price - 50) / (550 - 50)) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Price Display */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-treasure-500 mb-2">
          ${price.toLocaleString()}
        </div>
        <p className="text-lg sm:text-xl text-gray-700">Item Value</p>
      </div>

      {/* Interactive Slider */}
      <div className="mb-12">
        <div className="relative">
          {/* Slider Track */}
          <div className="h-4 bg-gray-200 rounded-full relative shadow-inner">
            {/* Filled portion */}
            <div
              className="h-full bg-gradient-to-r from-treasure-500 to-treasure-400 rounded-full transition-all duration-200 ease-out shadow-sm"
              style={{
                width: `${Math.max(0, Math.min(100, sliderPosition))}%`,
              }}
            />

            {/* Price markers */}
            <div className="absolute top-0 left-0 w-full h-full">
              {/* $100 marker */}
              <div className="absolute top-0" style={{ left: "10%" }}>
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-2 -translate-y-0.5">
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                    $100
                  </div>
                </div>
              </div>

              {/* $300 marker (center) */}
              <div className="absolute top-0 left-1/2 w-4 h-4 bg-treasure-500 border-2 border-treasure-500 rounded-full transform -translate-x-2 -translate-y-0.5">
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                  $300
                </div>
              </div>

              {/* $500 marker */}
              <div className="absolute top-0" style={{ left: "90%" }}>
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-2 -translate-y-0.5">
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                    $500
                  </div>
                </div>
              </div>
            </div>

            {/* Slider thumb */}
            <input
              type="range"
              min="50"
              max="550"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
              step="1"
            />

            {/* Custom thumb */}
            <div
              className={`absolute top-0 w-8 h-8 bg-treasure-500 border-4 border-white rounded-full shadow-lg transform -translate-x-4 -translate-y-2 transition-all duration-200 ease-out hover:scale-110 ${
                isDragging ? "scale-125 shadow-xl" : ""
              }`}
              style={{ left: `${Math.max(0, Math.min(100, sliderPosition))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Seller's Cut */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Seller's Cut
          </h3>
          <div className="text-5xl font-bold text-green-600 mb-2">
            ${sellerCut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="text-gray-700">
            You keep {((1 - currentTier.feePercentage / 100) * 100).toFixed(0)}%
            of the sale
          </p>
        </div>

        {/* Service Fee */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:bg-white transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Service Fee
              </h3>
              <div className="text-4xl sm:text-5xl font-bold text-treasure-500 mb-2">
                $
                {conciergeFee.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-gray-700">
                {currentTier.feePercentage}% all-inclusive fee
              </p>
            </div>

            {/* Service Fee Breakdown Chart */}
            <div className="ml-6">
              <ServiceFeeBreakdown
                price={price}
                totalFeePercentage={currentTier.feePercentage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
