"use client";

import React, { useState } from "react";

const buyerPainPoints = [
  "Seller never responds",
  "Item already sold",
  "Won't accept my offer",
  "Can't meet when I'm free",
  "Photos don't show damage",
  "Price keeps changing",
  "Meeting location is sketchy",
  "Item not as described",
];

export default function BuyerPainPointsSection() {
  const [clickedPoints, setClickedPoints] = useState<Set<number>>(new Set());

  const handlePointClick = (index: number) => {
    if (clickedPoints.has(index)) return;

    // Add to clicked points
    setClickedPoints((prev) => new Set([...prev, index]));
  };

  return (
    <section className="py-16 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            No More Buyer Frustrations
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            With TreasureHub, these frustrating buying experiences are
            eliminated.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {buyerPainPoints.map((point, index) => (
            <div
              key={index}
              className={`relative cursor-pointer transition-all duration-500 ${
                clickedPoints.has(index)
                  ? "pointer-events-none"
                  : "hover:scale-105 hover:bg-red-500/30"
              }`}
              onClick={() => handlePointClick(index)}
            >
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg p-4 text-center min-h-[100px] flex items-center justify-center relative overflow-hidden">
                <span
                  className={`text-red-300 text-base md:text-lg font-medium transition-all duration-500 ${
                    clickedPoints.has(index) ? "opacity-20" : ""
                  }`}
                >
                  {point}
                </span>

                {/* Big X overlay when clicked */}
                {clickedPoints.has(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 backdrop-blur-sm">
                    <div className="text-white text-4xl md:text-6xl font-bold animate-pulse">
                      ✕
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
