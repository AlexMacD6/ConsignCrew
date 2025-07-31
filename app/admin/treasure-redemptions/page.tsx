"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TreasureRedemption {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  paymentMethod: string;
  venmoUsername?: string;
  cashAppUsername?: string;
  zelleEmail?: string;
  socialMediaPost?: string;
  socialMediaBonus: boolean;
  paymentStatus: string;
  treasureHubCredit: boolean;
  earlyAccessSent: boolean;
  createdAt: string;
  expiresAt: string;
}

interface TreasureCode {
  id: string;
  code: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  createdAt: string;
}

interface Summary {
  totalRedemptions: number;
  pendingPayments: number;
  paidRedemptions: number;
  socialMediaBonuses: number;
  totalCashValue: number;
}

export default function TreasureRedemptionsAdmin() {
  const [redemptions, setRedemptions] = useState<TreasureRedemption[]>([]);
  const [treasureCodes, setTreasureCodes] = useState<TreasureCode[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/treasure-redemptions");
      const data = await response.json();

      if (response.ok) {
        setRedemptions(data.redemptions);
        setTreasureCodes(data.treasureCodes);
        setSummary(data.summary);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (redemptionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/treasure-redemptions/${redemptionId}/mark-paid`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Refresh data
        fetchData();
      } else {
        setError("Failed to mark payment as completed");
      }
    } catch (error) {
      setError("Failed to mark payment as completed");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentInfo = (redemption: TreasureRedemption) => {
    switch (redemption.paymentMethod) {
      case "venmo":
        return `@${redemption.venmoUsername}`;
      case "cashapp":
        return `$${redemption.cashAppUsername}`;
      case "zelle":
        return redemption.zelleEmail;
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2">
                <Image
                  src="/TreasureHub - Logo.png"
                  alt="TreasureHub"
                  width={200}
                  height={60}
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Treasure Redemptions Admin
              </h1>
            </div>
            <button
              onClick={fetchData}
              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">
                {summary.totalRedemptions}
              </div>
              <div className="text-gray-600">Total Redemptions</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-amber-600">
                {summary.pendingPayments}
              </div>
              <div className="text-gray-600">Pending Payments</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {summary.paidRedemptions}
              </div>
              <div className="text-gray-600">Completed Payments</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">
                ${summary.totalCashValue}
              </div>
              <div className="text-gray-600">Total Cash Value</div>
            </div>
          </div>
        )}

        {/* Treasure Codes */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Treasure Codes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {treasureCodes.map((code) => (
                  <tr key={code.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-lg">{code.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          code.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.currentUses} / {code.maxUses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(code.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Redemptions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Redemptions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social Bonus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redemptions.map((redemption) => (
                  <tr key={redemption.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {redemption.firstName} {redemption.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {redemption.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {redemption.email}
                      </div>
                      {redemption.phone && (
                        <div className="text-sm text-gray-500">
                          {redemption.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {redemption.paymentMethod}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPaymentInfo(redemption)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          redemption.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : redemption.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {redemption.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {redemption.socialMediaBonus ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          +$10
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(redemption.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {redemption.paymentStatus === "pending" && (
                        <button
                          onClick={() => markAsPaid(redemption.id)}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
