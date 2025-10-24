"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Search, Check } from "lucide-react";

interface Listing {
  id: string;
  itemId: string;
  title: string;
  description: string;
  price: number;
  department: string;
  category: string;
  status: string;
  condition: string;
  createdAt: string;
  facebookShopEnabled: boolean;
  photos?: {
    hero: string | null;
    back: string | null;
  };
}

export default function FacebookShopExportPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active"); // Default to "active"

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

  const exportToCSV = () => {
    if (selectedListings.size === 0) {
      alert("Please select at least one listing to export");
      return;
    }

    // Get selected listing objects
    const selectedListingObjects = listings.filter((l) =>
      selectedListings.has(l.id)
    );

    // Facebook Marketplace Bulk Upload Template format
    // Row 1: Header
    // Row 2: Subheader with requirements
    // Row 3: Empty
    // Row 4: Column headers
    // Row 5+: Data

    const line1 = "Facebook Marketplace Bulk Upload Template";
    const line2 = "";
    const line3 =
      "You can create up to 50 listings at once. When you are finished, be sure to save or export this as an XLS/XLSX file.";
    const line4 = "";

    // Column headers with requirements
    const headers = [
      "TITLE",
      "PRICE",
      "CONDITION",
      "DESCRIPTION",
      "CATEGORY",
      "OFFER SHIPPING",
    ];

    const headerRequirements = [
      "REQUIRED | Plain text (up to 150 characters)",
      "REQUIRED | A whole number in $",
      'REQUIRED | Supported values: "New"; "Used - Like New"; "Used - Good"; "Used - Fair"',
      "OPTIONAL | Plain text (up to 5000 characters)",
      "OPTIONAL | Type of listing",
      "OPTIONAL |",
    ];

    // Map listings to rows
    const rows = selectedListingObjects.map((listing) => [
      listing.title.substring(0, 150), // Limit to 150 characters
      Math.ceil(listing.price), // Whole dollar amount
      listing.condition || "Used - Good", // Use actual condition from listing
      (listing.description || "").substring(0, 5000), // Limit to 5000 characters
      `${listing.department || ""}${
        listing.category ? "/" + listing.category : ""
      }`, // Category format
      "", // Offer shipping - empty for now
    ]);

    // Combine all parts with proper CSV escaping
    const escapeCsvField = (field: string | number) => {
      const str = String(field);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      line1,
      line2,
      line3,
      line4,
      headers.map(escapeCsvField).join(","),
      headerRequirements.map(escapeCsvField).join(","),
      ...rows.map((row) => row.map(escapeCsvField).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `facebook-marketplace-export-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              onClick={exportToCSV}
              disabled={selectedListings.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#C49F2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-5 w-5" />
              Export {selectedListings.size > 0 && `(${selectedListings.size})`}
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
    </div>
  );
}
