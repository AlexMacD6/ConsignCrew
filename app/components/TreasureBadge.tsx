"use client";
import React from "react";
import { Sparkles } from "lucide-react";

interface TreasureBadgeProps {
  isTreasure: boolean;
  treasureReason?: string | null;
  className?: string;
  showReason?: boolean;
}

export default function TreasureBadge({
  isTreasure,
  treasureReason,
  className = "",
  showReason = false,
}: TreasureBadgeProps) {
  if (!isTreasure) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
        <Sparkles className="h-4 w-4" />
        <span>Treasure • One-of-a-Kind</span>
      </div>
      {showReason && treasureReason && (
        <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {treasureReason}
        </div>
      )}
    </div>
  );
}
