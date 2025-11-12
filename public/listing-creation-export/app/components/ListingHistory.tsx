"use client";
import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  User,
  MapPin,
  Edit,
  Eye,
  Star,
  Tag,
  Calendar,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  Truck,
  Home,
} from "lucide-react";
import PriceDropCounter from "./PriceDropCounter";

interface HistoryEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

interface ListingHistoryProps {
  listingId: string;
  createdAt?: string;
  discountSchedule?: any;
  currentPrice?: number;
  originalPrice?: number;
  reservePrice?: number;
  status?: string;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "created":
      return <Package className="h-4 w-4" />;
    case "status_changed":
      return <CheckCircle className="h-4 w-4" />;
    case "price_changed":
      return <DollarSign className="h-4 w-4" />;
    case "sold":
      return <ShoppingCart className="h-4 w-4" />;
    case "in_transit":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <Home className="h-4 w-4" />;
    case "viewed":
      return <Eye className="h-4 w-4" />;
    case "edited":
      return <Edit className="h-4 w-4" />;
    case "reviewed":
      return <Star className="h-4 w-4" />;
    case "location_changed":
      return <MapPin className="h-4 w-4" />;
    case "condition_changed":
      return <Tag className="h-4 w-4" />;
    case "price_drop":
      return <TrendingDown className="h-4 w-4" />;
    case "price_increase":
      return <TrendingUp className="h-4 w-4" />;
    case "reserve_met":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "created":
      return "text-blue-600 bg-blue-50";
    case "status_changed":
      return "text-green-600 bg-green-50";
    case "price_changed":
      return "text-purple-600 bg-purple-50";
    case "sold":
      return "text-green-600 bg-green-50";
    case "in_transit":
      return "text-blue-600 bg-blue-50";
    case "delivered":
      return "text-green-600 bg-green-50";
    case "viewed":
      return "text-gray-600 bg-gray-50";
    case "edited":
      return "text-orange-600 bg-orange-50";
    case "reviewed":
      return "text-yellow-600 bg-yellow-50";
    case "location_changed":
      return "text-indigo-600 bg-indigo-50";
    case "condition_changed":
      return "text-pink-600 bg-pink-50";
    case "price_drop":
      return "text-red-600 bg-red-50";
    case "price_increase":
      return "text-green-600 bg-green-50";
    case "reserve_met":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  // Always show the full date and time
  const fullDateTime = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Also show relative time for recent events
  if (diffInHours < 1) {
    return `${fullDateTime} (Just now)`;
  } else if (diffInHours < 24) {
    return `${fullDateTime} (${diffInHours} hour${
      diffInHours > 1 ? "s" : ""
    } ago)`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${fullDateTime} (${diffInDays} day${
        diffInDays > 1 ? "s" : ""
      } ago)`;
    } else {
      return fullDateTime;
    }
  }
};

export default function ListingHistory({
  listingId,
  createdAt,
  discountSchedule,
  currentPrice,
  originalPrice,
  reservePrice,
  status,
}: ListingHistoryProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/listings/${listingId}/history`);

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await response.json();

        if (data.success) {
          setHistory(data.history);
        } else {
          throw new Error(data.error || "Failed to fetch history");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchHistory();
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load history</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No history events yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Price Drop Counter - shown at the top if there's an active price drop and item is not sold */}
          {status !== "sold" && (
            <PriceDropCounter
              listingId={listingId}
              createdAt={createdAt}
              discountSchedule={discountSchedule}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              reservePrice={reservePrice}
            />
          )}

          {history.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-3">
              {/* Timeline dot */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(
                  event.eventType
                )}`}
              >
                {getEventIcon(event.eventType)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {event.eventTitle}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {event.description}
                </p>

                {/* Metadata display */}
                {event.metadata && (
                  <div className="mt-2 text-xs text-gray-500">
                    {event.metadata.old_value && event.metadata.new_value && (
                      <span>
                        Changed from{" "}
                        <span className="font-medium">
                          {event.metadata.old_value}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {event.metadata.new_value}
                        </span>
                      </span>
                    )}
                    {/* Removed user display for privacy - do not show who purchased */}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
