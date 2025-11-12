/**
 * Inventory Data Upload Component
 * 
 * This component provides the UI for:
 * 1. Creating and managing inventory lists
 * 2. Uploading CSV files to populate inventory
 * 3. Viewing inventory items
 * 4. Managing financial data (purchase costs, MSRP)
 * 
 * This is the "Data Upload" tab in the Inventory Management section
 * of the Admin Dashboard.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import CreateInventoryListModal from "../components/CreateInventoryListModal";

interface InventoryList {
  id: string;
  name: string;
  lotNumber?: string | null;
  datePurchased?: Date | null;
  briefDescription?: string | null;
  createdAt: Date;
  _count?: {
    items: number;
  };
  totalUnits?: number;
  totalPurchasePrice?: number;
  totalExtRetailValue?: number;
  msrpPercentage?: number;
}

export default function InventoryDataUpload() {
  const [inventoryLists, setInventoryLists] = useState<InventoryList[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load inventory lists on mount
  useEffect(() => {
    loadInventoryLists();
  }, []);

  /**
   * Fetch all inventory lists from API
   */
  const loadInventoryLists = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/inventory-lists");
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setInventoryLists(data);
      } else {
        setInventoryLists([]);
      }
    } catch (err) {
      console.error("Failed to load inventory lists:", err);
      setInventoryLists([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an inventory list
   */
  const handleDeleteInventoryList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this inventory list?"))
      return;

    try {
      const response = await fetch(`/api/admin/inventory-lists/${listId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Inventory list deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
        loadInventoryLists();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete inventory list");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("Failed to delete inventory list");
      setTimeout(() => setError(""), 5000);
    }
  };

  /**
   * Handle CSV upload to existing list
   */
  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use the first list ID (or implement list selection)
      const listId =
        Array.isArray(inventoryLists) && inventoryLists.length > 0
          ? inventoryLists[0].id
          : "";

      if (!listId) {
        setError(
          "Please create an inventory list first before uploading CSV files"
        );
        setTimeout(() => setError(""), 5000);
        return;
      }

      formData.append("listId", listId);

      const response = await fetch("/api/admin/inventory/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("CSV uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
        loadInventoryLists();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to upload CSV");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("Failed to upload CSV");
      setTimeout(() => setError(""), 5000);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value?: number | null) => {
    if (value == null) return "0.00%";
    return `${value.toFixed(2)}%`;
  };

  return (
    <>
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Inventory Lists Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Lists
            </h3>
            <p className="text-gray-600 mt-1">
              Create and manage your inventory lists. You can create a list and
              upload CSV data in one step.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create List & Upload CSV
          </Button>
        </div>

        {/* Inventory Lists Display */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading...</p>
            </div>
          ) : Array.isArray(inventoryLists) && inventoryLists.length > 0 ? (
            inventoryLists.map((list) => (
              <div
                key={list.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{list.name}</h4>
                    <p className="text-sm text-gray-600">
                      {list._count?.items || 0} items • {list.totalUnits || 0}{" "}
                      total units • Created{" "}
                      {new Date(list.createdAt).toLocaleDateString()}
                    </p>

                    {/* Optional Metadata */}
                    {(list.lotNumber ||
                      list.datePurchased ||
                      list.briefDescription) && (
                      <div className="mt-1 space-y-1">
                        {list.lotNumber && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Lot:</span>{" "}
                            {list.lotNumber}
                          </p>
                        )}
                        {list.datePurchased && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Purchased:</span>{" "}
                            {new Date(list.datePurchased).toLocaleDateString()}
                          </p>
                        )}
                        {list.briefDescription && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Description:</span>{" "}
                            {list.briefDescription}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500">Total Purchase:</span>
                        <span className="font-medium">
                          {formatCurrency(list.totalPurchasePrice)}
                        </span>
                        <span className="text-gray-500">MSRP Value:</span>
                        <span className="font-medium">
                          {formatCurrency(list.totalExtRetailValue)}
                        </span>
                        <span className="text-gray-500">% of MSRP:</span>
                        <span className="font-medium">
                          {formatPercentage(list.msrpPercentage)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500">
                          Avg Unit Purchase:
                        </span>
                        <span className="font-medium text-purple-600">
                          {list.totalPurchasePrice && list.totalExtRetailValue
                            ? `${(
                                (list.totalPurchasePrice /
                                  list.totalExtRetailValue) *
                                100
                              ).toFixed(1)}% of retail per unit`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        // Implement view items functionality
                        alert("View Items functionality - to be implemented");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      View Items
                    </Button>
                    <Button
                      onClick={() => {
                        // Implement edit financials
                        alert("Edit Financials - to be implemented");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      Financials
                    </Button>
                    <Button
                      onClick={() => {
                        // Implement edit list
                        alert("Edit List - to be implemented");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteInventoryList(list.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No inventory lists created yet</p>
              <p className="text-sm">Create your first list to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload CSV Inventory
        </h3>
        <p className="text-gray-600 mb-4">
          Upload a CSV file to populate your inventory lists. The CSV should
          include columns for: lot number, item number, department, description,
          quantity, unit retail, vendor, category, etc.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FileText className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">
              Click to upload CSV file
            </span>
            <span className="text-xs text-gray-500 mt-1">
              or drag and drop
            </span>
          </label>
        </div>
      </div>

      {/* Create Inventory List Modal */}
      <CreateInventoryListModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadInventoryLists}
      />
    </>
  );
}

