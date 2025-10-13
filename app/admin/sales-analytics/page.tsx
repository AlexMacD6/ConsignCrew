"use client";
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  CreditCard,
  Truck,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SalesAnalytics {
  summary: {
    totalRevenue: number;
    totalSalesTax: number;
    totalPurchaseCost: number;
    totalProfit: number;
    profitMargin: number;
    salesCount: number;
    averageTransactionValue: number;
    monthOverMonthGrowth: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    salesCount: number;
    profit: number;
    salesTax: number;
  }>;
  currentMonth: {
    month: string;
    revenue: number;
    salesCount: number;
    profit: number;
    salesTax: number;
  } | null;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  fulfillmentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  topCategories: Array<{
    department: string;
    revenue: number;
    salesCount: number;
    profit: number;
  }>;
  salesList: Array<{
    itemId: string;
    title: string;
    department: string;
    category: string;
    transactionPrice: number | null;
    purchasePrice: number | null;
    profit: number;
    salesTax: number | null;
    soldAt: string | null;
    paymentMethod: string | null;
    fulfillmentMethod: string | null;
  }>;
}

// Color palette for charts
const COLORS = [
  "#D4AF3D", // Brand gold
  "#825E08", // Brand secondary
  "#F4D03F", // Brand accent
  "#4F46E5", // Indigo
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
];

export default function SalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/sales-analytics");
      const result = await response.json();

      if (response.ok && result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }
    } catch (err) {
      console.error("Failed to fetch sales analytics:", err);
      setError("Failed to load sales analytics");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Format month label
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Export sales data to CSV
  const exportToCSV = () => {
    if (!analytics || !salesList || salesList.length === 0) {
      alert("No sales data to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Date",
      "Item ID",
      "Item Title",
      "Department",
      "Category",
      "Sale Price",
      "Purchase Cost",
      "Profit",
      "Sales Tax",
      "Payment Method",
      "Fulfillment Method",
    ];

    // Convert sales data to CSV rows
    const rows = salesList.map((sale) => [
      sale.soldAt ? new Date(sale.soldAt).toLocaleDateString("en-US") : "",
      sale.itemId,
      `"${sale.title.replace(/"/g, '""')}"`, // Escape quotes in title
      sale.department,
      sale.category,
      sale.transactionPrice?.toFixed(2) || "",
      sale.purchasePrice?.toFixed(2) || "",
      sale.profit.toFixed(2),
      sale.salesTax?.toFixed(2) || "",
      sale.paymentMethod || "",
      sale.fulfillmentMethod || "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sales-report-${new Date().toISOString().split("T")[0]}.csv`
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
          <p className="text-gray-600">Loading sales analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "No data available"}</p>
          <button onClick={fetchAnalytics} className="btn btn-primary btn-md">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    summary,
    monthlyData,
    currentMonth,
    paymentMethods,
    fulfillmentMethods,
    topCategories,
    salesList,
  } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sales Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive overview of your sales performance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span
                className={`text-sm font-semibold ${
                  summary.monthOverMonthGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatPercent(summary.monthOverMonthGrowth)}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Total Revenue
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>

          {/* Sales Count */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Total Sales
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {summary.salesCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Avg: {formatCurrency(summary.averageTransactionValue)}
            </p>
          </div>

          {/* Profit */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-purple-600">
                {formatPercent(summary.profitMargin)}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Total Profit
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalProfit)}
            </p>
          </div>

          {/* Sales Tax */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <Percent className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Sales Tax Collected
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalSalesTax)}
            </p>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Monthly Revenue Trend
            </h2>
            <p className="text-gray-600 text-sm">
              Revenue and profit over time
            </p>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="#6B7280"
              />
              <YAxis
                stroke="#6B7280"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF3D"
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: "#D4AF3D", r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10B981"
                strokeWidth={3}
                name="Profit"
                dot={{ fill: "#10B981", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Payment Methods
              </h2>
              <p className="text-gray-600 text-sm">
                Distribution of payment types
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ method, percentage }) =>
                    `${method}: ${percentage.toFixed(1)}%`
                  }
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {paymentMethods.map((method, index) => (
                <div
                  key={method.method}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {method.method}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {method.count} ({method.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Fulfillment Methods
              </h2>
              <p className="text-gray-600 text-sm">How orders are delivered</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fulfillmentMethods}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="method" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#D4AF3D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {fulfillmentMethods.map((method, index) => (
                <div
                  key={method.method}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D4AF3D]" />
                    <span className="text-sm font-medium text-gray-700">
                      {method.method}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {method.count} ({method.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Top Performing Categories
            </h2>
            <p className="text-gray-600 text-sm">
              Best selling departments by revenue
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Sales
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Profit
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Avg Sale
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCategories.map((category, index) => (
                  <tr
                    key={category.department}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#D4AF3D] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {category.department}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {category.salesCount}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(category.revenue)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600 font-semibold">
                      {formatCurrency(category.profit)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatCurrency(category.revenue / category.salesCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Sales Table */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                All Sales Transactions
              </h2>
              <p className="text-gray-600 text-sm">
                Complete list of all sales (most recent first)
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Sale Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Cost
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Profit
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Tax
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Payment
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Fulfillment
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesList.map((sale) => (
                  <tr
                    key={sale.itemId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {sale.soldAt
                        ? new Date(sale.soldAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {sale.title}
                        </p>
                        <p className="text-xs text-gray-500">{sale.itemId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div>
                        <p className="font-medium">{sale.department}</p>
                        <p className="text-xs text-gray-500">{sale.category}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      {sale.transactionPrice
                        ? formatCurrency(sale.transactionPrice)
                        : "N/A"}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {sale.purchasePrice
                        ? formatCurrency(sale.purchasePrice)
                        : "N/A"}
                    </td>
                    <td
                      className={`text-right py-3 px-4 font-semibold ${
                        sale.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(sale.profit)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {sale.salesTax ? formatCurrency(sale.salesTax) : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sale.paymentMethod || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {sale.fulfillmentMethod || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salesList.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Month Summary */}
        {currentMonth && (
          <div className="bg-gradient-to-r from-[#D4AF3D] to-[#825E08] rounded-lg shadow-lg p-8 mt-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Current Month Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-white/80 text-sm mb-1">Revenue</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(currentMonth.revenue)}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Sales</p>
                <p className="text-3xl font-bold">{currentMonth.salesCount}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Profit</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(currentMonth.profit)}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Tax Collected</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(currentMonth.salesTax)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
