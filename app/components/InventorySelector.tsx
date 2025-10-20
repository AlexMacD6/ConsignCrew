"use client";
import React, { useState } from "react";
import { CheckCircle, Package, AlertCircle } from "lucide-react";

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
  // Receiving fields
  receiveStatus?: "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED";
  receivedQuantity?: number;
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
  showAvailableOnly,
  setShowAvailableOnly,
  isLoadingInventory,
  onItemsChanged,
}: InventorySelectorProps) {
  const [receivingItems, setReceivingItems] = useState<Record<string, boolean>>(
    {}
  );
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});

  if (!showInventoryModal) return null;

  // Handle receiving an item directly from this modal
  const handleReceiveItem = async (
    item: InventoryItem,
    event: React.MouseEvent,
    forceOverride = false
  ) => {
    event.stopPropagation(); // Prevent selecting the item when clicking receive

    const totalQty = item.totalInventory || item.totalQuantity || 0;
    const receivedQty = item.receivedQuantity || 0;
    const remaining = Math.max(totalQty - receivedQty, 0);

    if (remaining <= 0 && !forceOverride) {
      alert("All units have already been received for this item.");
      return;
    }

    const qtyToReceive = receiveQuantities[item.id] || remaining;

    if (qtyToReceive <= 0 || qtyToReceive > remaining) {
      alert(`Please enter a valid quantity between 1 and ${remaining}`);
      return;
    }

    try {
      setReceivingItems((prev) => ({ ...prev, [item.id]: true }));

      const res = await fetch(`/api/admin/inventory/items/${item.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: qtyToReceive,
          override: forceOverride,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.warning) {
          alert(`Success: ${data.warning}`);
        }
        // Refresh the inventory list
        if (onItemsChanged) {
          onItemsChanged();
        }
      } else {
        // Check if override is needed
        if (data.requiresOverride && !forceOverride) {
          const confirmOverride = confirm(
            `${data.error}\n\nThis item has been posted to listings before receiving. Click OK to receive it anyway (out of order receiving), or Cancel to abort.`
          );
          if (confirmOverride) {
            // Retry with override
            handleReceiveItem(item, event, true);
          }
        } else {
          alert(data.error || "Failed to receive item");
        }
      }
    } catch (error) {
      console.error("Error receiving item:", error);
      alert("Failed to receive item");
    } finally {
      setReceivingItems((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Handle item selection - only allow if received
  const handleItemClick = (item: InventoryItem) => {
    const isReceived =
      item.receiveStatus === "RECEIVED" ||
      (item.receivedQuantity && item.receivedQuantity > 0);

    if (!isReceived) {
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
                <button
                  type="button"
                  onClick={() => {
                    setShowAvailableOnly(!showAvailableOnly);
                    setInventoryPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                    showAvailableOnly
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D] shadow-md transform scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#D4AF3D] hover:text-[#D4AF3D] hover:shadow-sm"
                  }`}
                >
                  {showAvailableOnly ? "✓ Available Only" : "Show All Items"}
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
                const totalQty = item.totalInventory || item.totalQuantity || 0;
                const receivedQty = item.receivedQuantity || 0;
                const remaining = Math.max(totalQty - receivedQty, 0);
                const isReceived =
                  item.receiveStatus === "RECEIVED" || receivedQty > 0;
                const isManifested =
                  item.receiveStatus === "MANIFESTED" ||
                  (!isReceived && totalQty > 0);

                return (
                  <div
                    key={item.id}
                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                      selectedInventoryItem?.id === item.id
                        ? "border-[#D4AF3D] bg-[#D4AF3D]/10"
                        : isManifested
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                    } ${!isReceived ? "opacity-90" : ""}`}
                    onClick={() => isReceived && handleItemClick(item)}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isManifested && !isReceived && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                            <AlertCircle className="h-3 w-3" />
                            Not Received - Must Receive First
                          </span>
                        )}
                        {isReceived && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <CheckCircle className="h-3 w-3" />
                            Received ({receivedQty})
                          </span>
                        )}
                      </div>
                      {!isReceived && totalQty > 0 && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={remaining}
                            value={receiveQuantities[item.id] || remaining}
                            onChange={(e) => {
                              e.stopPropagation();
                              setReceiveQuantities((prev) => ({
                                ...prev,
                                [item.id]: parseInt(e.target.value || "0", 10),
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-[#D4AF3D]"
                          />
                          <button
                            onClick={(e) => handleReceiveItem(item, e)}
                            disabled={receivingItems[item.id]}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {receivingItems[item.id] ? (
                              <>
                                <Package className="h-4 w-4 animate-pulse" />
                                Receiving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Receive
                              </>
                            )}
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
    </div>
  );
}
