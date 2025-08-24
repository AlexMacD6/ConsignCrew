"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Package,
  Truck,
  CheckCircle,
  User,
  MapPin,
  Phone,
  Settings,
  Plus,
  Minus,
  Eye,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DeliveryWindow {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  defaultCapacity: number;
  currentCapacity: number;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleType: string;
  isActive: boolean;
}

interface ScheduledDelivery {
  id: string;
  orderId: string;
  listingTitle: string;
  buyerName: string;
  buyerPhone?: string;
  deliveryAddress: string;
  estimatedDuration: number; // minutes
  priority: "standard" | "express" | "fragile";
  notes?: string;
}

interface DaySchedule {
  date: string;
  windows: {
    [windowId: string]: {
      capacity: number;
      deliveries: ScheduledDelivery[];
      assignedDrivers: string[];
    };
  };
}

const DEFAULT_WINDOWS: DeliveryWindow[] = [
  {
    id: "morning",
    label: "Morning Shift",
    startTime: "08:00",
    endTime: "12:00",
    defaultCapacity: 4,
    currentCapacity: 4,
  },
  {
    id: "afternoon",
    label: "Afternoon Shift",
    startTime: "12:00",
    endTime: "16:00",
    defaultCapacity: 4,
    currentCapacity: 4,
  },
  {
    id: "evening",
    label: "Evening Shift",
    startTime: "16:00",
    endTime: "20:00",
    defaultCapacity: 4,
    currentCapacity: 4,
  },
];

export default function DeliveryOperationsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [windows, setWindows] = useState<DeliveryWindow[]>(DEFAULT_WINDOWS);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] =
    useState<ScheduledDelivery | null>(null);

  useEffect(() => {
    fetchScheduleData();
    fetchDrivers();
  }, [selectedDate]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      // Fetch schedule data from the API
      const response = await fetch(
        `/api/admin/delivery-operations/schedule?date=${
          selectedDate.toISOString().split("T")[0]
        }`
      );
      const data = await response.json();

      if (data.success) {
        setSchedule(data.schedule);
      } else {
        console.error("Failed to fetch schedule:", data.error);
        // Set empty schedule on error
        setSchedule({
          date: selectedDate.toISOString().split("T")[0],
          windows: {
            morning: {
              capacity:
                windows.find((w) => w.id === "morning")?.currentCapacity || 4,
              deliveries: [],
              assignedDrivers: [],
            },
            afternoon: {
              capacity:
                windows.find((w) => w.id === "afternoon")?.currentCapacity || 4,
              deliveries: [],
              assignedDrivers: [],
            },
            evening: {
              capacity:
                windows.find((w) => w.id === "evening")?.currentCapacity || 4,
              deliveries: [],
              assignedDrivers: [],
            },
          },
        });
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      // Set empty schedule on error
      setSchedule({
        date: selectedDate.toISOString().split("T")[0],
        windows: {
          morning: {
            capacity:
              windows.find((w) => w.id === "morning")?.currentCapacity || 4,
            deliveries: [],
            assignedDrivers: [],
          },
          afternoon: {
            capacity:
              windows.find((w) => w.id === "afternoon")?.currentCapacity || 4,
            deliveries: [],
            assignedDrivers: [],
          },
          evening: {
            capacity:
              windows.find((w) => w.id === "evening")?.currentCapacity || 4,
            deliveries: [],
            assignedDrivers: [],
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      // Fetch drivers from the Review-to-Tip API
      const response = await fetch("/api/admin/drivers?activeOnly=false");
      const data = await response.json();

      if (data.success) {
        // Transform Review-to-Tip driver format to Delivery Operations format
        const transformedDrivers = data.drivers.map((driver: any) => ({
          id: driver.id,
          name: driver.fullName,
          email: driver.email || "No email provided",
          phone: driver.phone || "No phone provided",
          vehicleType: driver.vehicleType || "Not specified",
          isActive: driver.isActive,
        }));
        setDrivers(transformedDrivers);
      } else {
        console.error("Failed to fetch drivers:", data.error);
        setDrivers([]);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setDrivers([]);
    }
  };

  const adjustCapacity = async (windowId: string, change: number) => {
    const window = windows.find((w) => w.id === windowId);
    if (!window) return;

    const newCapacity = Math.max(
      1,
      Math.min(8, window.currentCapacity + change)
    );

    const updatedWindows = windows.map((w) =>
      w.id === windowId ? { ...w, currentCapacity: newCapacity } : w
    );

    setWindows(updatedWindows);

    // Update schedule capacity
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        windows: {
          ...schedule.windows,
          [windowId]: {
            ...schedule.windows[windowId],
            capacity: newCapacity,
          },
        },
      };
      setSchedule(updatedSchedule);
    }

    // Save to API
    try {
      const response = await fetch("/api/admin/delivery-operations/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowId,
          capacity: newCapacity,
          date: selectedDate.toISOString().split("T")[0],
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Failed to update capacity:", data.error);
        // You could show a user-friendly message here
      }
    } catch (error) {
      console.error("Error updating capacity:", error);
      // You could show a user-friendly error message here
    }
  };

  const getUtilizationPercentage = (windowId: string): number => {
    if (!schedule) return 0;
    const windowData = schedule.windows[windowId];
    if (!windowData) return 0;
    return Math.round(
      (windowData.deliveries.length / windowData.capacity) * 100
    );
  };

  const getUtilizationColor = (percentage: number): string => {
    if (percentage >= 100) return "bg-red-100 text-red-800";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "express":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "fragile":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "express":
        return "Express";
      case "fragile":
        return "Fragile";
      default:
        return "Standard";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                Delivery Operations
              </h1>
              <p className="text-gray-600 mt-1">
                Manage driver schedules and delivery capacity
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/review-to-tip"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                Manage Drivers
              </a>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedDate.toISOString().split("T")[0]}
              </p>
            </div>

            <button
              onClick={() => navigateDate("next")}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule
                      ? Object.values(schedule.windows).reduce(
                          (sum, w) => sum + w.deliveries.length,
                          0
                        )
                      : 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule
                      ? Object.values(schedule.windows).reduce(
                          (sum, w) => sum + w.capacity,
                          0
                        )
                      : 0}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {drivers.filter((d) => d.isActive).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule
                      ? Math.round(
                          Object.keys(schedule.windows).reduce(
                            (sum, windowId) =>
                              sum + getUtilizationPercentage(windowId),
                            0
                          ) / Object.keys(schedule.windows).length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Windows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {windows.map((window) => {
            const windowData = schedule?.windows[window.id];
            const utilization = getUtilizationPercentage(window.id);

            return (
              <div
                key={window.id}
                className="bg-white rounded-lg border shadow-sm"
              >
                {/* Window Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {window.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {window.startTime} - {window.endTime}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Capacity Controls */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      Delivery Capacity
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustCapacity(window.id, -1)}
                        disabled={window.currentCapacity <= 1}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {window.currentCapacity}
                      </span>
                      <button
                        onClick={() => adjustCapacity(window.id, 1)}
                        disabled={window.currentCapacity >= 8}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Utilization</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(
                        utilization
                      )}`}
                    >
                      {utilization}% ({windowData?.deliveries.length || 0}/
                      {window.currentCapacity})
                    </span>
                  </div>
                </div>

                {/* Deliveries List */}
                <div className="p-6">
                  <div className="space-y-4">
                    {windowData?.deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(delivery.priority)}
                            <span className="font-medium text-gray-900">
                              {delivery.listingTitle}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {delivery.estimatedDuration}m
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{delivery.buyerName}</span>
                            {delivery.buyerPhone && (
                              <>
                                <Phone className="h-3 w-3 ml-2" />
                                <span>{delivery.buyerPhone}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {delivery.deliveryAddress}
                            </span>
                          </div>
                          {delivery.notes && (
                            <div className="text-xs text-blue-600 mt-2">
                              Note: {delivery.notes}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              delivery.priority === "express"
                                ? "bg-blue-100 text-blue-800"
                                : delivery.priority === "fragile"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getPriorityLabel(delivery.priority)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Order #{delivery.orderId}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {(!windowData?.deliveries ||
                      windowData.deliveries.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No deliveries scheduled</p>
                      </div>
                    )}
                  </div>

                  {/* Assigned Drivers */}
                  {windowData?.assignedDrivers &&
                    windowData.assignedDrivers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Assigned Drivers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {windowData.assignedDrivers.map((driverId) => {
                            const driver = drivers.find(
                              (d) => d.id === driverId
                            );
                            return driver ? (
                              <span
                                key={driverId}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                              >
                                {driver.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Detail Modal */}
        {selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delivery Details
                  </h3>
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedDelivery.listingTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Order #{selectedDelivery.orderId}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedDelivery.buyerName}
                      </p>
                      {selectedDelivery.buyerPhone && (
                        <p className="text-sm text-gray-600">
                          {selectedDelivery.buyerPhone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {getPriorityIcon(selectedDelivery.priority)}
                        <span className="text-sm">
                          {getPriorityLabel(selectedDelivery.priority)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Address
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedDelivery.deliveryAddress}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Duration
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedDelivery.estimatedDuration} minutes
                    </p>
                  </div>

                  {selectedDelivery.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Special Instructions
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedDelivery.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
