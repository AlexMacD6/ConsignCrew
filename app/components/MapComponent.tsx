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
}

// Component to handle map bounds and zoom
function MapBounds({ drops }: { drops: TreasureDrop[] }) {
  const map = useMap();

  useEffect(() => {
    if (drops.length > 0) {
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
  }, [drops, map]);

  return null;
}

export default function MapComponent({ drops, onPinClick }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

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
    setIsMounted(true);
  }, []);

  // Convert feet to meters for Leaflet
  const feetToMeters = (feet: number) => feet * 0.3048;

  // Generate a random point within the circle radius
  const getRandomPointInCircle = (
    center: { lat: number; lng: number },
    radiusFeet: number
  ) => {
    const radiusMeters = feetToMeters(radiusFeet);
    const randomDistance = Math.sqrt(Math.random()) * radiusMeters;
    const randomAngle = Math.random() * 2 * Math.PI;

    // Convert to lat/lng offset (approximate)
    const latOffset = (randomDistance / 111320) * Math.cos(randomAngle);
    const lngOffset =
      (randomDistance / (111320 * Math.cos((center.lat * Math.PI) / 180))) *
      Math.sin(randomAngle);

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

  if (!isMounted) {
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
      className="rounded-b-lg"
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
      />

      <MapBounds drops={drops} />

      {drops.map((drop) => {
        // Generate a random point within the circle for the actual treasure location
        const actualLocation = getRandomPointInCircle(
          drop.location,
          drop.radius
        );

        return (
          <React.Fragment key={drop.id}>
            {/* Circle showing the search area */}
            <Circle
              center={[drop.location.lat, drop.location.lng]}
              radius={feetToMeters(drop.radius)}
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

            {/* Small marker showing the actual treasure location (only visible to admins) */}
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
                    Actual treasure location
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
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
