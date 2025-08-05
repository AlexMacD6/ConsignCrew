"use client";
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { checkAdminStatus } from "../lib/auth-utils";

interface TreasureDrop {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  radius: number; // Radius in feet
  status: "active" | "found";
  clue: string;
  image: string | null;
  reward: string;
  foundBy: string | null;
  foundAt: string | null;
}

interface MapComponentProps {
  drops: TreasureDrop[];
  onPinClick: (drop: TreasureDrop) => void;
  selectedDrop?: TreasureDrop | null;
}

// Component to handle map bounds and zoom
function MapBounds({
  drops,
  selectedDrop,
}: {
  drops: TreasureDrop[];
  selectedDrop?: TreasureDrop | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedDrop) {
      // Zoom to the selected drop with a closer zoom level
      map.setView([selectedDrop.location.lat, selectedDrop.location.lng], 16);
    } else if (drops.length > 0) {
      const bounds = L.latLngBounds(
        drops.map((drop) => [drop.location.lat, drop.location.lng])
      );

      if (drops.length === 1) {
        // If only one marker, zoom in closer
        map.setView([drops[0].location.lat, drops[0].location.lng], 15);
      } else {
        // Fit bounds for multiple markers
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } else {
      // Default to Houston if no drops
      map.setView([29.7604, -95.3698], 11);
    }
  }, [drops, selectedDrop, map]);

  return null;
}

export default function MapComponent({
  drops,
  onPinClick,
  selectedDrop,
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fix for default markers in React Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Check admin status
    const checkAdmin = async () => {
      try {
        const { isAdmin: adminStatus } = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
    setIsMounted(true);
  }, []);

  // Convert feet to meters for Leaflet
  const feetToMeters = (feet: number) => {
    // Ensure feet is a valid number, default to 500 if not
    const validFeet = typeof feet === "number" && !isNaN(feet) ? feet : 500;
    return validFeet * 0.3048;
  };

  // Generate a deterministic point within the circle radius based on drop ID
  // This ensures the actual treasure location stays the same on every page reload
  const getDeterministicPointInCircle = (
    center: { lat: number; lng: number },
    radiusFeet: number,
    dropId: string
  ) => {
    // Ensure radiusFeet is a valid number, default to 500 if not
    const validRadiusFeet =
      typeof radiusFeet === "number" && !isNaN(radiusFeet) ? radiusFeet : 500;
    const radiusMeters = feetToMeters(validRadiusFeet);

    // Create a deterministic seed from the drop ID
    let hash = 0;
    for (let i = 0; i < dropId.length; i++) {
      const char = dropId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use the hash to generate consistent "random" values
    const seed1 = Math.abs(hash) / 2147483647; // Normalize to 0-1
    const seed2 = (Math.abs(hash * 16807) % 2147483647) / 2147483647; // Second seed

    const distance = Math.sqrt(seed1) * radiusMeters;
    const angle = seed2 * 2 * Math.PI;

    // Convert to lat/lng offset (approximate)
    const latOffset = (distance / 111320) * Math.cos(angle);
    const lngOffset =
      (distance / (111320 * Math.cos((center.lat * Math.PI) / 180))) *
      Math.sin(angle);

    return {
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset,
    };
  };

  // Custom marker icons for the actual treasure location
  const createCustomIcon = (status: "active" | "found") => {
    const color = status === "active" ? "#D4AF3D" : "#9CA3AF";
    const size = 16; // Smaller size since it's the actual location

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: "custom-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  if (!isMounted || isLoading) {
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
    <MapContainer
      center={[29.7604, -95.3698]} // Houston coordinates
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      className="rounded-b-lg treasure-hunt-map"
      zoomControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      boxZoom={true}
      dragging={true}
      touchZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="custom-map-style"
      />

      {/* Alternative: Custom styled map tiles for more brand integration */}
      {/* Uncomment the line below and comment out the above TileLayer for a different look */}
      {/* <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        className="custom-map-style"
      /> */}

      <MapBounds drops={drops} selectedDrop={selectedDrop} />

      {drops.map((drop) => {
        // Generate a deterministic point within the circle for the actual treasure location
        const actualLocation = getDeterministicPointInCircle(
          drop.location,
          drop.radius || 500, // Default to 500 feet if radius is undefined
          drop.id
        );

        return (
          <React.Fragment key={drop.id}>
            {/* Circle showing the search area */}
            <Circle
              center={[drop.location.lat, drop.location.lng]}
              radius={feetToMeters(drop.radius || 500)} // Default to 500 feet if radius is undefined
              pathOptions={{
                color: drop.status === "active" ? "#D4AF3D" : "#9CA3AF",
                fillColor: drop.status === "active" ? "#D4AF3D" : "#9CA3AF",
                fillOpacity: 0.2,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onPinClick(drop),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {drop.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{drop.clue}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        drop.status === "active"
                          ? "bg-[#D4AF3D] text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {drop.status === "active" ? "Active" : "Found"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Reward: {drop.reward}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Search radius: {drop.radius} feet
                  </div>
                  {drop.foundBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Found by: {drop.foundBy}
                    </p>
                  )}
                </div>
              </Popup>
            </Circle>

            {/* Small marker showing the actual treasure location */}
            {/* Show to admins for active treasures, or to everyone for found treasures */}
            {(isAdmin || drop.status === "found") && (
              <Marker
                position={[actualLocation.lat, actualLocation.lng]}
                icon={createCustomIcon(drop.status)}
                eventHandlers={{
                  click: () => onPinClick(drop),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {drop.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isAdmin && drop.status === "active"
                        ? "Actual treasure location (Admin view)"
                        : "Actual treasure location"}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{drop.clue}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          drop.status === "active"
                            ? "bg-[#D4AF3D] text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {drop.status === "active" ? "Active" : "Found"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Reward: {drop.reward}
                      </span>
                    </div>
                    {drop.foundBy && (
                      <p className="text-xs text-gray-500 mt-1">
                        Found by: {drop.foundBy}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
