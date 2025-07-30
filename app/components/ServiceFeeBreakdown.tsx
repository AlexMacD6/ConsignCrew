"use client";

import React, { useState } from "react";

interface FeeComponent {
  name: string;
  description: string;
  color: string;
  percentages: {
    under100: number;
    under500: number;
    over500: number;
  };
}

const feeComponents: FeeComponent[] = [
  {
    name: "TreasureHub Re-Investment",
    description: "Platform development",
    color: "#0F766E", // Teal - secondary brand color, removing red connotation
    percentages: {
      under100: 12,
      under500: 12,
      over500: 12,
    },
  },
  {
    name: "Platform Ops & Support",
    description: "Servers, engineering, marketing",
    color: "#8B5CF6", // Purple - technology/platform color
    percentages: {
      under100: 6,
      under500: 6,
      over500: 5,
    },
  },
  {
    name: "Payment & Protection",
    description: "Card/ACH fees, fraud screening, damage/return pool",
    color: "#3B82F6", // Blue - trust/security color
    percentages: {
      under100: 7,
      under500: 6,
      over500: 6,
    },
  },
  {
    name: "Prep & Quality",
    description: "Cleaning, AI photos, authentication",
    color: "#10B981", // Green - success/quality color
    percentages: {
      under100: 5,
      under500: 5,
      over500: 7,
    },
  },
  {
    name: "Logistics",
    description: "Pickup, first/last-mile shipping, 14-day storage",
    color: "#F59E0B", // Amber - matches brand accent
    percentages: {
      under100: 20,
      under500: 11,
      over500: 5,
    },
  },
];

interface ServiceFeeBreakdownProps {
  price: number;
  totalFeePercentage: number;
}

export default function ServiceFeeBreakdown({
  price,
  totalFeePercentage,
}: ServiceFeeBreakdownProps) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  // Determine which tier the price falls into
  const getTierPercentages = (currentPrice: number) => {
    if (currentPrice < 100) {
      return "under100";
    } else if (currentPrice <= 500) {
      return "under500";
    } else {
      return "over500";
    }
  };

  const tier = getTierPercentages(price);
  const totalFeeAmount = price * (totalFeePercentage / 100);

  return (
    <div className="relative">
      {/* Vertical Stacked Bar Chart */}
      <div className="flex items-end justify-end h-24">
        <div className="w-8 bg-gray-200 rounded-t-lg overflow-hidden relative h-full">
          {feeComponents.map((component, index) => {
            const percentage =
              component.percentages[tier as keyof typeof component.percentages];
            const height = (percentage / totalFeePercentage) * 100;
            const bottomOffset = feeComponents
              .slice(0, index)
              .reduce(
                (acc, comp) =>
                  acc +
                  (comp.percentages[tier as keyof typeof comp.percentages] /
                    totalFeePercentage) *
                    100,
                0
              );

            return (
              <div
                key={component.name}
                className="absolute w-full transition-all duration-300 ease-out cursor-pointer hover:opacity-80"
                style={{
                  bottom: `${bottomOffset}%`,
                  height: `${height}%`,
                  backgroundColor: component.color,
                }}
                onMouseEnter={() => setHoveredComponent(component.name)}
                onMouseLeave={() => setHoveredComponent(null)}
                title={`${component.name}: ${percentage}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredComponent && (
        <div className="absolute bottom-full right-0 transform translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
          {(() => {
            const component = feeComponents.find(
              (c) => c.name === hoveredComponent
            );
            if (!component) return null;
            const percentage =
              component.percentages[tier as keyof typeof component.percentages];
            const amount = totalFeeAmount * (percentage / totalFeePercentage);
            return (
              <>
                <div className="font-semibold">{component.name}</div>
                <div className="text-gray-300">{component.description}</div>
                <div className="mt-1">
                  {percentage}% ($
                  {amount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  )
                </div>
              </>
            );
          })()}
          <div className="absolute top-full right-1/2 transform translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
