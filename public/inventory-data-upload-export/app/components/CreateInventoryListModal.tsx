/**
 * Create Inventory List Modal with CSV Upload
 * 
 * This modal component allows admins to create a new inventory list
 * with optional CSV file upload in a single step.
 * 
 * Features:
 * - Auto-generated list name from lot number, date, and description
 * - Optional CSV file upload
 * - Integrated with API endpoint: /api/admin/inventory-lists/create-with-csv
 * 
 * Usage:
 * <CreateInventoryListModal 
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={loadInventoryLists}
 * />
 */

"use client";

import React, { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "../components/ui/button";

interface CreateInventoryListModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateInventoryListModal({
  open,
  onClose,
  onSuccess,
}: CreateInventoryListModalProps) {
  const [newInventoryList, setNewInventoryList] = useState({
    lotNumber: "",
    datePurchased: "",
    briefDescription: "",
    name: "",
  });
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  /**
   * Generate list title from lot number, date, and description
   * Format: MMDDYYYY - Lot Number - Description
   */
  const generateTitle = (
    lotNumber: string,
    datePurchased: string,
    briefDescription: string
  ): string => {
    if (!lotNumber && !datePurchased && !briefDescription) {
      return "";
    }

    let parts: string[] = [];

    // Format date as MMDDYYYY
    if (datePurchased) {
      const date = new Date(datePurchased);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      parts.push(`${month}${day}${year}`);
    }

    if (lotNumber) parts.push(lotNumber);
    if (briefDescription) parts.push(briefDescription);

    return parts.join(" - ");
  };

  /**
   * Update inventory list field and regenerate title
   */
  const updateNewInventoryListData = (field: string, value: string) => {
    const newData = { ...newInventoryList, [field]: value };
    setNewInventoryList({
      ...newData,
      name: generateTitle(
        newData.lotNumber,
        newData.datePurchased,
        newData.briefDescription
      ),
    });
  };

  /**
   * Handle CSV file selection
   */
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedCsvFile(file);
      setError("");
    } else if (file) {
      setError("Please select a valid CSV file");
      event.target.value = ""; // Reset file input
    }
  };

  /**
   * Create inventory list with optional CSV upload
   */
  const handleCreateInventoryList = async () => {
    if (!newInventoryList.name.trim()) {
      setError("Please fill in at least one field to generate a list name");
      return;
    }

    setIsCreatingList(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", newInventoryList.name);
      formData.append("lotNumber", newInventoryList.lotNumber);
      formData.append("datePurchased", newInventoryList.datePurchased);
      formData.append("briefDescription", newInventoryList.briefDescription);

      // Append CSV file if selected
      if (selectedCsvFile) {
        formData.append("file", selectedCsvFile);
      }

      const response = await fetch("/api/admin/inventory-lists/create-with-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Reset form and close modal
        resetModal();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to create inventory list");
      }
    } catch (err) {
      setError("Failed to create inventory list");
    } finally {
      setIsCreatingList(false);
    }
  };

  /**
   * Reset modal state
   */
  const resetModal = () => {
    setNewInventoryList({
      lotNumber: "",
      datePurchased: "",
      briefDescription: "",
      name: "",
    });
    setSelectedCsvFile(null);
    setError("");
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isCreatingList) {
      resetModal();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Create Inventory List</h3>

        <div className="space-y-6">
          {/* List Information Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                value={newInventoryList.lotNumber}
                onChange={(e) =>
                  updateNewInventoryListData("lotNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                placeholder="e.g., 6098887"
                disabled={isCreatingList}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Purchased
              </label>
              <input
                type="date"
                value={newInventoryList.datePurchased}
                onChange={(e) =>
                  updateNewInventoryListData("datePurchased", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                disabled={isCreatingList}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description
              </label>
              <input
                type="text"
                value={newInventoryList.briefDescription}
                onChange={(e) =>
                  updateNewInventoryListData("briefDescription", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                placeholder="e.g., 6 Pallets of Patio Furniture"
                disabled={isCreatingList}
              />
            </div>

            {/* Generated Title Preview */}
            {newInventoryList.name && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated List Name:
                </label>
                <p className="text-sm text-gray-900 font-medium">
                  {newInventoryList.name}
                </p>
              </div>
            )}
          </div>

          {/* CSV File Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload a CSV file to populate the list immediately. You can also
              add items later.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                className="hidden"
                id="csv-upload-modal"
                disabled={isCreatingList}
              />
              <label
                htmlFor="csv-upload-modal"
                className={`cursor-pointer flex flex-col items-center ${
                  isCreatingList ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FileText className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">
                  {selectedCsvFile ? selectedCsvFile.name : "Click to upload CSV"}
                </span>
                {!selectedCsvFile && (
                  <span className="text-xs text-gray-500 mt-1">
                    or drag and drop
                  </span>
                )}
              </label>
            </div>

            {selectedCsvFile && (
              <button
                onClick={() => setSelectedCsvFile(null)}
                disabled={isCreatingList}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            onClick={handleCreateInventoryList}
            className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white flex items-center justify-center gap-2"
            disabled={isCreatingList || !newInventoryList.name.trim()}
          >
            {isCreatingList ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create List
              </>
            )}
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={isCreatingList}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

