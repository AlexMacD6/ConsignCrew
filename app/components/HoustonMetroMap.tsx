"use client";

import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

interface ZipCode {
  id: string;
  code: string;
  area: string;
  type: "buyer" | "seller";
}

interface HoustonMetroMapProps {
  userZipCode?: string;
}

// Zip code clusters for area information
const ZIP_CLUSTERS = {
  "77002": { x: 50, y: 45, area: "Downtown", cluster: "central" },
  "77003": { x: 52, y: 47, area: "Third Ward", cluster: "central" },
  "77004": { x: 48, y: 50, area: "Museum District", cluster: "central" },
  "77005": { x: 45, y: 52, area: "Rice Village", cluster: "central" },
  "77006": { x: 47, y: 42, area: "Montrose", cluster: "central" },
  "77007": { x: 45, y: 40, area: "Heights", cluster: "central" },
  "77008": { x: 43, y: 38, area: "Garden Oaks", cluster: "central" },
  "77009": { x: 52, y: 40, area: "East End", cluster: "east" },
  "77010": { x: 50, y: 48, area: "Medical Center", cluster: "central" },
  "77011": { x: 55, y: 50, area: "Gulfgate", cluster: "east" },
  "77012": { x: 58, y: 45, area: "Harrisburg", cluster: "east" },
  "77013": { x: 60, y: 40, area: "Galena Park", cluster: "east" },
  "77014": { x: 42, y: 30, area: "Humble", cluster: "north" },
  "77015": { x: 62, y: 48, area: "Channelview", cluster: "east" },
  "77016": { x: 48, y: 35, area: "Northside", cluster: "north" },
  "77017": { x: 58, y: 52, area: "Southside", cluster: "southeast" },
  "77018": { x: 45, y: 35, area: "Shady Acres", cluster: "north" },
  "77019": { x: 44, y: 48, area: "River Oaks", cluster: "central" },
  "77020": { x: 54, y: 45, area: "Near Northside", cluster: "north" },
  "77021": { x: 50, y: 55, area: "Braeburn", cluster: "south" },
  "77022": { x: 48, y: 38, area: "Timbergrove", cluster: "north" },
  "77023": { x: 55, y: 48, area: "Harrisburg/Manchester", cluster: "east" },
  "77024": { x: 40, y: 45, area: "Memorial", cluster: "west" },
  "77025": { x: 46, y: 55, area: "Bellaire", cluster: "southwest" },
  "77026": { x: 52, y: 42, area: "Kashmere Gardens", cluster: "north" },
  "77027": { x: 46, y: 45, area: "River Oaks", cluster: "central" },
  "77028": { x: 55, y: 38, area: "Denver Harbor", cluster: "northeast" },
  "77029": { x: 58, y: 50, area: "Magnolia Park", cluster: "east" },
  "77030": { x: 48, y: 48, area: "Medical Center", cluster: "central" },
  "77031": { x: 45, y: 58, area: "Gulfton", cluster: "southwest" },
  "77032": { x: 40, y: 25, area: "Cypress", cluster: "northwest" },
  "77033": { x: 52, y: 58, area: "South Park", cluster: "south" },
  "77034": { x: 58, y: 55, area: "South Houston", cluster: "southeast" },
  "77035": { x: 50, y: 60, area: "Airport", cluster: "south" },
  "77036": { x: 42, y: 52, area: "Sharpstown", cluster: "southwest" },
  "77037": { x: 48, y: 32, area: "Aldine", cluster: "north" },
  "77038": { x: 45, y: 28, area: "North Houston", cluster: "north" },
  "77039": { x: 50, y: 35, area: "Northshore", cluster: "north" },
  "77040": { x: 38, y: 42, area: "Spring Branch", cluster: "west" },
  "77041": { x: 35, y: 45, area: "Spring Branch West", cluster: "west" },
  "77042": { x: 38, y: 48, area: "Westchase", cluster: "west" },
  "77043": { x: 35, y: 50, area: "Spring Branch", cluster: "west" },
  "77044": { x: 52, y: 32, area: "Aldine", cluster: "north" },
  "77045": { x: 55, y: 55, area: "Hobby Airport", cluster: "southeast" },
  "77046": { x: 44, y: 50, area: "Galleria", cluster: "central" },
  "77047": { x: 60, y: 52, area: "Southeast Houston", cluster: "southeast" },
  "77048": { x: 48, y: 60, area: "Braes Bayou", cluster: "south" },
  "77049": { x: 42, y: 55, area: "Southwest Houston", cluster: "southwest" },
  "77050": { x: 55, y: 58, area: "Almeda", cluster: "southeast" },
  "77051": { x: 50, y: 58, area: "Fondren Southwest", cluster: "southwest" },
  "77052": { x: 40, y: 55, area: "Westwood", cluster: "southwest" },
  "77053": { x: 45, y: 60, area: "Meyerland", cluster: "southwest" },
  "77054": { x: 52, y: 50, area: "Braeswood", cluster: "south" },
  "77055": { x: 38, y: 40, area: "Memorial Northwest", cluster: "west" },
  "77056": { x: 42, y: 45, area: "Galleria/Uptown", cluster: "central" },
  "77057": { x: 40, y: 50, area: "Tanglewood", cluster: "west" },
  "77058": { x: 65, y: 60, area: "Clear Lake", cluster: "southeast" },
  "77059": { x: 68, y: 58, area: "Friendswood", cluster: "southeast" },
  "77060": { x: 45, y: 25, area: "Bush Airport", cluster: "north" },
  "77061": { x: 58, y: 60, area: "South Houston", cluster: "southeast" },
  "77062": { x: 70, y: 55, area: "Clear Lake", cluster: "southeast" },
  "77063": { x: 35, y: 48, area: "Spring Branch", cluster: "west" },
  "77064": { x: 32, y: 42, area: "Northwest Harris", cluster: "northwest" },
  "77065": { x: 30, y: 38, area: "Cypress", cluster: "northwest" },
  "77066": { x: 35, y: 35, area: "Willowbrook", cluster: "northwest" },
  "77067": { x: 32, y: 45, area: "Eldridge", cluster: "northwest" },
  "77068": { x: 40, y: 30, area: "Atascocita", cluster: "north" },
  "77069": { x: 35, y: 32, area: "Spring", cluster: "north" },
  "77070": { x: 28, y: 40, area: "Katy", cluster: "west" },
  "77071": { x: 40, y: 58, area: "Southwest Houston", cluster: "southwest" },
  "77072": { x: 38, y: 60, area: "Alief", cluster: "southwest" },
  "77073": { x: 42, y: 28, area: "Humble/Atascocita", cluster: "north" },
  "77074": { x: 35, y: 55, area: "Alief", cluster: "southwest" },
  "77075": { x: 48, y: 58, area: "Gulfton", cluster: "southwest" },
  "77076": { x: 50, y: 25, area: "North Harris", cluster: "north" },
  "77077": { x: 30, y: 45, area: "Energy Corridor", cluster: "west" },
  "77078": { x: 55, y: 35, area: "Northeast Houston", cluster: "northeast" },
  "77079": { x: 25, y: 42, area: "Memorial West", cluster: "west" },
  "77080": { x: 32, y: 48, area: "White Oak Bayou", cluster: "northwest" },
  "77081": { x: 45, y: 55, area: "Braeswood", cluster: "south" },
  "77082": { x: 28, y: 48, area: "Westchase", cluster: "west" },
  "77083": { x: 32, y: 52, area: "Alief", cluster: "southwest" },
  "77084": { x: 25, y: 45, area: "Katy", cluster: "west" },
  "77085": { x: 48, y: 62, area: "South Houston", cluster: "south" },
  "77086": { x: 48, y: 30, area: "North Houston", cluster: "north" },
  "77087": { x: 58, y: 48, area: "East Houston", cluster: "east" },
  "77088": { x: 50, y: 28, area: "North Forest", cluster: "north" },
  "77089": { x: 60, y: 55, area: "Pasadena", cluster: "southeast" },
  "77090": { x: 35, y: 30, area: "Northwest Harris", cluster: "northwest" },
  "77091": { x: 45, y: 32, area: "North Houston", cluster: "north" },
  "77092": { x: 42, y: 40, area: "Northwest Houston", cluster: "northwest" },
  "77093": { x: 52, y: 38, area: "Near Northside", cluster: "north" },
  "77094": { x: 22, y: 48, area: "Cinco Ranch", cluster: "west" },
  "77095": { x: 25, y: 40, area: "Katy", cluster: "west" },
  "77096": { x: 45, y: 52, area: "Gulfton", cluster: "southwest" },
  "77098": { x: 47, y: 47, area: "Upper Kirby", cluster: "central" },
  "77099": { x: 35, y: 58, area: "Southwest Houston", cluster: "southwest" },
};

export default function HoustonMetroMap({ userZipCode }: HoustonMetroMapProps) {
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZipCodes = async () => {
      try {
        const response = await fetch("/api/admin/zipcodes");
        if (response.ok) {
          const data = await response.json();
          setZipCodes(data.zipCodes || []);
        }
      } catch (error) {
        console.error("Error fetching zip codes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchZipCodes();
  }, []);

  const buyerZips = zipCodes.filter((zip) => zip.type === "buyer");
  const sellerZips = zipCodes.filter((zip) => zip.type === "seller");

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Houston Metro Service Areas
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Service Area Status
      </h3>

      {/* User location status */}
      {userZipCode && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-800 font-semibold text-lg">
                Your Location: {userZipCode}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                {ZIP_CLUSTERS[userZipCode as keyof typeof ZIP_CLUSTERS]
                  ? `Located in ${
                      ZIP_CLUSTERS[userZipCode as keyof typeof ZIP_CLUSTERS]
                        .area
                    } (${
                      ZIP_CLUSTERS[userZipCode as keyof typeof ZIP_CLUSTERS]
                        .cluster
                    } area)`
                  : "Location not mapped on visual representation"}
              </p>
              <div className="mt-2 flex gap-4">
                <div className="flex items-center">
                  <span className="text-yellow-800 font-medium">
                    Service available:
                  </span>
                  <div className="ml-2 flex gap-2">
                    {buyerZips.some((zip) => zip.code === userZipCode) && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ✓ Buying
                      </span>
                    )}
                    {sellerZips.some((zip) => zip.code === userZipCode) && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        ✓ Selling
                      </span>
                    )}
                    {!buyerZips.some((zip) => zip.code === userZipCode) &&
                      !sellerZips.some((zip) => zip.code === userZipCode) && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                          Contact us for availability
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No location message */}
      {!userZipCode && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            Please update your profile with your zip code to see service
            availability.
          </p>
        </div>
      )}
    </div>
  );
}
