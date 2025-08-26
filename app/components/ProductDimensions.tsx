"use client";
import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceIndicator";

interface ProductDimensionsProps {
  height: string;
  setHeight: (value: string) => void;
  width: string;
  setWidth: (value: string) => void;
  depth: string;
  setDepth: (value: string) => void;
  dimensionsConfirmed: boolean;
  setDimensionsConfirmed: (value: boolean) => void;
  confidenceScores?: {
    height?: { level: string };
    width?: { level: string };
    depth?: { level: string };
  };
}

export default function ProductDimensions({
  height,
  setHeight,
  width,
  setWidth,
  depth,
  setDepth,
  dimensionsConfirmed,
  setDimensionsConfirmed,
  confidenceScores,
}: ProductDimensionsProps) {
  const clearDimensions = () => {
    setHeight("");
    setWidth("");
    setDepth("");
  };

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        Product Dimensions (inches)
        {(confidenceScores?.height ||
          confidenceScores?.width ||
          confidenceScores?.depth) && (
          <div className="flex gap-1">
            {confidenceScores?.height && (
              <ConfidenceBadge level={confidenceScores.height.level} />
            )}
            {confidenceScores?.width && (
              <ConfidenceBadge level={confidenceScores.width.level} />
            )}
            {confidenceScores?.depth && (
              <ConfidenceBadge level={confidenceScores.depth.level} />
            )}
          </div>
        )}
      </label>
      <div className="grid grid-cols-3 gap-3">
        {/* Height */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Height
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="H"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Width
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="W"
          />
        </div>

        {/* Depth */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Depth
          </label>
          <input
            type="number"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            placeholder="D"
          />
        </div>
      </div>

      {/* Dimensions Summary */}
      {(height || width || depth) && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Dimensions:</span>{" "}
            {height ? `${height}"` : "—"} H × {width ? `${width}"` : "—"} W ×{" "}
            {depth ? `${depth}"` : "—"} D
          </p>
        </div>
      )}

      {/* Dimensions Confirmation */}
      {(height || width || depth) && !dimensionsConfirmed && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                Verify Dimensions
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please verify these dimensions are accurate. AI estimates may
                not be precise.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDimensionsConfirmed(true)}
                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                >
                  Confirm Accurate
                </button>
                <button
                  type="button"
                  onClick={clearDimensions}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  Clear & Measure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Dimensions */}
      {dimensionsConfirmed && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Dimensions verified as accurate
            </span>
            <button
              type="button"
              onClick={() => setDimensionsConfirmed(false)}
              className="ml-auto text-xs text-green-600 hover:text-green-800 underline"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
