"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { formatDateWithTime } from "../../lib/date-utils";
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  DollarSign,
  Percent,
  Truck,
  Filter,
  Eye,
  Copy,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import PromoCodeModal from "../../components/PromoCodeModal";

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  calculatedStatus: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PromoCodesManagementPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "inactive"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchPromoCodes();
  }, [session, filter, searchTerm]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/promo-codes?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete promo code");
      }

      await fetchPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      alert("Failed to delete promo code");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleCreatePromo = async (promoData: any) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create promo code");
      }

      await fetchPromoCodes();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating promo code:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create promo code"
      );
      throw error;
    }
  };

  const handleUpdatePromo = async (promoData: any) => {
    if (!editingPromo) return;

    try {
      const response = await fetch(
        `/api/admin/promo-codes/${editingPromo.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(promoData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update promo code");
      }

      await fetchPromoCodes();
      setEditingPromo(null);
    } catch (error) {
      console.error("Error updating promo code:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update promo code"
      );
      throw error;
    }
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    const { calculatedStatus } = promoCode;

    switch (calculatedStatus) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D4AF3D]/10 text-[#D4AF3D]">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
      case "limit_reached":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Limit Reached
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-4 h-4" />;
      case "fixed_amount":
        return <DollarSign className="w-4 h-4" />;
      case "free_shipping":
        return <Truck className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeDisplay = (promoCode: PromoCode) => {
    switch (promoCode.type) {
      case "percentage":
        return `${promoCode.value}% off`;
      case "fixed_amount":
        return `$${promoCode.value} off`;
      case "free_shipping":
        return "Free shipping";
      default:
        return promoCode.type;
    }
  };

  // Calculate stats
  const activeCount = promoCodes.filter(
    (p) => p.calculatedStatus === "active"
  ).length;
  const expiredCount = promoCodes.filter(
    (p) => p.calculatedStatus === "expired"
  ).length;
  const totalUsage = promoCodes.reduce((sum, p) => sum + p.usageCount, 0);

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-[#D4AF3D]" />
              <h1 className="text-3xl font-bold text-gray-900">
                Promo Code Management
              </h1>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </div>
          <p className="text-gray-600">
            Manage promotional codes for discounts and special offers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4AF3D]/10 rounded-lg">
                <Tag className="h-6 w-6 text-[#D4AF3D]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promoCodes.length}
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
                  Active Codes
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Expired Codes
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {expiredCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalUsage}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search promo codes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D] mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading promo codes...</p>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No promo codes found
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first promo code.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promoCodes.map((promoCode) => (
                    <tr key={promoCode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-medium">
                            {promoCode.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(promoCode.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(promoCode.type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {promoCode.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTypeDisplay(promoCode)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(promoCode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {promoCode.usageCount}
                          {promoCode.usageLimit && (
                            <span className="text-gray-500">
                              /{promoCode.usageLimit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promoCode.usageLimit ? "uses" : "unlimited"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {promoCode.startDate ? (
                            <div>
                              Start: {formatDateWithTime(promoCode.startDate)}
                            </div>
                          ) : (
                            <div>No start date</div>
                          )}
                          {promoCode.endDate ? (
                            <div>
                              End: {formatDateWithTime(promoCode.endDate)}
                            </div>
                          ) : (
                            <div>No end date</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPromo(promoCode)}
                            className="text-[#D4AF3D] hover:text-[#b8932f]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promoCode.id)}
                            disabled={deleting === promoCode.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === promoCode.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <PromoCodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePromo}
      />

      {/* Edit Modal */}
      <PromoCodeModal
        isOpen={!!editingPromo}
        onClose={() => setEditingPromo(null)}
        onSave={handleUpdatePromo}
        promoCode={editingPromo}
      />
    </div>
  );
}
