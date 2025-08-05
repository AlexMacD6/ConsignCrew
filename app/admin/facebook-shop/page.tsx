"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  facebookShopEnabled: boolean;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

export default function FacebookShopManagementPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchListings();
  }, [session]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/facebook-shop/listings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  const toggleFacebookShop = async (listingId: string, enabled: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch(
        `/api/admin/facebook-shop/listings/${listingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ facebookShopEnabled: enabled }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      // Update local state
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, facebookShopEnabled: enabled }
            : listing
        )
      );
    } catch (error) {
      console.error("Error updating listing:", error);
    } finally {
      setUpdating(false);
    }
  };

  const bulkToggle = async (enabled: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/admin/facebook-shop/bulk-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          filter: filter,
          searchTerm: searchTerm,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk update listings");
      }

      // Refresh listings
      await fetchListings();
    } catch (error) {
      console.error("Error bulk updating listings:", error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "enabled" && listing.facebookShopEnabled) ||
      (filter === "disabled" && !listing.facebookShopEnabled);

    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const enabledCount = listings.filter((l) => l.facebookShopEnabled).length;
  const disabledCount = listings.filter((l) => !l.facebookShopEnabled).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Facebook Shop Management
          </h2>
          <p className="text-gray-600">Fetching listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Facebook Shop Management
          </h1>
          <p className="text-gray-600">
            Manage which listings are enabled for Facebook Shop export
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Listings
            </h3>
            <p className="text-3xl font-bold text-[#D4AF3D]">
              {listings.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Facebook Shop Enabled
            </h3>
            <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Facebook Shop Disabled
            </h3>
            <p className="text-3xl font-bold text-red-600">{disabledCount}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="all">All Listings</option>
                  <option value="enabled">Facebook Shop Enabled</option>
                  <option value="disabled">Facebook Shop Disabled</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or seller..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => bulkToggle(true)}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Enable All"}
              </button>
              <button
                onClick={() => bulkToggle(false)}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Disable All"}
              </button>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facebook Shop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {listing.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {listing.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {listing.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {listing.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${listing.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.facebookShopEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {listing.facebookShopEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          toggleFacebookShop(
                            listing.id,
                            !listing.facebookShopEnabled
                          )
                        }
                        disabled={updating}
                        className={`px-3 py-1 text-sm rounded-md ${
                          listing.facebookShopEnabled
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        } disabled:opacity-50`}
                      >
                        {updating
                          ? "Updating..."
                          : listing.facebookShopEnabled
                          ? "Disable"
                          : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No listings found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Export to Facebook Shop
          </h3>
          <p className="text-gray-600 mb-4">
            Export all enabled listings to CSV format for Facebook Shop upload.
          </p>
          <div className="flex gap-4">
            <a
              href="/fbshop.csv"
              className="px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#B8941F] transition-colors"
            >
              Export CSV
            </a>
            <a
              href="/api/facebook-shop/export"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Direct API Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
