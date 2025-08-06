"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Shield, Search, CheckCircle, XCircle } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  qualityChecked: boolean;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

export default function QualityCheckManagementPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<"all" | "checked" | "unchecked">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchListings();
  }, [session, filter, searchTerm]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("filter", filter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `/api/admin/quality-check/listings?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data.listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQualityCheck = async (
    listingId: string,
    qualityChecked: boolean
  ) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/quality-check/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qualityChecked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      // Update local state
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId ? { ...listing, qualityChecked } : listing
        )
      );
    } catch (error) {
      console.error("Error updating listing:", error);
    } finally {
      setUpdating(false);
    }
  };

  const bulkToggle = async (qualityChecked: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/admin/quality-check/bulk-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qualityChecked, filter, searchTerm }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk update listings");
      }

      const data = await response.json();
      console.log(`Updated ${data.updatedCount} listings`);

      // Refresh the listings
      fetchListings();
    } catch (error) {
      console.error("Error bulk updating listings:", error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === "checked" && !listing.qualityChecked) return false;
    if (filter === "unchecked" && listing.qualityChecked) return false;
    return true;
  });

  const checkedCount = listings.filter((l) => l.qualityChecked).length;
  const uncheckedCount = listings.filter((l) => !l.qualityChecked).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Quality Check Management
            </h1>
          </div>
          <p className="text-gray-600">
            Manage quality check status for all listings. Quality checked items
            display a badge to buyers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Listings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {listings.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Quality Checked
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {checkedCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Check
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {uncheckedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("checked")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "checked"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Checked
              </button>
              <button
                onClick={() => setFilter("unchecked")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "unchecked"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => bulkToggle(true)}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Mark All as Checked"}
            </button>
            <button
              onClick={() => bulkToggle(false)}
              disabled={updating}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Mark All as Pending"}
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {listing.title}
                </h3>
                <button
                  onClick={() =>
                    toggleQualityCheck(listing.id, !listing.qualityChecked)
                  }
                  disabled={updating}
                  className={`ml-2 p-2 rounded-lg transition-colors ${
                    listing.qualityChecked
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                  } disabled:opacity-50`}
                  title={
                    listing.qualityChecked
                      ? "Mark as unchecked"
                      : "Mark as checked"
                  }
                >
                  {listing.qualityChecked ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Price:</span> $
                  {listing.price.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Seller:</span>{" "}
                  {listing.user.name}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">
                    {listing.status.toLowerCase()}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Listed:</span>{" "}
                  {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    listing.qualityChecked
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {listing.qualityChecked ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Quality Checked
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Pending Check
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
