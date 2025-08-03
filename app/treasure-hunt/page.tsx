"use client";
import React, { useState } from "react";
import { MapPin, Search, Filter, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import InteractiveMap from "../components/InteractiveMap";

// Mock data for demonstration
const mockDrops = [
  {
    id: 1,
    name: "Downtown Discovery",
    location: { lat: 29.7604, lng: -95.3698 },
    status: "active", // "active" or "found"
    clue: "Look for the golden arches near the tallest building in Houston",
    image: "/treasure clue.png",
    reward: "Free coffee at local café",
    foundBy: null,
    foundAt: null,
  },
  {
    id: 2,
    name: "Museum District Mystery",
    location: { lat: 29.7245, lng: -95.3902 },
    status: "found",
    clue: "Behind the giant dinosaur, under the oak tree",
    image: "/treasure clue.png",
    reward: "$25 gift card",
    foundBy: "John Doe",
    foundAt: "2024-01-15",
  },
  {
    id: 3,
    name: "Riverwalk Riddle",
    location: { lat: 29.7633, lng: -95.3633 },
    status: "active",
    clue: "Follow the water's edge until you see the red bridge",
    image: "/treasure clue.png",
    reward: "Mystery prize",
    foundBy: null,
    foundAt: null,
  },
];

export default function TreasureHuntPage() {
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "found">("all");

  const filteredDrops = mockDrops.filter((drop) => {
    if (filter === "all") return true;
    return drop.status === filter;
  });

  const activeDrops = mockDrops.filter(
    (drop) => drop.status === "active"
  ).length;
  const foundDrops = mockDrops.filter((drop) => drop.status === "found").length;

  const handlePinClick = (drop: any) => {
    setSelectedDrop(drop);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Treasure Hunt</h1>
            <p className="mt-2 text-gray-600">
              Explore Houston and discover hidden treasures! Gold pins are
              active drops, grey pins are found drops.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#D4AF3D] rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {activeDrops} Active Drops
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {foundDrops} Found Drops
                </span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={
                  filter === "all" ? "bg-[#D4AF3D] hover:bg-[#b8932f]" : ""
                }
              >
                All
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                className={
                  filter === "active" ? "bg-[#D4AF3D] hover:bg-[#b8932f]" : ""
                }
              >
                Active
              </Button>
              <Button
                variant={filter === "found" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("found")}
                className={
                  filter === "found" ? "bg-[#D4AF3D] hover:bg-[#b8932f]" : ""
                }
              >
                Found
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Interactive Map
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Scroll and zoom around Houston to find treasure drops
                </p>
              </div>

              {/* Interactive Google Maps */}
              <InteractiveMap
                drops={filteredDrops}
                onPinClick={handlePinClick}
                filter={filter}
              />
            </div>
          </div>

          {/* Drops List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Treasure Drops
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on a drop to view details
                </p>
              </div>

              <div className="p-4 space-y-3">
                {filteredDrops.map((drop) => (
                  <div
                    key={drop.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      drop.status === "active"
                        ? "border-[#D4AF3D] bg-[#D4AF3D]/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    onClick={() => handlePinClick(drop)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {drop.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {drop.clue}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              drop.status === "active"
                                ? "bg-[#D4AF3D]"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {drop.status === "active" ? "Active" : "Found"}
                          </span>
                        </div>
                      </div>
                      <MapPin
                        className={`h-5 w-5 ${
                          drop.status === "active"
                            ? "text-[#D4AF3D]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clue Modal */}
      {showModal && selectedDrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedDrop.name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedDrop.status === "active"
                      ? "bg-[#D4AF3D] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedDrop.status === "active" ? "Active" : "Found"}
                </span>
              </div>

              {/* Image */}
              <div className="mb-4">
                <img
                  src={selectedDrop.image}
                  alt="Treasure clue"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              {/* Clue */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Clue:
                </h3>
                <p className="text-gray-600">{selectedDrop.clue}</p>
              </div>

              {/* Reward */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Reward:
                </h3>
                <p className="text-[#D4AF3D] font-medium">
                  {selectedDrop.reward}
                </p>
              </div>

              {/* Found Info */}
              {selectedDrop.status === "found" && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Found by:
                  </h3>
                  <p className="text-gray-600">{selectedDrop.foundBy}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedDrop.foundAt}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-3">
                {selectedDrop.status === "active" ? (
                  <Button className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f]">
                    Claim Treasure
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" disabled>
                    Already Found
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
