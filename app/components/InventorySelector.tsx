"use client";
import React from "react";

interface InventoryItem {
  id: string;
  itemNumber: string;
  title?: string;
  vendor?: string;
  unitRetail?: number;
  currentStock: number;
}

interface InventorySelectorProps {
  showInventoryModal: boolean;
  setShowInventoryModal: (show: boolean) => void;
  inventoryItems: InventoryItem[];
  inventorySearchQuery: string;
  setInventorySearchQuery: (query: string) => void;
  selectedInventoryItem: InventoryItem | null;
  setSelectedInventoryItem: (item: InventoryItem | null) => void;
  inventoryPage: number;
  setInventoryPage: (page: number) => void;
  inventoryTotalPages: number;
  showAvailableOnly: boolean;
  setShowAvailableOnly: (show: boolean) => void;
  isLoadingInventory: boolean;
}

export default function InventorySelector({
  showInventoryModal,
  setShowInventoryModal,
  inventoryItems,
  inventorySearchQuery,
  setInventorySearchQuery,
  selectedInventoryItem,
  setSelectedInventoryItem,
  inventoryPage,
  setInventoryPage,
  inventoryTotalPages,
  showAvailableOnly,
  setShowAvailableOnly,
  isLoadingInventory,
}: InventorySelectorProps) {
  if (!showInventoryModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select Inventory Item</h3>
          <button
            type="button"
            onClick={() => setShowInventoryModal(false)}
            className="text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 flex-1 overflow-auto">
          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={inventorySearchQuery}
                  onChange={(e) => {
                    setInventoryPage(1);
                    setInventorySearchQuery(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAvailableOnly(!showAvailableOnly);
                    setInventoryPage(1);
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    showAvailableOnly
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {showAvailableOnly ? "Available Only" : "All Items"}
                </button>
              </div>
            </div>
          </div>

          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading inventory...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {inventoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    selectedInventoryItem?.id === item.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedInventoryItem(item);
                  }}
                >
                  <div className="font-medium text-gray-900">
                    {item.title || item.itemNumber || "Untitled Item"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Item #: {item.itemNumber || "N/A"} | Vendor:{" "}
                    {item.vendor || "N/A"} | MSRP: ${item.unitRetail || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inventoryItems.length === 0 && !isLoadingInventory && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found.
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setInventoryPage(Math.max(1, inventoryPage - 1))}
              disabled={inventoryPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {inventoryPage} of {inventoryTotalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setInventoryPage(
                  Math.min(inventoryTotalPages, inventoryPage + 1)
                )
              }
              disabled={inventoryPage === inventoryTotalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {inventoryItems.length} items shown
          </div>
          <button
            type="button"
            onClick={() => setShowInventoryModal(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
