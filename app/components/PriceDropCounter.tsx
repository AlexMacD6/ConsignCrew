"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { TrendingDown, Clock } from "lucide-react";

interface PriceDropCounterProps {
  listingId: string;
}

interface PriceDropInfo {
  hasPriceDrop: boolean;
  timeUntilNextDrop?: string;
  nextDropPrice?: number;
  currentPrice?: number;
  originalPrice?: number;
  reservePrice?: number;
  scheduleType?: string;
  nextDropPercentage?: number;
  message?: string;
}

export default function PriceDropCounter({ listingId }: PriceDropCounterProps) {
  const [priceDropInfo, setPriceDropInfo] = useState<PriceDropInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const isRefreshing = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch price drop information
  const fetchPriceDropInfo = useCallback(
    async (showLoading = true) => {
      // Prevent multiple simultaneous requests
      if (isRefreshing.current) {
        return;
      }

      try {
        isRefreshing.current = true;
        if (showLoading) {
          setLoading(true);
        }
        const response = await fetch(
          `/api/listings/${listingId}/next-price-drop`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch price drop info");
        }

        const data = await response.json();

        if (data.success) {
          setPriceDropInfo(data);
          setError(null); // Clear any previous errors
        } else {
          throw new Error(data.error || "Failed to fetch price drop info");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        isRefreshing.current = false;
      }
    },
    [listingId]
  );

  // Parse time string and convert to countdown
  const parseTimeString = (timeString: string): number => {
    // Handle new day-based format
    if (timeString.includes("days")) {
      const days = parseInt(timeString.split(" ")[0]);
      return days * 24 * 60; // Convert days to minutes
    }

    // Handle "1 day" format
    if (timeString === "1 day") {
      return 24 * 60; // 1 day in minutes
    }

    // Handle "Any moment now..." format
    if (timeString === "Any moment now...") {
      return 0;
    }

    // Fallback for old hourly format (if any)
    const parts = timeString.split(" ");
    let totalMinutes = 0;

    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i]);
      const unit = parts[i + 1];

      if (unit === "h") {
        totalMinutes += value * 60;
      } else if (unit === "m") {
        totalMinutes += value;
      }
    }

    return totalMinutes;
  };

  // Update countdown timer
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!priceDropInfo?.hasPriceDrop || !priceDropInfo.timeUntilNextDrop) {
      return;
    }

    // If it's already "Any moment now...", don't start a countdown
    if (priceDropInfo.timeUntilNextDrop === "Any moment now...") {
      setTimeRemaining("Any moment now...");
      // Only refresh once after a longer delay to avoid excessive API calls
      if (!refreshTimeoutRef.current) {
        refreshTimeoutRef.current = setTimeout(() => {
          fetchPriceDropInfo(false);
          refreshTimeoutRef.current = null;
        }, 45000); // Refresh after 45 seconds instead of 30 seconds
      }
      return;
    }

    const totalMinutes = parseTimeString(priceDropInfo.timeUntilNextDrop);
    const now = new Date();
    const nextDropTime = new Date(now.getTime() + totalMinutes * 60 * 1000);

    const updateCountdown = () => {
      const currentTime = new Date();
      const diff = nextDropTime.getTime() - currentTime.getTime();

      if (diff <= 0) {
        setTimeRemaining("Any moment now...");
        // Only refresh once after the countdown reaches zero
        if (!refreshTimeoutRef.current) {
          refreshTimeoutRef.current = setTimeout(() => {
            fetchPriceDropInfo(false);
            refreshTimeoutRef.current = null;
          }, 45000); // Refresh after 45 seconds instead of 30 seconds
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let timeString = "";
      if (days > 0) {
        timeString += `${days}d `;
      }
      if (hours > 0 || days > 0) {
        timeString += `${hours.toString().padStart(2, "0")}h `;
      }
      timeString += `${minutes.toString().padStart(2, "0")}m`;

      setTimeRemaining(timeString);
    };

    // Initial update
    updateCountdown();

    // Set up interval - use a longer interval for day-based countdowns
    const interval = totalMinutes > 1440 ? 60000 : 1000; // 1 minute for day-based, 1 second for hour-based
    countdownIntervalRef.current = setInterval(updateCountdown, interval);

    // Cleanup function
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [
    priceDropInfo?.hasPriceDrop,
    priceDropInfo?.timeUntilNextDrop,
    fetchPriceDropInfo,
  ]);

  // Initial fetch
  useEffect(() => {
    if (listingId) {
      fetchPriceDropInfo();
    }
  }, [listingId, fetchPriceDropInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  if (loading && !priceDropInfo) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D4AF3D] mr-2"></div>
        <span className="text-sm text-gray-500">
          Loading price drop info...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <span className="text-sm">Failed to load price drop info</span>
      </div>
    );
  }

  if (!priceDropInfo?.hasPriceDrop) {
    return null; // Don't show anything if no price drop is configured or available
  }

  return (
    <div className="flex items-start space-x-3">
      {/* Timeline dot */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-600 bg-red-50">
        <TrendingDown className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Next Price Drop</h4>
          <div className="flex items-center text-xs text-red-600 font-medium">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Price will drop to{" "}
          <span className="font-medium text-red-600">
            ${priceDropInfo.nextDropPrice?.toFixed(2)}
          </span>
          {priceDropInfo.scheduleType && (
            <span className="text-gray-500">
              {" "}
              ({priceDropInfo.scheduleType} schedule)
            </span>
          )}
        </p>

        {/* Progress indicator */}
        {priceDropInfo.currentPrice && priceDropInfo.originalPrice && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Original: ${priceDropInfo.originalPrice.toFixed(2)}</span>
              <span>Current: ${priceDropInfo.currentPrice.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-red-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((priceDropInfo.originalPrice -
                        priceDropInfo.currentPrice) /
                        (priceDropInfo.originalPrice -
                          (priceDropInfo.reservePrice || 0))) *
                        100
                    )
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
