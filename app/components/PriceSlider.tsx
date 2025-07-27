"use client";

import React, { useState, useCallback } from "react";

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
    feePercentage: 40,
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
    feePercentage: 35,
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
    feePercentage: 30,
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
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-consigncrew-gold mb-2">
          ${price.toLocaleString()}
        </div>
        <p className="text-xl text-gray-700">Item Value</p>
      </div>

      {/* Interactive Slider */}
      <div className="mb-12">
        <div className="relative">
          {/* Slider Track */}
          <div className="h-4 bg-gray-200 rounded-full relative shadow-inner">
            {/* Filled portion */}
            <div
              className="h-full bg-gradient-to-r from-consigncrew-gold to-yellow-400 rounded-full transition-all duration-200 ease-out shadow-sm"
              style={{
                width: `${Math.max(0, Math.min(100, sliderPosition))}%`,
              }}
            />

            {/* Price markers */}
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Under $100 label (left side) */}
              <div className="absolute top-6 left-0 text-xs text-gray-600 font-medium">
                Under $100
              </div>

              {/* $100 marker */}
              <div className="absolute top-0" style={{ left: "10%" }}>
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-2 -translate-y-0.5">
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
                    $100
                  </div>
                </div>
              </div>

              {/* $300 marker (center) */}
              <div className="absolute top-0 left-1/2 w-4 h-4 bg-consigncrew-gold border-2 border-consigncrew-gold rounded-full transform -translate-x-2 -translate-y-0.5">
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

              {/* $500+ label (right side) */}
              <div className="absolute top-6 right-0 text-xs text-gray-600 font-medium">
                $500+
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
              className={`absolute top-0 w-8 h-8 bg-consigncrew-gold border-4 border-white rounded-full shadow-lg transform -translate-x-4 -translate-y-2 transition-all duration-200 ease-out hover:scale-110 ${
                isDragging ? "scale-125 shadow-xl" : ""
              }`}
              style={{ left: `${Math.max(0, Math.min(100, sliderPosition))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="grid md:grid-cols-2 gap-8">
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

        {/* ConsignCrew Service Fee */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 text-center hover:bg-white transition-all shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ConsignCrew Service Fee
          </h3>
          <div className="text-5xl font-bold text-consigncrew-gold mb-2">
            $
            {conciergeFee.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-gray-700">
            {currentTier.feePercentage}% all-inclusive fee
          </p>
        </div>
      </div>
    </div>
  );
}
