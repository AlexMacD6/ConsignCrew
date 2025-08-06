"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  BarChart3,
  Upload,
  Download,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  facebookShopEnabled: boolean;
  metaProductId?: string;
  metaLastSync?: string;
  metaSyncStatus?: string;
  metaErrorDetails?: string;
  isTreasure?: boolean;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

interface CatalogStatus {
  catalog: {
    id: string;
    name: string;
    product_count: number;
    vertical: string;
  } | null;
  catalogError?: string;
  statistics: {
    total: number;
    synced: number;
    pending: number;
    error: number;
    deleted: number;
  };
  recentSyncs: any[];
  metaConfig: {
    pixelId: string;
    accessToken: string;
    catalogId: string;
    businessId: string;
  };
}

export default function MetaPixelManagementPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "enabled" | "disabled" | "synced" | "error" | "pending"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchListings(), fetchCatalogStatus()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      // Fetch all listings with Meta fields
      const response = await fetch("/api/listings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      // Transform the data to match the expected format
      const transformedListings = data.listings.map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
        facebookShopEnabled: listing.facebookShopEnabled || false,
        metaProductId: listing.metaProductId,
        metaLastSync: listing.metaLastSync,
        metaSyncStatus: listing.metaSyncStatus,
        metaErrorDetails: listing.metaErrorDetails,
        isTreasure: listing.isTreasure,
        createdAt: listing.createdAt,
        user: {
          name:
            listing.user?.name ||
            `${listing.user?.firstName || ""} ${
              listing.user?.lastName || ""
            }`.trim(),
          email: listing.user?.email || "",
        },
      }));
      setListings(transformedListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchCatalogStatus = async () => {
    try {
      const response = await fetch("/api/meta/catalog-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch catalog status");
      }

      const data = await response.json();
      setCatalogStatus(data);
    } catch (error) {
      console.error("Error fetching catalog status:", error);
    }
  };

  const syncProduct = async (listingId: string) => {
    try {
      setSyncing(true);
      const response = await fetch("/api/meta/sync-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync product");
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === listingId
              ? {
                  ...listing,
                  metaProductId: result.productId,
                  metaLastSync: new Date().toISOString(),
                  metaSyncStatus: "success",
                  metaErrorDetails: null,
                }
              : listing
          )
        );

        // Refresh catalog status
        await fetchCatalogStatus();
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      console.error("Error syncing product:", error);
      alert(
        `Failed to sync product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSyncing(false);
    }
  };

  const removeProduct = async (listingId: string) => {
    try {
      setSyncing(true);
      const response = await fetch("/api/meta/sync-product", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove product");
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === listingId
              ? {
                  ...listing,
                  metaProductId: null,
                  metaLastSync: new Date().toISOString(),
                  metaSyncStatus: "deleted",
                  metaErrorDetails: null,
                }
              : listing
          )
        );

        // Refresh catalog status
        await fetchCatalogStatus();
      } else {
        throw new Error(result.error || "Remove failed");
      }
    } catch (error) {
      console.error("Error removing product:", error);
      alert(
        `Failed to remove product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSyncing(false);
    }
  };

  const toggleFacebookShop = async (listingId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facebookShopEnabled: enabled }),
      });

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
    }
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "deleted":
        return <EyeOff className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = (status?: string) => {
    switch (status) {
      case "success":
        return "Synced";
      case "error":
        return "Error";
      case "pending":
        return "Pending";
      case "deleted":
        return "Removed";
      default:
        return "Not Synced";
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filter) {
        case "enabled":
          return listing.facebookShopEnabled;
        case "disabled":
          return !listing.facebookShopEnabled;
        case "synced":
          return listing.metaSyncStatus === "success";
        case "error":
          return listing.metaSyncStatus === "error";
        case "pending":
          return (
            listing.metaSyncStatus === "pending" || !listing.metaSyncStatus
          );
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meta Pixel & Facebook Shop Management
          </h1>
          <p className="text-gray-600">
            Manage your product catalog sync with Meta's Facebook Shop
          </p>
        </div>

        {/* Catalog Status Dashboard */}
        {catalogStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Catalog Status
              </h2>
              <Button
                onClick={fetchCatalogStatus}
                disabled={syncing}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Catalog Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Catalog</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {catalogStatus.catalog?.name || "Not Connected"}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-400" />
                </div>
                {catalogStatus.catalog && (
                  <p className="text-sm text-blue-600 mt-1">
                    {catalogStatus.catalog.product_count} products
                  </p>
                )}
              </div>

              {/* Sync Statistics */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Synced</p>
                    <p className="text-2xl font-bold text-green-900">
                      {catalogStatus.statistics.synced}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-sm text-green-600 mt-1">
                  of {catalogStatus.statistics.total} total
                </p>
              </div>

              {/* Pending */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {catalogStatus.statistics.pending}
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="text-sm text-yellow-600 mt-1">waiting to sync</p>
              </div>

              {/* Errors */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Errors</p>
                    <p className="text-2xl font-bold text-red-900">
                      {catalogStatus.statistics.error}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-sm text-red-600 mt-1">need attention</p>
              </div>
            </div>

            {/* Configuration Status */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Configuration Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(catalogStatus.metaConfig).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          value === "Configured" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <span
                        className={`text-xs ${
                          value === "Configured"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Listings</option>
                <option value="enabled">Facebook Shop Enabled</option>
                <option value="disabled">Facebook Shop Disabled</option>
                <option value="synced">Successfully Synced</option>
                <option value="pending">Pending Sync</option>
                <option value="error">Sync Errors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {listing.id}
                          </div>
                          {listing.isTreasure && (
                            <div className="flex items-center mt-1">
                              <Sparkles className="h-3 w-3 text-amber-500 mr-1" />
                              <span className="text-xs text-amber-600">
                                Treasure
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${listing.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {listing.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listing.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getSyncStatusIcon(listing.metaSyncStatus)}
                        <span className="text-sm text-gray-900">
                          {getSyncStatusText(listing.metaSyncStatus)}
                        </span>
                      </div>
                      {listing.metaErrorDetails && (
                        <div className="text-xs text-red-600 mt-1 truncate max-w-32">
                          {listing.metaErrorDetails}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.metaLastSync
                        ? new Date(listing.metaLastSync).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Facebook Shop Toggle */}
                        <Button
                          onClick={() =>
                            toggleFacebookShop(
                              listing.id,
                              !listing.facebookShopEnabled
                            )
                          }
                          variant={
                            listing.facebookShopEnabled ? "default" : "outline"
                          }
                          size="sm"
                        >
                          {listing.facebookShopEnabled ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </Button>

                        {/* Sync Actions */}
                        {listing.facebookShopEnabled && (
                          <>
                            {listing.metaSyncStatus === "success" ? (
                              <Button
                                onClick={() => removeProduct(listing.id)}
                                variant="outline"
                                size="sm"
                                disabled={syncing}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            ) : (
                              <Button
                                onClick={() => syncProduct(listing.id)}
                                variant="outline"
                                size="sm"
                                disabled={syncing}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Sync
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredListings.length} of {listings.length} listings
        </div>
      </div>
    </div>
  );
}
