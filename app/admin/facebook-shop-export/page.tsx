"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Search,
  Check,
  CheckCircle,
} from "lucide-react";
import ExcelJS from "exceljs";
import JSZip from "jszip";

interface Listing {
  id: string;
  itemId: string;
  title: string;
  description: string;
  price: number;
  department: string;
  category: string;
  subCategory?: string | null;
  status: string;
  condition: string;
  createdAt: string;
  facebookShopEnabled: boolean;
  photos?: {
    hero: string | null;
    back: string | null;
    proof: string | null;
    additional?: string[];
  };
  videos?: Array<{
    id: string;
    videoUrl: string | null;
    processedVideoKey: string | null;
    rawVideoKey: string | null;
  }>;
}

export default function FacebookShopExportPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active"); // Default to "active"
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exportStats, setExportStats] = useState({
    listings: 0,
    photos: 0,
    videos: 0,
  });

  // Load all listings
  useEffect(() => {
    loadListings();
  }, []);

  // Filter listings based on search and status filter
  useEffect(() => {
    let filtered = listings;

    // Filter by listing status
    if (filterStatus !== "all") {
      filtered = filtered.filter((l) => l.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.itemId.toLowerCase().includes(query) ||
          l.department.toLowerCase().includes(query) ||
          l.category.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query)
      );
    }

    setFilteredListings(filtered);
  }, [listings, searchQuery, filterStatus]);

  const loadListings = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all listings (not just active ones)
      const response = await fetch("/api/listings?userOnly=false&limit=1000");

      if (!response.ok) {
        throw new Error("Failed to load listings");
      }

      const data = await response.json();

      // Sort by newest first (createdAt descending)
      const sortedListings = (data.listings || []).sort(
        (a: Listing, b: Listing) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setListings(sortedListings);
      setFilteredListings(sortedListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleListing = (listingId: string) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const selectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      // Deselect all
      setSelectedListings(new Set());
    } else {
      // Select all filtered listings
      setSelectedListings(new Set(filteredListings.map((l) => l.id)));
    }
  };

  // Helper function to fetch a file as blob through the admin API (avoids CORS issues)
  const fetchFileAsBlob = async (
    url: string,
    type: "photo" | "video"
  ): Promise<Blob | null> => {
    try {
      let apiUrl: string;

      if (type === "photo") {
        // Use the admin photo download API
        apiUrl = `/api/admin/download-photos?photoUrl=${encodeURIComponent(
          url
        )}`;
      } else {
        // Use the admin video download API - extract video ID and URL
        // For videos, we might have a full URL or just a key
        apiUrl = `/api/admin/download-video?videoUrl=${encodeURIComponent(
          url
        )}`;
      }

      console.log(`Fetching ${type} through API:`, apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }
      return await response.blob();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  };

  // Helper function to get file extension from URL
  const getFileExtension = (url: string): string => {
    const urlParts = url.split("?")[0].split("/");
    const filename = urlParts[urlParts.length - 1];
    const extensionMatch = filename.match(
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i
    );
    return extensionMatch ? extensionMatch[1] : "jpg";
  };

  const exportToXLSX = async () => {
    if (selectedListings.size === 0) {
      setError("Please select at least one listing to export");
      return;
    }

    setExporting(true);
    setError("");

    try {
      console.log("📦 Starting export with photos and videos...");

      // Get selected listing objects
      const selectedListingObjects = listings.filter((l) =>
        selectedListings.has(l.id)
      );

      // Create a new zip file
      const zip = new JSZip();

      // ===== CREATE EXCEL FILE =====
      console.log("📊 Creating XLSX file with ExcelJS...");

      // Create a new workbook with ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Facebook Marketplace");

      // Define column widths
      worksheet.columns = [
        { width: 55 }, // TITLE
        { width: 12 }, // PRICE
        { width: 25 }, // CONDITION
        { width: 70 }, // DESCRIPTION
        { width: 35 }, // CATEGORY
        { width: 18 }, // OFFER SHIPPING
      ];

      // Row 1: TreasureHub branding
      const titleRow = worksheet.getRow(1);
      titleRow.height = 32;
      const titleCell = titleRow.getCell(1);
      titleCell.value =
        "TreasureHub - Facebook Marketplace Bulk Upload Template";
      titleCell.font = {
        name: "Poppins",
        size: 18,
        bold: true,
        color: { argb: "FFD4AF3D" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      titleCell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };

      // Row 2: Instructions
      const instructionsRow = worksheet.getRow(2);
      instructionsRow.height = 24;
      const instructionsCell = instructionsRow.getCell(1);
      instructionsCell.value = `You can create up to 50 listings at once. Exported on ${new Date().toLocaleDateString()} with ${
        selectedListingObjects.length
      } listing(s).`;
      instructionsCell.font = {
        name: "Poppins",
        size: 11,
        color: { argb: "FF495057" },
      };
      instructionsCell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      instructionsCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
      instructionsCell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };

      // Row 3: Header requirements
      const requirementsRow = worksheet.getRow(3);
      requirementsRow.height = 48;
      const requirements = [
        "REQUIRED | Plain text (up to 150 characters)",
        "REQUIRED | A whole number in $",
        'REQUIRED | Supported values: "New"; "Used - Like New"; "Used - Good"; "Used - Fair"',
        "OPTIONAL | Plain text (up to 5000 characters)",
        "OPTIONAL | Type of listing",
        "OPTIONAL |",
      ];
      requirements.forEach((req, index) => {
        const cell = requirementsRow.getCell(index + 1);
        cell.value = req;
        cell.font = {
          name: "Poppins",
          size: 9,
          italic: true,
          color: { argb: "FF6C757D" },
        };
        cell.alignment = {
          vertical: "top",
          horizontal: "left",
          wrapText: true,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF3CD" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });

      // Row 4: Column headers
      const headerRow = worksheet.getRow(4);
      headerRow.height = 28;
      const headers = [
        "TITLE",
        "PRICE",
        "CONDITION",
        "DESCRIPTION",
        "CATEGORY",
        "OFFER SHIPPING",
      ];
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = {
          name: "Poppins",
          size: 13,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD4AF3D" },
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          right: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      // Row 5+: Data rows
      selectedListingObjects.forEach((listing, index) => {
        const rowNumber = index + 5;
        const dataRow = worksheet.getRow(rowNumber);

        // Build Facebook category path from department, category, subCategory with // separators
        const parts = [];
        if (listing.department) parts.push(listing.department);
        if (listing.category) parts.push(listing.category);
        if (listing.subCategory) parts.push(listing.subCategory);
        const categoryPath = parts.join("//");

        const rowData = [
          listing.title.substring(0, 150),
          Math.ceil(listing.price),
          listing.condition || "Used - Good",
          (listing.description || "").substring(0, 5000),
          categoryPath,
          "",
        ];

        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = value;
          cell.font = { name: "Poppins", size: 11 };
          cell.alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: colIndex === 3, // Enable wrapping for description column
          };

          // Alternating row colors
          const fillColor = rowNumber % 2 === 0 ? "FFFFFFFF" : "FFF8F9FA";
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
          };

          cell.border = {
            top: { style: "thin", color: { argb: "FFCCCCCC" } },
            left: { style: "thin", color: { argb: "FFCCCCCC" } },
            bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
            right: { style: "thin", color: { argb: "FFCCCCCC" } },
          };
        });
      });

      // Generate Excel file as buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const xlsxBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Add XLSX file to zip
      zip.file("Facebook-Marketplace-Template.xlsx", xlsxBlob);
      console.log("✅ XLSX file added to zip");

      // ===== DOWNLOAD ALL PHOTOS AND VIDEOS =====
      console.log("📸 Starting photo and video download...");

      let totalPhotos = 0;
      let totalVideos = 0;

      for (const listing of selectedListingObjects) {
        console.log(`Processing listing: ${listing.title}`);

        // Create a folder for each listing
        const listingFolderName = `${listing.itemId}-${listing.title
          .replace(/[^a-z0-9]/gi, "_")
          .substring(0, 50)}`;

        // Collect all photo URLs
        const photoUrls: string[] = [];
        if (listing.photos) {
          if (listing.photos.hero) photoUrls.push(listing.photos.hero);
          if (listing.photos.back) photoUrls.push(listing.photos.back);
          if (listing.photos.proof) photoUrls.push(listing.photos.proof);
          if (listing.photos.additional) {
            photoUrls.push(...listing.photos.additional);
          }
        }

        // Download and add photos to zip
        for (let i = 0; i < photoUrls.length; i++) {
          const url = photoUrls[i];
          console.log(`  Downloading photo ${i + 1}/${photoUrls.length}...`);

          const blob = await fetchFileAsBlob(url, "photo");
          if (blob) {
            const extension = getFileExtension(url);
            zip.file(
              `${listingFolderName}/photos/photo-${i + 1}.${extension}`,
              blob
            );
            totalPhotos++;
          }
        }

        // Download and add videos to zip
        if (listing.videos && listing.videos.length > 0) {
          for (let i = 0; i < listing.videos.length; i++) {
            const video = listing.videos[i];
            const videoUrl = video.videoUrl || video.processedVideoKey;

            if (videoUrl) {
              console.log(
                `  Downloading video ${i + 1}/${listing.videos.length}...`
              );

              // Generate video URL using CloudFront domain
              const cdnDomain =
                process.env.NEXT_PUBLIC_CDN_URL ||
                "https://dtlqyjbwka60p.cloudfront.net";
              const cleanDomain = cdnDomain
                .replace("https://", "")
                .replace("http://", "");

              let fullVideoUrl = videoUrl;
              if (!videoUrl.startsWith("http")) {
                fullVideoUrl = `https://${cleanDomain}/${videoUrl}`;
              }

              const blob = await fetchFileAsBlob(fullVideoUrl, "video");
              if (blob) {
                const extension = getFileExtension(fullVideoUrl);
                zip.file(
                  `${listingFolderName}/videos/video-${i + 1}.${extension}`,
                  blob
                );
                totalVideos++;
              }
            }
          }
        }
      }

      console.log(
        `✅ Downloaded ${totalPhotos} photos and ${totalVideos} videos`
      );

      // ===== GENERATE AND DOWNLOAD ZIP FILE =====
      console.log("📦 Generating zip file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Trigger download
      const link = document.createElement("a");
      const url = URL.createObjectURL(zipBlob);
      link.href = url;
      link.download = `TreasureHub-Facebook-Export-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✅ Export complete!");
      setExportStats({
        listings: selectedListingObjects.length,
        photos: totalPhotos,
        videos: totalVideos,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Export error:", error);
      setError("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#D4AF3D] mx-auto mb-4" />
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Facebook Shop Export
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Select listings to export for Facebook Shop upload
                </p>
              </div>
            </div>

            <button
              onClick={exportToXLSX}
              disabled={selectedListings.size === 0 || exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#C49F2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Export{" "}
                  {selectedListings.size > 0 && `(${selectedListings.size})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, item ID, department, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-[#D4AF3D]"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-[#D4AF3D]"
              >
                <option value="active">Active</option>
                <option value="all">All Listings</option>
                <option value="sold">Sold</option>
                <option value="processing">Processing</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
              </select>

              <button
                onClick={selectAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {selectedListings.size === filteredListings.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <span>
              Total Listings: <strong>{filteredListings.length}</strong>
            </span>
            <span>
              Selected: <strong>{selectedListings.size}</strong>
            </span>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No listings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedListings.size === filteredListings.length &&
                          filteredListings.length > 0
                        }
                        onChange={selectAll}
                        className="h-4 w-4 text-[#D4AF3D] focus:ring-[#D4AF3D] border-gray-300 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department / Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredListings.map((listing) => (
                    <tr
                      key={listing.id}
                      onClick={() => toggleListing(listing.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedListings.has(listing.id)
                          ? "bg-[#D4AF3D]/10"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedListings.has(listing.id)}
                            onChange={() => toggleListing(listing.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-[#D4AF3D] focus:ring-[#D4AF3D] border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {listing.photos?.hero && (
                            <img
                              src={listing.photos.hero}
                              alt={listing.title}
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {listing.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {listing.itemId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {listing.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {listing.department || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {listing.category || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${Math.ceil(listing.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.status === "active"
                              ? "bg-green-100 text-green-800"
                              : listing.status === "sold"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowSuccessModal(false)}
            ></div>

            {/* Center modal */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gradient-to-br from-[#D4AF3D] to-[#B8941F] px-6 pt-8 pb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-white rounded-full shadow-lg">
                  <CheckCircle className="w-10 h-10 text-[#D4AF3D]" />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-center text-white">
                  Export Successful!
                </h3>
              </div>

              <div className="px-6 py-6 bg-white">
                <p className="text-center text-gray-600 mb-6">
                  Your Facebook Marketplace export is ready and has been
                  downloaded.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-[#D4AF3D]">
                      {exportStats.listings}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Listing{exportStats.listings !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-[#D4AF3D]">
                      {exportStats.photos}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Photo{exportStats.photos !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-[#D4AF3D]">
                      {exportStats.videos}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Video{exportStats.videos !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>📦 What's included:</strong>
                    <br />• Professional XLSX template with TreasureHub branding
                    <br />• All photos organized by listing
                    <br />• All videos organized by listing
                  </p>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-3 text-white bg-[#D4AF3D] rounded-lg hover:bg-[#C49F2D] transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
