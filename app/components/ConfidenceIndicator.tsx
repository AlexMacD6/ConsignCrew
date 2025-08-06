"use client";

import { useState } from "react";
import { Info, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import {
  ConfidenceLevel,
  getConfidenceColor,
  getConfidenceIcon,
  getConfidenceLabel,
} from "@/lib/ai-confidence-scorer";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  reasoning?: string;
  factors?: string[];
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ConfidenceIndicator({
  level,
  reasoning,
  factors = [],
  showTooltip = true,
  size = "md",
  className = "",
}: ConfidenceIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getIconComponent = () => {
    switch (level) {
      case "high":
        return <CheckCircle className="w-4 h-4" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4" />;
      case "low":
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1";
      case "lg":
        return "text-sm px-3 py-2";
      default:
        return "text-sm px-2 py-1";
    }
  };

  const confidenceColors = getConfidenceColor(level);
  const sizeClasses = getSizeClasses();

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`inline-flex items-center gap-1 rounded-full border ${confidenceColors} ${sizeClasses} cursor-pointer transition-all hover:scale-105`}
        onClick={() => showTooltip && setShowDetails(!showDetails)}
        title={showTooltip ? "Click for details" : undefined}
      >
        {getIconComponent()}
        <span className="font-medium">{getConfidenceLabel(level)}</span>
        {showTooltip && <Info className="w-3 h-3 opacity-60" />}
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Confidence Analysis</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {reasoning && (
            <div className="mb-3">
              <p className="text-gray-700 mb-1">
                <strong>Reasoning:</strong>
              </p>
              <p className="text-gray-600">{reasoning}</p>
            </div>
          )}

          {factors.length > 0 && (
            <div>
              <p className="text-gray-700 mb-1">
                <strong>Factors Considered:</strong>
              </p>
              <ul className="text-gray-600 space-y-1">
                {factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence level explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Confidence Levels:</strong>
              <br />
              <span className="text-green-600">High (75-100%):</span> Very
              reliable based on clear visual evidence
              <br />
              <span className="text-yellow-600">Medium (50-74%):</span>{" "}
              Reasonably reliable with some uncertainty
              <br />
              <span className="text-red-600">Low (0-49%):</span> Limited
              confidence due to insufficient data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function ConfidenceBadge({
  level,
  className = "",
}: {
  level: ConfidenceLevel;
  className?: string;
}) {
  const confidenceColors = getConfidenceColor(level);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${confidenceColors} ${className}`}
      title={getConfidenceLabel(level)}
    >
      {getConfidenceIcon(level)}
    </span>
  );
}

// Summary component for showing overall confidence
interface ConfidenceSummaryProps {
  confidenceData: Record<string, { level: ConfidenceLevel; score: number }>;
  className?: string;
}

export function ConfidenceSummary({
  confidenceData,
  className = "",
}: ConfidenceSummaryProps) {
  const fields = Object.keys(confidenceData);
  const highConfidence = fields.filter(
    (field) => confidenceData[field].level === "high"
  ).length;
  const mediumConfidence = fields.filter(
    (field) => confidenceData[field].level === "medium"
  ).length;
  const lowConfidence = fields.filter(
    (field) => confidenceData[field].level === "low"
  ).length;

  const averageScore =
    fields.length > 0
      ? fields.reduce((sum, field) => sum + confidenceData[field].score, 0) /
        fields.length
      : 0;

  const overallLevel: ConfidenceLevel =
    averageScore >= 75 ? "high" : averageScore >= 50 ? "medium" : "low";

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <h4 className="font-semibold text-gray-900 mb-3">
        AI Confidence Summary
      </h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {highConfidence}
          </div>
          <div className="text-sm text-gray-600">High Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {mediumConfidence}
          </div>
          <div className="text-sm text-gray-600">Medium Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{lowConfidence}</div>
          <div className="text-sm text-gray-600">Low Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(averageScore)}%
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Overall Confidence:</span>
        <ConfidenceIndicator level={overallLevel} showTooltip={false} />
      </div>
    </div>
  );
}
