"use client";

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle,
  Package,
  Trash2,
  User,
  X,
} from "lucide-react";

interface Item {
  id: string;
  description?: string;
  itemNumber?: string;
  totalQuantity?: number; // Total manifest quantity
  receivedQuantity?: number; // Quantity with RECEIVED status
  trashedQuantity?: number; // Quantity with TRASH status
  usedQuantity?: number; // Quantity with USE status
  manifestedQuantity?: number; // Not yet allocated to any status
  department?: string;
  vendor?: string;
  unitRetail?: number;
  list: { id: string; name: string; lotNumber?: string | null };
  notes?: string;
  postedListings?: number;
  dispositions?: Array<{
    id: string;
    status: "RECEIVED" | "TRASH" | "USE";
    quantity: number;
    notes?: string;
  }>;
}

type DispositionType = "RECEIVED" | "TRASH" | "USE";

interface ModalState {
  isOpen: boolean;
  item: Item | null;
  type: DispositionType;
  maxQuantity: number;
}

interface DisplayRow {
  itemId: string;
  type: "RECEIVED" | "TRASH" | "USE" | "MANIFESTED";
  quantity: number;
  item: Item;
  notes?: string;
}

export default function InventoryReceiving() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<
    "ALL" | "MANIFESTED" | "RECEIVED" | "TRASH" | "USE"
  >("ALL");
  const [listId, setListId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    MANIFESTED: 0,
    RECEIVED: 0,
    TRASH: 0,
    USE: 0,
  });

  // Modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    item: null,
    type: "RECEIVED",
    maxQuantity: 0,
  });
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNotes, setModalNotes] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (listId) params.set("listId", listId);
      if (status !== "ALL") params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(
        `/api/admin/inventory/items?${params.toString()}`
      );
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotalPages(data.pagination.totalPages || 1);
        setStatusCounts(data.statusCounts);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 400);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, listId, page]);

  // Convert items to display rows (split by disposition)
  const getDisplayRows = (): DisplayRow[] => {
    const rows: DisplayRow[] = [];

    items.forEach((item) => {
      // Get all dispositions for this item
      const dispositions = item.dispositions || [];

      // Create a row for each disposition status that has quantity
      dispositions.forEach((disp) => {
        if (disp.quantity > 0) {
          rows.push({
            itemId: item.id,
            type: disp.status,
            quantity: disp.quantity,
            item,
            notes: disp.notes,
          });
        }
      });

      // If no dispositions, show as manifested
      if (dispositions.length === 0 && (item.manifestedQuantity ?? 0) > 0) {
        rows.push({
          itemId: item.id,
          type: "MANIFESTED",
          quantity: item.manifestedQuantity ?? 0,
          item,
        });
      }
    });

    return rows;
  };

  const displayRows = getDisplayRows();

  // Open modal for action
  const openModal = (item: Item, type: DispositionType) => {
    const total = item.totalQuantity ?? 0;
    let maxQty = total;

    // Get current notes for this disposition type
    const currentDisposition = item.dispositions?.find(
      (d) => d.status === type
    );
    const currentNotes = currentDisposition?.notes || "";

    setModal({
      isOpen: true,
      item,
      type,
      maxQuantity: maxQty,
    });
    setModalQuantity(Math.min(maxQty, 1));
    setModalNotes(currentNotes);
  };

  // Close modal
  const closeModal = () => {
    setModal({ isOpen: false, item: null, type: "RECEIVED", maxQuantity: 0 });
    setModalQuantity(1);
    setModalNotes("");
  };

  // Handle modal submission
  const handleModalSubmit = async () => {
    if (!modal.item) return;

    if (modalQuantity <= 0 || modalQuantity > modal.maxQuantity) {
      alert(`Please enter a quantity between 1 and ${modal.maxQuantity}`);
      return;
    }

    try {
      // Set/update disposition status (RECEIVED, TRASH, or USE)
      const res = await fetch(
        `/api/admin/inventory/items/${modal.item.id}/disposition`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: modal.type,
            quantity: modalQuantity,
            notes: modalNotes || undefined,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchItems();
      } else {
        alert(data.error || "Failed to update item status");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Failed to update item");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Receiving</h2>
        <p className="text-gray-600">
          Process inventory items: <strong>Receive</strong> for resale, mark as{" "}
          <strong>Trash</strong> (disposed), or <strong>Use</strong>{" "}
          (personal/business use tax). Status updates automatically.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
        >
          <option value="ALL">All</option>
          <option value="MANIFESTED">Manifested</option>
          <option value="RECEIVED">Received</option>
          <option value="TRASH">Trash</option>
          <option value="USE">Use</option>
        </select>

        <button
          onClick={fetchItems}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Counts */}
      <div className="flex gap-4 mb-6">
        <div className="bg-gray-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Manifested:</span>
          <span className="ml-2 font-semibold">{statusCounts.MANIFESTED}</span>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Received:</span>
          <span className="ml-2 font-semibold">{statusCounts.RECEIVED}</span>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Trash:</span>
          <span className="ml-2 font-semibold">{statusCounts.TRASH}</span>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Use:</span>
          <span className="ml-2 font-semibold">{statusCounts.USE}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-50">
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Delivery</th>
              <th className="py-3 px-4 text-center">Manifested</th>
              <th className="py-3 px-4 text-center">Listed</th>
              <th className="py-3 px-4 text-center border-l-2 border-gray-300">
                Total Qty
              </th>
              <th className="py-3 px-4 text-center">Received</th>
              <th className="py-3 px-4 text-center">Trashed</th>
              <th className="py-3 px-4 text-center">Used</th>
              <th className="py-3 px-4 border-l-2 border-gray-300">Status</th>
              <th className="py-3 px-4">Actions</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && displayRows.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items found
                </td>
              </tr>
            )}
            {displayRows.map((row, idx) => {
              const item = row.item;
              const total = item.totalQuantity ?? 0;
              const rec = item.receivedQuantity ?? 0;
              const trashed = item.trashedQuantity ?? 0;
              const used = item.usedQuantity ?? 0;
              const manifested = item.manifestedQuantity ?? 0;
              const posted = item.postedListings ?? 0;

              // Check if this is the first row for this item
              const isFirstRow =
                idx === 0 || displayRows[idx - 1].itemId !== row.itemId;
              const rowsForItem = displayRows.filter(
                (r) => r.itemId === row.itemId
              );
              const rowSpan = rowsForItem.length;

              return (
                <tr
                  key={`${row.itemId}-${row.type}-${idx}`}
                  className={`border-t hover:bg-gray-50 ${
                    row.type === "TRASH"
                      ? "bg-red-50/30"
                      : row.type === "USE"
                      ? "bg-blue-50/30"
                      : ""
                  }`}
                >
                  {/* Item info - only show on first row */}
                  {isFirstRow && (
                    <td className="py-3 px-4" rowSpan={rowSpan}>
                      <div className="font-medium text-gray-900">
                        {item.description || "Untitled"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Item #{item.itemNumber || "N/A"} • Unit:{" "}
                        {typeof item.unitRetail === "number"
                          ? item.unitRetail.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })
                          : "N/A"}{" "}
                        • Vendor: {item.vendor || "N/A"}
                      </div>
                    </td>
                  )}

                  {/* Delivery - only show on first row */}
                  {isFirstRow && (
                    <td className="py-3 px-4" rowSpan={rowSpan}>
                      <div className="text-gray-800 font-medium">
                        {item.list?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.list?.lotNumber || "No lot #"}
                      </div>
                    </td>
                  )}

                  {/* Manifested - only show on first row */}
                  {isFirstRow && (
                    <td className="py-3 px-4 text-center" rowSpan={rowSpan}>
                      <span className="font-semibold text-gray-900">
                        {manifested}
                      </span>
                    </td>
                  )}

                  {/* Listed - only show on first row */}
                  {isFirstRow && (
                    <td className="py-3 px-4 text-center" rowSpan={rowSpan}>
                      <span className="font-medium text-purple-600">
                        {posted}
                      </span>
                    </td>
                  )}

                  {/* Separator + Total Qty - only show on first row */}
                  {isFirstRow && (
                    <td
                      className="py-3 px-4 text-center font-bold border-l-2 border-gray-300"
                      rowSpan={rowSpan}
                    >
                      {total}
                    </td>
                  )}

                  {/* Received - split by row type */}
                  <td className="py-3 px-4 text-center">
                    {row.type === "RECEIVED" ? (
                      <span className="font-medium text-green-600">
                        {row.quantity}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* Trashed - split by row type */}
                  <td className="py-3 px-4 text-center">
                    {row.type === "TRASH" ? (
                      <span className="font-medium text-red-600 flex items-center justify-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        {row.quantity}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* Used - split by row type */}
                  <td className="py-3 px-4 text-center">
                    {row.type === "USE" ? (
                      <span className="font-medium text-blue-600 flex items-center justify-center gap-1">
                        <User className="h-3 w-3" />
                        {row.quantity}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* Status - show per-row status with separator */}
                  <td className="py-3 px-4 border-l-2 border-gray-300">
                    {row.type === "MANIFESTED" && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        MANIFESTED
                      </span>
                    )}
                    {row.type === "RECEIVED" && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        RECEIVED
                      </span>
                    )}
                    {row.type === "TRASH" && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                        <Trash2 className="h-3 w-3" />
                        TRASH
                      </span>
                    )}
                    {row.type === "USE" && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                        <User className="h-3 w-3" />
                        USE
                      </span>
                    )}
                  </td>

                  {/* Actions - only show on first row */}
                  {isFirstRow && (
                    <td className="py-3 px-4" rowSpan={rowSpan}>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openModal(item, "RECEIVED")}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Receive items for resale"
                          disabled={total === 0}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Receive
                        </button>

                        <button
                          onClick={() => openModal(item, "TRASH")}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark as trash (disposed)"
                          disabled={total === 0}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Trash
                        </button>

                        <button
                          onClick={() => openModal(item, "USE")}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark for personal/business use"
                          disabled={total === 0}
                        >
                          <User className="h-3.5 w-3.5" />
                          Use
                        </button>
                      </div>
                    </td>
                  )}

                  {/* Notes - display only (edit via modal) */}
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-600 max-w-xs">
                      {row.type === "MANIFESTED" ? (
                        <span className="text-gray-400 italic">
                          Use modal to add notes
                        </span>
                      ) : (
                        row.notes || (
                          <span className="text-gray-400 italic">
                            Use modal to add notes
                          </span>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modal.isOpen && modal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {modal.type === "RECEIVED" && "Receive Items"}
                {modal.type === "TRASH" && "Mark as Trash"}
                {modal.type === "USE" && "Mark for Use"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Item Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900 mb-1">
                  {modal.item.description || "Untitled"}
                </div>
                <div className="text-sm text-gray-600">
                  Item #{modal.item.itemNumber || "N/A"}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <div className="space-y-1">
                    <div>
                      <strong>Total:</strong> {modal.item.totalQuantity || 0}
                    </div>
                    <div className="text-green-600">
                      <strong>Received:</strong>{" "}
                      {modal.item.receivedQuantity || 0}
                    </div>
                    <div className="text-red-600">
                      <strong>Trashed:</strong>{" "}
                      {modal.item.trashedQuantity || 0}
                    </div>
                    <div className="text-blue-600">
                      <strong>Used:</strong> {modal.item.usedQuantity || 0}
                    </div>
                    <div>
                      <strong>Manifested:</strong>{" "}
                      {modal.item.manifestedQuantity || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={modal.maxQuantity}
                  value={modalQuantity}
                  onChange={(e) =>
                    setModalQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1">
                  Max: {modal.maxQuantity}
                </div>
              </div>

              {/* Notes Input */}
              {modal.type !== "RECEIVED" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {modal.type === "TRASH" && "Reason (optional)"}
                    {modal.type === "USE" && "Category/Reason (optional)"}
                  </label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder={
                      modal.type === "TRASH"
                        ? "e.g., Damaged, broken, unsellable..."
                        : "e.g., Office supplies, personal gift..."
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF3D] resize-none"
                  />
                  {modal.type === "USE" && (
                    <div className="text-xs text-amber-600 mt-1">
                      Items marked for use are subject to use tax.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className={`flex-1 px-4 py-2 rounded-lg transition font-medium text-white ${
                  modal.type === "RECEIVED"
                    ? "bg-green-500 hover:bg-green-600"
                    : modal.type === "TRASH"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {modal.type === "RECEIVED" && "Receive"}
                {modal.type === "TRASH" && "Mark as Trash"}
                {modal.type === "USE" && "Mark for Use"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

