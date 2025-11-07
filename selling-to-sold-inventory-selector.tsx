/**
 * Inventory Selector Modal Component for Selling To Sold
 *
 * A comprehensive, searchable inventory selection modal with:
 * - Real-time search
 * - Status filtering (Received, Manifested, Trash, Use)
 * - Pagination
 * - Disposition management (Receive, Trash, Use)
 * - Color-coded availability indicators
 * - Click-to-select functionality
 *
 * Usage:
 * ```tsx
 * import InventorySelector from './InventorySelector';
 *
 * function YourComponent() {
 *   const [selectedItem, setSelectedItem] = useState(null);
 *   const [showModal, setShowModal] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowModal(true)}>
 *         Select Inventory
 *       </button>
 *
 *       <InventorySelector
 *         isOpen={showModal}
 *         onClose={() => setShowModal(false)}
 *         onSelect={(item) => {
 *           setSelectedItem(item);
 *           setShowModal(false);
 *         }}
 *         apiEndpoint="/api/inventory/search"
 *       />
 *     </>
 *   );
 * }
 * ```
 */

"use client";
import React, { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface InventoryItem {
  id: string;
  itemNumber: string;
  title?: string;
  description?: string;
  vendor?: string;
  unitRetail?: number;
  unitPurchasePrice?: number;
  quantity: number; // Available to list
  totalQuantity?: number;
  totalInventory?: number;
  postedListings?: number;
  availableToList?: number;
  lotNumber?: string;
  department?: string;
  categoryCode?: string;
  category?: string;
  // Disposition quantities
  receivedQuantity?: number;
  trashedQuantity?: number;
  usedQuantity?: number;
  manifestedQuantity?: number;
  // Lot information
  list?: {
    name?: string;
    briefDescription?: string;
    datePurchased?: string;
  };
}

type DispositionType = "RECEIVED" | "TRASH" | "USE";
type StatusFilter = "ALL" | "MANIFESTED" | "RECEIVED" | "TRASH" | "USE";

interface InventorySelectorProps {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: InventoryItem) => void;

  // API configuration
  apiEndpoint: string; // e.g., "/api/inventory/search"
  apiHeaders?: Record<string, string>; // Optional custom headers

  // Optional configuration
  selectedItemId?: string; // Pre-selected item ID
  allowMultiSelect?: boolean; // Future: allow selecting multiple items
  title?: string; // Modal title
  searchPlaceholder?: string; // Search input placeholder
  primaryColor?: string; // Hex color for branding (default: #D4AF3D)

  // Optional callbacks
  onItemsChanged?: () => void; // Called after disposition changes
  onSearchChange?: (query: string) => void; // Called when search changes
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InventorySelector({
  isOpen,
  onClose,
  onSelect,
  apiEndpoint,
  apiHeaders = {},
  selectedItemId,
  title = "Select Inventory Item",
  searchPlaceholder = "Search inventory...",
  primaryColor = "#D4AF3D",
  onItemsChanged,
  onSearchChange,
}: InventorySelectorProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Inventory data
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("RECEIVED");
  const [showUnlistedOnly, setShowUnlistedOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Disposition modal state
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
  const [isDispositionLoading, setIsDispositionLoading] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch inventory items from API
   */
  const fetchInventoryItems = useCallback(async () => {
    setIsLoadingInventory(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        status: statusFilter,
        unlistedOnly: showUnlistedOnly.toString(),
      });

      const response = await fetch(`${apiEndpoint}?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (data.items) {
        setInventoryItems(data.items);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setInventoryItems(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else {
        console.error("Unexpected API response format:", data);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryItems([]);
      // Optional: Show error toast/notification
    } finally {
      setIsLoadingInventory(false);
    }
  }, [
    apiEndpoint,
    apiHeaders,
    currentPage,
    searchQuery,
    statusFilter,
    showUnlistedOnly,
  ]);

  /**
   * Load inventory when modal opens or filters change
   */
  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems();
    }
  }, [isOpen, fetchInventoryItems]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search

    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  /**
   * Handle unlisted only toggle
   */
  const handleUnlistedToggle = () => {
    setShowUnlistedOnly(!showUnlistedOnly);
    setCurrentPage(1); // Reset to first page on toggle
  };

  /**
   * Handle item selection
   * Only allow selection if item has been received
   */
  const handleItemClick = (item: InventoryItem) => {
    const receivedQty = item.receivedQuantity || 0;

    if (receivedQty === 0) {
      alert(
        "This item must be received before you can list it. Use the 'Receive' button to receive it first."
      );
      return;
    }

    onSelect(item);
  };

  /**
   * Handle pagination
   */
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ============================================================================
  // DISPOSITION HANDLERS
  // ============================================================================

  /**
   * Open disposition modal
   */
  const openDispositionModal = (item: InventoryItem, type: DispositionType) => {
    const maxQty = item.manifestedQuantity || 0;
    setDispositionModal({ isOpen: true, item, type, maxQuantity: maxQty });
    setDispositionQuantity(Math.min(1, maxQty));
    setDispositionNotes("");
  };

  /**
   * Close disposition modal
   */
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

  /**
   * Submit disposition (Receive/Trash/Use)
   */
  const submitDisposition = async () => {
    const { item, type } = dispositionModal;
    if (!item) return;

    try {
      setIsDispositionLoading(true);

      // Call API to update disposition
      const response = await fetch(`${apiEndpoint}/${item.id}/disposition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders,
        },
        body: JSON.stringify({
          status: type,
          quantity: dispositionQuantity,
          notes: dispositionNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        closeDispositionModal();

        // Refresh inventory list
        fetchInventoryItems();

        // Call optional callback
        if (onItemsChanged) {
          onItemsChanged();
        }
      } else {
        alert(data.error || "Failed to update disposition");
      }
    } catch (error) {
      console.error("Error updating disposition:", error);
      alert("Failed to update disposition. Please try again.");
    } finally {
      setIsDispositionLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get color for availability indicator
   */
  const getAvailabilityColor = (available: number) => {
    if (available === 0) return "text-red-600 bg-red-50";
    if (available <= 5) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  /**
   * Get item border color based on status
   */
  const getItemBorderColor = (item: InventoryItem, isSelected: boolean) => {
    if (isSelected) return `border-[${primaryColor}] bg-[${primaryColor}]/10`;
    if (item.manifestedQuantity && item.manifestedQuantity > 0) {
      return "border-orange-300 bg-orange-50";
    }
    if (item.receivedQuantity && item.receivedQuantity > 0) {
      return "border-gray-200 hover:bg-gray-50 cursor-pointer";
    }
    return "border-gray-200";
  };

  // ============================================================================
  // RENDER - DON'T RENDER IF CLOSED
  // ============================================================================

  if (!isOpen) return null;

  // ============================================================================
  // MAIN MODAL RENDER
  // ============================================================================

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
          {/* ===== MODAL HEADER ===== */}
          <div
            className="text-white p-4 flex justify-between items-center"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* ===== MODAL CONTENT ===== */}
          <div className="p-4 flex-1 overflow-auto">
            {/* SEARCH AND FILTER CONTROLS */}
            <div className="mb-4 space-y-4">
              <div className="flex gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRing: `2px solid ${primaryColor}` }}
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex gap-2">
                  {/* Status Filter Dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusFilterChange(e.target.value as StatusFilter)
                    }
                    className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
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
                    onClick={handleUnlistedToggle}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                      showUnlistedOnly
                        ? "text-white shadow-md transform scale-105"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                    }`}
                    style={
                      showUnlistedOnly
                        ? {
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                          }
                        : {}
                    }
                  >
                    {showUnlistedOnly ? "✓ Unlisted Only" : "Show All"}
                  </button>
                </div>
              </div>
            </div>

            {/* LOADING STATE */}
            {isLoadingInventory ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                  <p className="text-gray-500">Loading inventory...</p>
                </div>
              </div>
            ) : (
              <>
                {/* INVENTORY ITEMS LIST */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {inventoryItems.map((item) => {
                    const totalQty =
                      item.totalInventory ||
                      item.totalQuantity ||
                      item.quantity ||
                      0;
                    const receivedQty = item.receivedQuantity || 0;
                    const trashedQty = item.trashedQuantity || 0;
                    const usedQty = item.usedQuantity || 0;
                    const manifestedQty = item.manifestedQuantity || 0;
                    const availableQty =
                      item.availableToList || item.quantity || 0;

                    const hasReceived = receivedQty > 0;
                    const hasTrashed = trashedQty > 0;
                    const hasUsed = usedQty > 0;
                    const hasManifested = manifestedQty > 0;
                    const isSelected = item.id === selectedItemId;

                    return (
                      <div
                        key={item.id}
                        className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${getItemBorderColor(
                          item,
                          isSelected
                        )}`}
                        onClick={() => hasReceived && handleItemClick(item)}
                      >
                        {/* STATUS BADGES AND DISPOSITION ACTIONS */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Received Badge */}
                            {hasReceived && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                <svg
                                  className="h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Received: {receivedQty}
                              </span>
                            )}

                            {/* Trashed Badge */}
                            {hasTrashed && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Trashed: {trashedQty}
                              </span>
                            )}

                            {/* Used Badge */}
                            {hasUsed && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Used: {usedQty}
                              </span>
                            )}

                            {/* Manifested Badge */}
                            {hasManifested && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                <svg
                                  className="h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Manifested: {manifestedQty}
                              </span>
                            )}
                          </div>

                          {/* DISPOSITION ACTION BUTTONS */}
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
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
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
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
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
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Use
                              </button>
                            </div>
                          )}
                        </div>

                        {/* MAIN TITLE AND DESCRIPTION */}
                        <div className="font-medium text-gray-900 mb-1">
                          {item.description ||
                            item.title ||
                            item.itemNumber ||
                            "Untitled Item"}
                        </div>

                        {/* ITEM DETAILS - FIRST ROW */}
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Item #:</span>{" "}
                          {item.itemNumber || "N/A"} |{" "}
                          <span className="font-medium">Lot #:</span>{" "}
                          {item.lotNumber || "N/A"} |{" "}
                          <span className="font-medium">Vendor:</span>{" "}
                          {item.vendor || "N/A"}
                        </div>

                        {/* PRICING AND CATEGORY - SECOND ROW */}
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">MSRP:</span> $
                          {item.unitRetail?.toFixed(2) || "N/A"} |{" "}
                          <span className="font-medium">Unit Cost:</span> $
                          {item.unitPurchasePrice?.toFixed(2) || "N/A"} |{" "}
                          <span className="font-medium">Dept:</span>{" "}
                          {item.department || "N/A"}
                        </div>

                        {/* LOT INFORMATION - THIRD ROW */}
                        {item.list && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Lot:</span>{" "}
                            {item.list.briefDescription ||
                              item.list.name ||
                              "N/A"}
                            {item.list.datePurchased && (
                              <span>
                                {" "}
                                |{" "}
                                <span className="font-medium">
                                  Purchased:
                                </span>{" "}
                                {new Date(
                                  item.list.datePurchased
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* QUANTITY INFORMATION - HIGHLIGHTED ROW */}
                        <div className="flex items-center justify-between bg-gray-50 -mx-1 px-2 py-1 rounded">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              Total Inventory:
                            </span>{" "}
                            {totalQty} |{" "}
                            <span className="font-medium text-gray-700">
                              Already Listed:
                            </span>{" "}
                            {item.postedListings || 0}
                          </div>
                          <div>
                            <span
                              className={`font-bold text-sm px-2 py-1 rounded ${getAvailabilityColor(
                                availableQty
                              )}`}
                            >
                              Remaining to List: {availableQty}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* EMPTY STATE */}
                {inventoryItems.length === 0 && !isLoadingInventory && (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="mt-4 text-gray-500">
                      No inventory items found.
                    </p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}

                {/* PAGINATION */}
                {inventoryItems.length > 0 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== MODAL FOOTER ===== */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {inventoryItems.length} items shown
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ===== DISPOSITION MODAL ===== */}
      {dispositionModal.isOpen && dispositionModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
            {/* Disposition Modal Header */}
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

            {/* Disposition Modal Content */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeDispositionModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={isDispositionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitDisposition}
                  disabled={
                    isDispositionLoading ||
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
                  {isDispositionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export { type InventoryItem, type DispositionType, type StatusFilter };
