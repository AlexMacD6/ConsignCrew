"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TreasureDrop } from "@/types/treasure";

interface InteractiveMapProps {
  drops: TreasureDrop[];
  onPinClick: (drop: TreasureDrop) => void;
  filter: "all" | "active" | "found";
  selectedDrop?: TreasureDrop | null;
}

// Dynamically import the entire map component to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="relative h-96 bg-gray-100 rounded-b-lg overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function InteractiveMap({
  drops,
  onPinClick,
  filter,
  selectedDrop,
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter drops based on current filter
  const filteredDrops = drops.filter((drop) => {
    if (filter === "all") return true;
    return drop.status === filter;
  });

  if (!isClient) {
    return (
      <div className="relative h-96 bg-gray-100 rounded-b-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gray-100 rounded-b-lg overflow-hidden">
      <MapComponent
        drops={filteredDrops}
        onPinClick={onPinClick}
        selectedDrop={selectedDrop}
      />
    </div>
  );
}
