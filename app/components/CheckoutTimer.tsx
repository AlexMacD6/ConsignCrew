"use client";

import React from "react";
import { useCheckoutTimer } from "@/hooks/useCheckoutTimer";
import { Clock, AlertTriangle } from "lucide-react";

interface CheckoutTimerProps {
  expiresAt: Date | string | null;
  onExpired?: () => void;
  className?: string;
}

/**
 * Checkout countdown timer component
 * Similar to StubHub's checkout timer - shows time remaining to complete purchase
 */
export function CheckoutTimer({
  expiresAt,
  onExpired,
  className = "",
}: CheckoutTimerProps) {
  const { minutes, seconds, isExpired, timeString } = useCheckoutTimer({
    expiresAt,
    onExpired,
  });

  if (!expiresAt) {
    return null;
  }

  if (isExpired) {
    return (
      <div
        className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}
      >
        <AlertTriangle className="w-5 h-5" />
        <div>
          <div className="font-semibold">Time Expired</div>
          <div className="text-sm">
            This checkout session has expired. Please try again.
          </div>
        </div>
      </div>
    );
  }

  // Show warning when less than 5 minutes remaining
  const isWarning = minutes < 5;
  const bgColor = isWarning
    ? "bg-amber-50 border-amber-200"
    : "bg-blue-50 border-blue-200";
  const textColor = isWarning ? "text-amber-700" : "text-blue-700";

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg ${bgColor} ${textColor} ${className}`}
    >
      <Clock className="w-5 h-5" />
      <div className="flex-1">
        <div className="font-semibold">Time Remaining</div>
        <div className="text-sm">Complete your purchase within this time</div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold font-mono">{timeString}</div>
        <div className="text-xs">
          {isWarning ? "Hurry up!" : "minutes remaining"}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for use in smaller spaces
 */
export function CheckoutTimerCompact({
  expiresAt,
  onExpired,
  className = "",
}: CheckoutTimerProps) {
  const { isExpired, timeString } = useCheckoutTimer({
    expiresAt,
    onExpired,
  });

  if (!expiresAt || isExpired) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm ${className}`}
    >
      <Clock className="w-4 h-4" />
      <span className="font-mono font-semibold">{timeString}</span>
    </div>
  );
}
