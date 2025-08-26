"use client";
import React from "react";

interface TreasureDetectionProps {
  isTreasure: boolean;
  setIsTreasure: (value: boolean) => void;
  treasureReason: string;
  setTreasureReason: (value: string) => void;
  comprehensiveListing?: {
    isTreasure?: boolean;
    treasureReason?: string;
  } | null;
}

export default function TreasureDetection({
  isTreasure,
  setIsTreasure,
  treasureReason,
  setTreasureReason,
  comprehensiveListing,
}: TreasureDetectionProps) {
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
        Treasure Detection
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Mark items as "Treasures" for one-of-a-kind, vintage, or collector
        pieces that don't have standard retail pricing.
      </p>

      <div className="space-y-6">
        {/* Is Treasure Toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTreasure}
              onChange={(e) => setIsTreasure(e.target.checked)}
              className="w-4 h-4 text-[#D4AF3D] border-gray-300 rounded focus:ring-[#D4AF3D]"
            />
            <span className="text-sm font-medium text-gray-700">
              This is a Treasure (one-of-a-kind, vintage, or collector piece)
            </span>
          </label>
          {comprehensiveListing?.isTreasure && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              AI Detected
            </span>
          )}
        </div>

        {/* Treasure Reason */}
        {isTreasure && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treasure Reason
            </label>
            <textarea
              value={treasureReason}
              onChange={(e) => setTreasureReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              rows={3}
              placeholder="Explain why this is a treasure (e.g., 'Vintage 1980s design', 'Discontinued model', 'One-of-a-kind piece')"
            />
            {comprehensiveListing?.treasureReason && !treasureReason && (
              <p className="text-xs text-gray-500 mt-1">
                AI suggestion: {comprehensiveListing.treasureReason}
              </p>
            )}
          </div>
        )}

        {/* Treasure Info */}
        {isTreasure && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 mb-1">
                  What makes this a treasure?
                </h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Treasures bypass standard pricing algorithms and get featured
                  placement. They're perfect for antiques, collectibles, art
                  pieces, limited editions, or items with unique historical
                  significance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
