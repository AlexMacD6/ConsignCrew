"use client";
import React, { useState } from "react";
import { CheckCircle, Package, AlertCircle, Trash2, User } from "lucide-react";

interface InventoryItem {
  id: string;
  itemNumber: string;
  title?: string;
  vendor?: string;
  unitRetail?: number;
  quantity: number; // This is now availableToList from API
  totalQuantity?: number; // This is totalInventory from API
  totalInventory?: number; // Alternative field name from API
  postedListings?: number;
  availableToList?: number; // Direct field from API
  lotNumber?: string;
  unitPurchasePrice?: number;
  description?: string;
  department?: string;
  categoryCode?: string;
  category?: string;
  list?: {
    name?: string;
    briefDescription?: string;
    datePurchased?: string;
  };
  // Disposition fields
  receivedQuantity?: number;
  trashedQuantity?: number;
  usedQuantity?: number;
  manifestedQuantity?: number;
  dispositions?: Array<{
    id: string;
    status: "RECEIVED" | "TRASH" | "USE";
    quantity: number;
    notes?: string;
  }>;
}

type DispositionType = "RECEIVED" | "TRASH" | "USE";

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
  statusFilter: "ALL" | "MANIFESTED" | "RECEIVED" | "TRASH" | "USE";
  setStatusFilter: (
    status: "ALL" | "MANIFESTED" | "RECEIVED" | "TRASH" | "USE"
  ) => void;
  showUnlistedOnly: boolean;
  setShowUnlistedOnly: (show: boolean) => void;
  isLoadingInventory: boolean;
  onItemsChanged?: () => void; // Callback to refresh inventory list after receiving
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
  statusFilter,
  setStatusFilter,
  showUnlistedOnly,
  setShowUnlistedOnly,
  isLoadingInventory,
  onItemsChanged,
}: InventorySelectorProps) {
  const [receivingItems, setReceivingItems] = useState<Record<string, boolean>>(
    {}
  );
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});

  // Modal state for disposition actions
  const [dispositionModal, setDispositionModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    type: DispositionType;
    maxQuantity: number;
  }>({
    isOpen: false,
    item: null,
    type: "RECEIVED",
    maxQuantity: 0,
  });
  const [dispositionQuantity, setDispositionQuantity] = useState(1);
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [dispositionLoading, setDispositionLoading] = useState(false);

  if (!showInventoryModal) return null;

  // Open disposition modal
  const openDispositionModal = (item: InventoryItem, type: DispositionType) => {
    const maxQty = item.manifestedQuantity || 0;
    setDispositionModal({ isOpen: true, item, type, maxQuantity: maxQty });
    setDispositionQuantity(Math.min(1, maxQty));
    setDispositionNotes("");
  };

  // Close disposition modal
  const closeDispositionModal = () => {
    setDispositionModal({
      isOpen: false,
      item: null,
      type: "RECEIVED",
      maxQuantity: 0,
    });
    setDispositionQuantity(1);
    setDispositionNotes("");
  };

  // Submit disposition
  const submitDisposition = async () => {
    const { item, type } = dispositionModal;
    if (!item) return;

    try {
      setDispositionLoading(true);
      const res = await fetch(
        `/api/admin/inventory/items/${item.id}/disposition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: type,
            quantity: dispositionQuantity,
            notes: dispositionNotes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        closeDispositionModal();
        // Refresh the inventory list
        if (onItemsChanged) {
          onItemsChanged();
        }
      } else {
        alert(data.error || "Failed to set disposition");
      }
    } catch (error) {
      console.error("Error setting disposition:", error);
      alert("Failed to set disposition");
    } finally {
      setDispositionLoading(false);
    }
  };

  // Handle item selection - only allow if received
  const handleItemClick = (item: InventoryItem) => {
    // Check if item has received quantity > 0
    const receivedQty = item.receivedQuantity || 0;
    if (receivedQty === 0) {
      alert(
        "This item must be received before you can list it. Use the 'Receive' button to receive it first."
      );
      return;
    }

    setSelectedInventoryItem(item);
    setShowInventoryModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#D4AF3D] text-white p-4 flex justify-between items-center">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-[#D4AF3D]"
                />
              </div>
              <div className="flex gap-2">
                {/* Status Filter Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setInventoryPage(1);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 bg-white hover:border-[#D4AF3D] focus:border-[#D4AF3D] focus:ring-2 focus:ring-[#D4AF3D] transition-all duration-200"
                >
                  <option value="RECEIVED">Received</option>
                  <option value="ALL">All Items</option>
                  <option value="MANIFESTED">Manifested</option>
                  <option value="TRASH">Trashed</option>
                  <option value="USE">Used</option>
                </select>

                {/* Unlisted Only Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlistedOnly(!showUnlistedOnly);
                    setInventoryPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                    showUnlistedOnly
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D] shadow-md transform scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#D4AF3D] hover:text-[#D4AF3D] hover:shadow-sm"
                  }`}
                >
                  {showUnlistedOnly ? "✓ Unlisted Only" : "Show All"}
                </button>
              </div>
            </div>
          </div>

          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading inventory...</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {inventoryItems.map((item) => {
                const totalQty =
                  item.totalInventory ||
                  item.totalQuantity ||
                  item.quantity ||
                  0;

                // Get quantities from API (calculated from InventoryDisposition records)
                const receivedQty = item.receivedQuantity || 0;
                const trashedQty = item.trashedQuantity || 0;
                const usedQty = item.usedQuantity || 0;
                const manifestedQty = item.manifestedQuantity || 0;

                // Determine which statuses this item has
                const hasReceived = receivedQty > 0;
                const hasTrashed = trashedQty > 0;
                const hasUsed = usedQty > 0;
                const hasManifested = manifestedQty > 0;

                return (
                  <div
                    key={item.id}
                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                      selectedInventoryItem?.id === item.id
                        ? "border-[#D4AF3D] bg-[#D4AF3D]/10"
                        : hasManifested
                        ? "border-orange-300 bg-orange-50"
                        : hasReceived
                        ? "border-gray-200 hover:bg-gray-50 cursor-pointer"
                        : "border-gray-200"
                    }`}
                    onClick={() => hasReceived && handleItemClick(item)}
                  >
                    {/* Status Badges and Disposition Actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {hasReceived && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <CheckCircle className="h-3 w-3" />
                            Received: {receivedQty}
                          </span>
                        )}
                        {hasTrashed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            <Trash2 className="h-3 w-3" />
                            Trashed: {trashedQty}
                          </span>
                        )}
                        {hasUsed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            <User className="h-3 w-3" />
                            Used: {usedQty}
                          </span>
                        )}
                        {hasManifested && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                            <AlertCircle className="h-3 w-3" />
                            Manifested: {manifestedQty}
                          </span>
                        )}
                      </div>

                      {/* Disposition Action Buttons - only show for manifested items */}
                      {hasManifested && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDispositionModal(item, "RECEIVED");
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition"
                            title="Receive items for resale"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Receive
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDispositionModal(item, "TRASH");
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"
                            title="Mark as trash (disposed)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Trash
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDispositionModal(item, "USE");
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                            title="Mark for personal use or tax write-off"
                          >
                            <User className="h-3.5 w-3.5" />
                            Use
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Main title and description */}
                    <div className="font-medium text-gray-900 mb-1">
                      {item.description ||
                        item.title ||
                        item.itemNumber ||
                        "Untitled Item"}
                    </div>

                    {/* Item details - first row */}
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Item #:</span>{" "}
                      {item.itemNumber || "N/A"} |
                      <span className="font-medium"> Lot #:</span>{" "}
                      {item.lotNumber || "N/A"} |
                      <span className="font-medium"> Vendor:</span>{" "}
                      {item.vendor || "N/A"}
                    </div>

                    {/* Pricing and category - second row */}
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">MSRP:</span> $
                      {item.unitRetail?.toFixed(2) || "N/A"} |
                      <span className="font-medium"> Unit Cost:</span> $
                      {item.unitPurchasePrice?.toFixed(2) || "N/A"} |
                      <span className="font-medium"> Dept:</span>{" "}
                      {item.department || "N/A"}
                    </div>

                    {/* Lot information - third row */}
                    {item.list && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Lot:</span>{" "}
                        {item.list.briefDescription || item.list.name || "N/A"}
                        {item.list.datePurchased && (
                          <span>
                            {" "}
                            | <span className="font-medium">
                              Purchased:
                            </span>{" "}
                            {new Date(
                              item.list.datePurchased
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quantity information - highlighted row */}
                    <div className="flex items-center justify-between bg-gray-50 -mx-1 px-2 py-1 rounded">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          Total Inventory:
                        </span>{" "}
                        {item.totalInventory || item.totalQuantity || 0} |
                        <span className="font-medium text-gray-700">
                          {" "}
                          Already Listed:
                        </span>{" "}
                        {item.postedListings || 0}
                      </div>
                      <div>
                        <span
                          className={`font-bold text-sm px-2 py-1 rounded ${
                            (item.availableToList || item.quantity || 0) === 0
                              ? "text-red-600 bg-red-50"
                              : (item.availableToList || item.quantity || 0) <=
                                5
                              ? "text-orange-600 bg-orange-50"
                              : "text-green-600 bg-green-50"
                          }`}
                        >
                          Remaining to List:{" "}
                          {item.availableToList || item.quantity || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Disposition Modal */}
      {dispositionModal.isOpen && dispositionModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div
              className={`p-4 text-white ${
                dispositionModal.type === "RECEIVED"
                  ? "bg-green-500"
                  : dispositionModal.type === "TRASH"
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
            >
              <h3 className="text-lg font-semibold">
                {dispositionModal.type === "RECEIVED"
                  ? "Receive Items"
                  : dispositionModal.type === "TRASH"
                  ? "Trash Items"
                  : "Mark as Used"}
              </h3>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Item:</span>{" "}
                  {dispositionModal.item.description ||
                    dispositionModal.item.itemNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Manifested Quantity:</span>{" "}
                  {dispositionModal.maxQuantity}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={dispositionModal.maxQuantity}
                  value={dispositionQuantity}
                  onChange={(e) =>
                    setDispositionQuantity(parseInt(e.target.value || "1", 10))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-[#D4AF3D]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  placeholder={
                    dispositionModal.type === "TRASH"
                      ? "e.g., damaged, broken, unsellable"
                      : dispositionModal.type === "USE"
                      ? "e.g., tax write-off, personal use"
                      : "Any additional notes"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-[#D4AF3D] resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeDispositionModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={dispositionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitDisposition}
                  disabled={
                    dispositionLoading ||
                    dispositionQuantity <= 0 ||
                    dispositionQuantity > dispositionModal.maxQuantity
                  }
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    dispositionModal.type === "RECEIVED"
                      ? "bg-green-500 hover:bg-green-600"
                      : dispositionModal.type === "TRASH"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {dispositionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
