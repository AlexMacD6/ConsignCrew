"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { TrendingDown, Clock } from "lucide-react";

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

interface PriceDropCounterProps {
  listingId: string;
  createdAt?: string; // Add creation date for client-side calculation
  discountSchedule?: any; // Add discount schedule
  currentPrice?: number; // Current sales price (calculated from discount schedule)
  originalPrice?: number; // Original list price (what seller originally asked for)
  reservePrice?: number; // Reserve price
}

export default function PriceDropCounter({
  listingId,
  createdAt,
  discountSchedule,
  currentPrice,
  originalPrice,
  reservePrice,
}: PriceDropCounterProps) {
  const [priceDropInfo, setPriceDropInfo] = useState<PriceDropInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [useClientSideCountdown, setUseClientSideCountdown] = useState(false);
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

  // Client-side discount schedule logic
  const DISCOUNT_SCHEDULES: Record<string, any> = {
    "Turbo-30": {
      type: "Turbo-30",
      dropIntervals: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30],
      dropPercentages: [100, 95, 90, 85, 80, 75, 70, 65, 60, 0],
      totalDuration: 30,
    },
    "Classic-60": {
      type: "Classic-60",
      dropIntervals: [0, 7, 14, 21, 28, 35, 42, 49, 56, 60],
      dropPercentages: [100, 90, 80, 75, 70, 65, 60, 55, 50, 0],
      totalDuration: 60,
    },
  };

  // Calculate current sales price based on discount schedule and listing duration
  const calculateCurrentSalesPrice = useCallback(() => {
    if (!createdAt || !discountSchedule || !originalPrice) return null;

    const scheduleType = discountSchedule?.type || "Classic-60";
    const schedule = DISCOUNT_SCHEDULES[scheduleType];
    if (!schedule) return null;

    const now = new Date();
    const created = new Date(createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If listing has expired, return reserve price or 0
    if (daysSinceCreation >= schedule.totalDuration) {
      return reservePrice || 0;
    }

    // Find the current applicable discount percentage
    let currentPercentage = 100; // Start at 100% (full price)

    for (let i = 0; i < schedule.dropIntervals.length; i++) {
      if (daysSinceCreation >= schedule.dropIntervals[i]) {
        currentPercentage = schedule.dropPercentages[i];
      } else {
        break; // Found the current applicable percentage
      }
    }

    // Calculate current sales price based on original list price and current percentage
    const currentSalesPrice =
      Math.round(originalPrice * (currentPercentage / 100) * 100) / 100;

    // Don't go below reserve price
    if (reservePrice && currentSalesPrice < reservePrice) {
      return reservePrice;
    }

    return currentSalesPrice;
  }, [createdAt, discountSchedule, originalPrice, reservePrice]);

  // Calculate next drop info client-side
  const calculateClientSideCountdown = useCallback(() => {
    if (!createdAt || !discountSchedule || !originalPrice) return null;

    const scheduleType = discountSchedule?.type || "Classic-60";
    const schedule = DISCOUNT_SCHEDULES[scheduleType];

    if (!schedule) return null;

    const now = new Date();
    const created = new Date(createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If listing has expired, no more drops
    if (daysSinceCreation >= schedule.totalDuration) {
      return null;
    }

    // Find the next drop
    for (let i = 0; i < schedule.dropIntervals.length; i++) {
      if (schedule.dropIntervals[i] > daysSinceCreation) {
        const nextDropDay = schedule.dropIntervals[i];
        const nextDropTime = new Date(
          created.getTime() + nextDropDay * 24 * 60 * 60 * 1000
        );
        const timeUntilDrop = nextDropTime.getTime() - now.getTime();

        if (timeUntilDrop <= 0) {
          return { timeString: "Any moment now...", nextDropTime };
        }

        const days = Math.floor(timeUntilDrop / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeUntilDrop % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeUntilDrop % (1000 * 60 * 60)) / (1000 * 60)
        );

        let timeString = "";
        if (days > 0) {
          timeString += `${days}d `;
        }
        if (hours > 0 || days > 0) {
          timeString += `${hours.toString().padStart(2, "0")}h `;
        }
        timeString += `${minutes.toString().padStart(2, "0")}m`;

        return { timeString: timeString.trim(), nextDropTime };
      }
    }

    return null;
  }, [createdAt, discountSchedule, originalPrice]);

  // Parse time string and convert to countdown (fallback for API mode)
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

  // Determine if we should use client-side countdown
  useEffect(() => {
    // If we have creation date and discount schedule, use client-side calculation
    if (createdAt && discountSchedule) {
      setUseClientSideCountdown(true);
      setLoading(false);
    } else {
      // Fall back to API-based approach
      setUseClientSideCountdown(false);
      if (listingId) {
        fetchPriceDropInfo();
      }
    }
  }, [createdAt, discountSchedule, listingId, fetchPriceDropInfo]);

  // Update countdown timer
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const updateCountdown = () => {
      if (useClientSideCountdown) {
        // Client-side calculation - NO API calls needed!
        const countdownInfo = calculateClientSideCountdown();
        if (!countdownInfo) {
          setTimeRemaining("");
          return;
        }
        setTimeRemaining(countdownInfo.timeString);
      } else {
        // API-based fallback
        if (!priceDropInfo?.hasPriceDrop || !priceDropInfo.timeUntilNextDrop) {
          return;
        }

        // If it's already "Any moment now...", don't start a countdown
        if (priceDropInfo.timeUntilNextDrop === "Any moment now...") {
          setTimeRemaining("Any moment now...");
          // Only refresh once after countdown expires to check for actual price drop
          if (!refreshTimeoutRef.current) {
            refreshTimeoutRef.current = setTimeout(() => {
              fetchPriceDropInfo(false);
              refreshTimeoutRef.current = null;
            }, 300000); // Refresh after 5 minutes instead of 45 seconds
          }
          return;
        }

        const totalMinutes = parseTimeString(priceDropInfo.timeUntilNextDrop);
        const now = new Date();
        const nextDropTime = new Date(now.getTime() + totalMinutes * 60 * 1000);
        const currentTime = new Date();
        const diff = nextDropTime.getTime() - currentTime.getTime();

        if (diff <= 0) {
          setTimeRemaining("Any moment now...");
          // Only refresh once after the countdown reaches zero
          if (!refreshTimeoutRef.current) {
            refreshTimeoutRef.current = setTimeout(() => {
              fetchPriceDropInfo(false);
              refreshTimeoutRef.current = null;
            }, 300000); // Refresh after 5 minutes instead of 45 seconds
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

        setTimeRemaining(timeString.trim());
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval - 1 minute updates are sufficient for day-based countdowns
    countdownIntervalRef.current = setInterval(updateCountdown, 60000); // Update every minute

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
    useClientSideCountdown,
    calculateClientSideCountdown,
    priceDropInfo?.hasPriceDrop,
    priceDropInfo?.timeUntilNextDrop,
    fetchPriceDropInfo,
  ]);

  // This is now handled in the determination useEffect above

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

  // For client-side mode, check if there's an active countdown
  if (useClientSideCountdown) {
    // If no countdown data or empty time remaining, don't show
    if (!timeRemaining) {
      return null;
    }

    // Calculate current sales price and next drop price
    const currentSalesPrice = calculateCurrentSalesPrice();
    const getNextDropPrice = () => {
      if (!createdAt || !discountSchedule || !originalPrice) return null;

      const scheduleType = discountSchedule?.type || "Classic-60";
      const schedule = DISCOUNT_SCHEDULES[scheduleType];
      if (!schedule) return null;

      const now = new Date();
      const created = new Date(createdAt);
      const daysSinceCreation = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find the next drop percentage and calculate actual price
      for (let i = 0; i < schedule.dropIntervals.length; i++) {
        if (schedule.dropIntervals[i] > daysSinceCreation) {
          const nextDropPercentage = schedule.dropPercentages[i];

          // Calculate actual dollar amount based on ORIGINAL LIST PRICE and schedule percentage
          const nextDropDollarAmount =
            Math.round(originalPrice * (nextDropPercentage / 100) * 100) / 100;

          // Don't go below reserve price
          const finalPrice = reservePrice
            ? Math.max(nextDropDollarAmount, reservePrice)
            : nextDropDollarAmount;

          return finalPrice;
        }
      }
      return null;
    };

    const nextDropPrice = getNextDropPrice();

    return (
      <div className="flex items-start space-x-3">
        {/* Timeline dot */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-600 bg-red-50">
          <TrendingDown className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Next Price Drop
            </h4>
            <div className="flex items-center text-xs text-red-600 font-medium">
              <Clock className="h-3 w-3 mr-1" />
              {timeRemaining}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {nextDropPrice && currentSalesPrice ? (
              <>
                Next scheduled price:{" "}
                <span className="font-medium text-blue-600">
                  ${nextDropPrice.toFixed(2)}
                </span>
                <span className="text-gray-500 ml-1">
                  (current sales price: ${currentSalesPrice.toFixed(2)})
                </span>
              </>
            ) : (
              "Next price drop scheduled"
            )}
          </p>
          {currentSalesPrice &&
          originalPrice &&
          currentSalesPrice < originalPrice ? (
            <p className="text-xs text-gray-500 mt-1">
              <span className="line-through">
                List price: ${originalPrice.toFixed(2)}
              </span>{" "}
              |
              <span className="font-medium text-green-600">
                {" "}
                Current sales price: ${currentSalesPrice.toFixed(2)}
              </span>
            </p>
          ) : currentSalesPrice && originalPrice ? (
            <p className="text-xs text-gray-500 mt-1">
              List price: ${originalPrice.toFixed(2)} | Current sales price: $
              {currentSalesPrice.toFixed(2)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // For API mode, check if there's price drop info
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
          {priceDropInfo.nextDropPrice && priceDropInfo.currentPrice ? (
            priceDropInfo.nextDropPrice < priceDropInfo.currentPrice ? (
              <>
                Price will drop to{" "}
                <span className="font-medium text-red-600">
                  ${priceDropInfo.nextDropPrice.toFixed(2)}
                </span>
                <span className="text-gray-500 ml-1">
                  (from ${priceDropInfo.currentPrice.toFixed(2)})
                </span>
              </>
            ) : (
              <>
                Next scheduled price:{" "}
                <span className="font-medium text-blue-600">
                  ${priceDropInfo.nextDropPrice.toFixed(2)}
                </span>
                <span className="text-gray-500 ml-1">
                  (current: ${priceDropInfo.currentPrice.toFixed(2)})
                </span>
              </>
            )
          ) : (
            "Next price drop scheduled"
          )}
        </p>
      </div>
    </div>
  );
}
