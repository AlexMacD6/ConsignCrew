"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface EarlyAccessTrackerProps {
  refreshTrigger?: number;
}

export default function EarlyAccessTracker({
  refreshTrigger = 0,
}: EarlyAccessTrackerProps) {
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleSignup = () => {
      fetchStats();
    };

    window.addEventListener("earlyAccessSignup", handleSignup);
    return () => {
      window.removeEventListener("earlyAccessSignup", handleSignup);
    };
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/early-access-stats");
      const data = await response.json();

      if (response.ok) {
        setRemainingSpots(data.remainingSpots);
      } else {
        setError("Failed to load stats");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-treasure-500/10 to-treasure-600/10 border border-treasure-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-treasure-500 mr-2"></div>
          <span className="text-sm text-gray-600">
            Loading early access info...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-treasure-500/10 to-treasure-600/10 border border-treasure-500/20 rounded-lg p-4 mb-6">
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Free delivery available for first 200 signups
          </span>
        </div>
      </div>
    );
  }

  const isLimited = remainingSpots !== null && remainingSpots <= 50;
  const isCritical = remainingSpots !== null && remainingSpots <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-treasure-500/10 to-treasure-600/10 border border-treasure-500/20 rounded-lg p-4 mb-6 ${
        isCritical ? "animate-pulse" : ""
      }`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-900">
            🎉 First 200 Early Access Sign-up Get:
          </span>
          <span className="text-sm font-bold text-treasure-600">
            Free Delivery for the First Month
          </span>
        </div>

        {remainingSpots !== null && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-600">
              {remainingSpots > 0 ? (
                <>
                  Only{" "}
                  <span
                    className={`font-semibold ${
                      isLimited ? "text-orange-600" : "text-treasure-600"
                    }`}
                  >
                    {remainingSpots}
                  </span>
                  {remainingSpots === 1 ? " Spot" : " Spots"} Remaining
                </>
              ) : (
                <span className="font-semibold text-gray-500">
                  Early access spots filled
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
