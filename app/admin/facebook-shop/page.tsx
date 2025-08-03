"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  getFacebookCategories,
  getTreasureHubCategoriesForFacebook,
  getCategoryMappingDescription,
} from "../../lib/category-mapping";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Tag,
  Settings,
} from "lucide-react";

interface FacebookApiKey {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface FacebookShopStats {
  total_listings: number;
  facebook_enabled_listings: number;
  last_updated: string | null;
}

export default function FacebookShopAdminPage() {
  const [apiKeys, setApiKeys] = useState<FacebookApiKey[]>([]);
  const [stats, setStats] = useState<FacebookShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [selectedKey, setSelectedKey] = useState<FacebookApiKey | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch API keys and stats
  useEffect(() => {
    fetchApiKeys();
    fetchStats();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/facebook-api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  const fetchStats = async () => {
    try {
      if (apiKeys.length > 0) {
        const firstKey = apiKeys[0];
        const response = await fetch(
          `/api/facebook-shop/health?api_key=${firstKey.apiKey}`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data.statistics);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/facebook-api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          createdBy: "admin", // In real app, get from auth context
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setApiKeys([newKey, ...apiKeys]);
        setFormData({ name: "" });
        setShowModal(false);
        setShowApiKey(newKey.id); // Show the new key
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/facebook-api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedKey.id,
          name: formData.name,
          isActive: selectedKey.isActive,
        }),
      });

      if (response.ok) {
        const updatedKey = await response.json();
        setApiKeys(
          apiKeys.map((key) => (key.id === updatedKey.id ? updatedKey : key))
        );
        setFormData({ name: "" });
        setShowModal(false);
        setSelectedKey(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating API key:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await fetch(`/api/admin/facebook-api-keys?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== id));
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getFeedUrl = (apiKey: string) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://treasurehub.com";
    return `${baseUrl}/api/facebook-shop/feed?api_key=${apiKey}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Facebook Shop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Facebook Shop Integration
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage API keys and monitor Facebook Shop sync
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedKey(null);
                  setFormData({ name: "" });
                  setShowModal(true);
                }}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">
                        Total Listings
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.total_listings}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExternalLink className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">
                        Facebook Enabled
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.facebook_enabled_listings}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <RefreshCw className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">
                        Last Updated
                      </p>
                      <p className="text-sm font-bold text-yellow-900">
                        {stats.last_updated
                          ? new Date(stats.last_updated).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage API keys for Facebook Shop integration
            </p>
          </div>

          <div className="p-6">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No API Keys
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first API key to start syncing with Facebook Shop.
                </p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedKey(null);
                    setFormData({ name: "" });
                    setShowModal(true);
                  }}
                  className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {key.name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              key.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {key.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span>
                              Created:{" "}
                              {new Date(key.createdAt).toLocaleDateString()}
                            </span>
                            <span>Usage: {key.usageCount} requests</span>
                            {key.lastUsed && (
                              <span>
                                Last used:{" "}
                                {new Date(key.lastUsed).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* API Key Display */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {showApiKey === key.id
                                ? key.apiKey
                                : "••••••••••••••••••••••••••••••••"}
                            </span>
                            <button
                              onClick={() =>
                                setShowApiKey(
                                  showApiKey === key.id ? null : key.id
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showApiKey === key.id ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key.apiKey)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Feed URL */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">
                              {getFeedUrl(key.apiKey)}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(getFeedUrl(key.apiKey))
                              }
                              className="text-blue-400 hover:text-blue-600"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setSelectedKey(key);
                            setFormData({ name: key.name });
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-[#D4AF3D] transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#D4AF3D]" />
              Category Management
            </h2>
            <p className="text-gray-600 mt-1">
              View and manage category mappings between TreasureHub and Facebook
              Marketplace
            </p>
          </div>
          <Button
            onClick={() =>
              window.open(
                "/api/facebook-shop/feed?api_key=" + (apiKeys[0]?.apiKey || ""),
                "_blank"
              )
            }
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Product Feed
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facebook Categories Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Facebook Marketplace Categories
            </h3>
            <div className="space-y-2">
              {getFacebookCategories()
                .slice(0, 10)
                .map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">{category}</span>
                    <span className="text-gray-500 text-xs">
                      {getTreasureHubCategoriesForFacebook(category).length}{" "}
                      mappings
                    </span>
                  </div>
                ))}
              {getFacebookCategories().length > 10 && (
                <div className="text-xs text-gray-500 pt-2">
                  +{getFacebookCategories().length - 10} more categories
                </div>
              )}
            </div>
          </div>

          {/* Category Mapping Examples */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Category Mapping Examples
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Furniture → Furniture</span>
                <span className="text-green-600 text-xs">Direct</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Electronics → Electronics</span>
                <span className="text-green-600 text-xs">Direct</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  Sports & Outdoors → Sporting Goods
                </span>
                <span className="text-blue-600 text-xs">Mapped</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  Home & Living → Home & Garden
                </span>
                <span className="text-blue-600 text-xs">Mapped</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  Office Furniture → Office & Business
                </span>
                <span className="text-purple-600 text-xs">Subcategory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Category Distribution
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getFacebookCategories()
                .slice(0, 12)
                .map((category) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-semibold text-[#D4AF3D]">
                      {getTreasureHubCategoriesForFacebook(category).length}
                    </div>
                    <div
                      className="text-xs text-gray-600 truncate"
                      title={category}
                    >
                      {category}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isEditing ? "Edit API Key" : "Create New API Key"}
              </h2>

              <form
                onSubmit={isEditing ? handleUpdateKey : handleCreateKey}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="e.g., Facebook Shop Production"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : isEditing
                      ? "Update Key"
                      : "Create Key"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
