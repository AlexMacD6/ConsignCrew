"use client";
import React from "react";
import { AlertCircle } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceIndicator";
import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";

interface DeliveryCategoryProps {
  deliveryCategory: "NORMAL" | "BULK";
  setDeliveryCategory: (category: "NORMAL" | "BULK") => void;
  confidenceScores?: {
    deliveryCategory?: {
      level: ConfidenceLevel;
    };
  };
}

export default function DeliveryCategory({
  deliveryCategory,
  setDeliveryCategory,
  confidenceScores,
}: DeliveryCategoryProps) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        Delivery Category
        {confidenceScores?.deliveryCategory && (
          <ConfidenceBadge level={confidenceScores.deliveryCategory.level} />
        )}
      </label>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-gray-700">
            Bulk Item (Requires 2+ People to Lift)
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Items over 50lbs, large furniture, or requiring multiple people for
            safe handling
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={deliveryCategory === "BULK"}
            onChange={(e) =>
              setDeliveryCategory(e.target.checked ? "BULK" : "NORMAL")
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4AF3D]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF3D]"></div>
        </label>
      </div>
      {deliveryCategory === "BULK" && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Bulk Item Selected</p>
              <p>
                This item will have special delivery arrangements and higher
                delivery fees may apply.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
