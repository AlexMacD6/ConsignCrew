"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle,
  Package,
  Trash2,
  User,
} from "lucide-react";

interface Item {
  id: string;
  description?: string;
  itemNumber?: string;
  quantity?: number;
  receivedQuantity?: number;
  receiveStatus: "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED";
  department?: string;
  vendor?: string;
  unitRetail?: number;
  list: { id: string; name: string; lotNumber?: string | null };
  notes?: string;
  // Disposition fields
  disposition?: "TRASH" | "USE" | null;
  dispositionQuantity?: number;
  dispositionNotes?: string;
  // Listing tracking
  postedListings?: number;
}

export default function InventoryReceiving() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | Item["receiveStatus"]>("ALL");
  const [listId, setListId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    MANIFESTED: 0,
    PARTIALLY_RECEIVED: 0,
    RECEIVED: 0,
  });
  const [inputQuantities, setInputQuantities] = useState<
    Record<string, number>
  >({});

  // Track disposition change quantities separately
  const [dispositionQuantities, setDispositionQuantities] = useState<
    Record<string, number>
  >({});

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

        // Initialize input quantities for receiving
        const defaults: Record<string, number> = {};
        const dispDefaults: Record<string, number> = {};
        data.items.forEach((it: Item) => {
          const remaining = Math.max(
            (it.quantity || 0) - (it.receivedQuantity || 0),
            0
          );
          defaults[it.id] = remaining > 0 ? remaining : 0;

          // Initialize disposition quantity to 1 by default for received items
          if ((it.receivedQuantity || 0) > 0) {
            dispDefaults[it.id] = 1;
          }
        });
        setInputQuantities(defaults);
        setDispositionQuantities(dispDefaults);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query - wait for user to stop typing before fetching
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 400); // Wait 400ms after user stops typing

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, listId, page]);

  const receive = async (id: string, forceOverride = false) => {
    // Get the item to calculate unreceived quantity
    const item = items.find((it) => it.id === id);
    if (!item) return;

    const total = item.quantity ?? 0;
    const rec = item.receivedQuantity ?? 0;
    const posted = item.postedListings ?? 0;
    const dispositioned = item.dispositionQuantity ?? 0;

    // If total is 0 but we have posted listings, infer the total should at least match posted
    const effectiveTotal = Math.max(total, posted, rec + dispositioned);
    const unreceived = Math.max(effectiveTotal - rec, 0);

    // Use inputQuantities if set, otherwise default to unreceived
    const qty = inputQuantities[id] || unreceived;
    if (!qty || qty <= 0) return;

    const res = await fetch(`/api/admin/inventory/items/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: qty,
        override: forceOverride,
      }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.warning) {
        alert(`Success: ${data.warning}`);
      }
      fetchItems();
    } else {
      // Check if override is needed
      if (data.requiresOverride && !forceOverride) {
        const confirmOverride = confirm(
          `${data.error}\n\nThis item has been posted to listings before receiving. Click OK to receive it anyway (out of order receiving), or Cancel to abort.`
        );
        if (confirmOverride) {
          // Retry with override
          receive(id, true);
        }
      } else {
        alert(data.error || "Failed to receive item");
      }
    }
  };

  // Mark item as TRASH (disposed)
  const markAsTrash = async (id: string) => {
    const qty = inputQuantities[id] ?? 0;
    if (!qty || qty <= 0) return;

    const notes = prompt(
      `Mark ${qty} unit(s) as TRASH?\n\nOptional: Enter reason (damage, unsellable, etc.):`
    );
    if (notes === null) return; // User cancelled

    const res = await fetch(`/api/admin/inventory/items/${id}/disposition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disposition: "TRASH",
        quantity: qty,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchItems();
    } else {
      alert(data.error || "Failed to mark as trash");
    }
  };

  // Mark item as USE (personal/business use)
  const markAsUse = async (id: string) => {
    const qty = inputQuantities[id] ?? 0;
    if (!qty || qty <= 0) return;

    const notes = prompt(
      `Mark ${qty} unit(s) for PERSONAL/BUSINESS USE?\n\nThese will be subject to use tax.\nOptional: Enter reason or category:`
    );
    if (notes === null) return; // User cancelled

    const res = await fetch(`/api/admin/inventory/items/${id}/disposition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disposition: "USE",
        quantity: qty,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchItems();
    } else {
      alert(data.error || "Failed to mark as use");
    }
  };

  // Change disposition status for already received items
  const changeDisposition = async (
    id: string,
    newDisposition: "RECEIVED" | "TRASH" | "USE"
  ) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    // Get the quantity to change
    const qty = dispositionQuantities[id] || 1;
    const receivedQty = item.receivedQuantity || 0;

    // Validate quantity
    if (qty <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }
    if (qty > receivedQty) {
      alert(`Cannot change ${qty} units. Only ${receivedQty} units received.`);
      return;
    }

    // If changing to TRASH or USE, prompt for notes
    let notes = null;
    if (newDisposition === "TRASH") {
      notes = prompt(
        `Mark ${qty} unit(s) as TRASH?\n\nOptional: Enter reason (damage, unsellable, etc.):`
      );
      if (notes === null) return; // User cancelled
    } else if (newDisposition === "USE") {
      notes = prompt(
        `Mark ${qty} unit(s) for USE (personal/business)?\n\nThese will be subject to use tax.\nOptional: Enter reason or category:`
      );
      if (notes === null) return; // User cancelled
    }

    const res = await fetch(`/api/admin/inventory/items/${id}/disposition`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disposition: newDisposition,
        quantity: qty,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchItems();
    } else {
      alert(data.error || "Failed to update disposition");
    }
  };

  const statusChip = (s: Item["receiveStatus"]) => {
    const map: any = {
      MANIFESTED: "bg-gray-100 text-gray-700",
      PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-800",
      RECEIVED: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[s]}`}>
        {s.replace("_", " ")}
      </span>
    );
  };

  // Disposition chip for visual indication
  const dispositionChip = (d: Item["disposition"]) => {
    if (!d) return null;
    const map: any = {
      TRASH: "bg-red-100 text-red-800",
      USE: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${map[d]} ml-2`}
      >
        {d}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Receiving</h3>
          <p className="text-gray-600 text-sm">
            Process inventory items: <strong>Receive</strong> for resale, mark
            as <strong>Trash</strong> (disposed), or <strong>Use</strong>{" "}
            (personal/business use tax). Status updates automatically.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 border rounded px-2 py-1">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search description, item #, vendor, dept"
            className="outline-none text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as any);
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="ALL">All</option>
          <option value="MANIFESTED">
            Manifested ({statusCounts.MANIFESTED})
          </option>
          <option value="PARTIALLY_RECEIVED">
            Partially Received ({statusCounts.PARTIALLY_RECEIVED})
          </option>
          <option value="RECEIVED">Received ({statusCounts.RECEIVED})</option>
        </select>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Delivery</th>
              <th className="py-2 pr-4">Total Qty</th>
              <th className="py-2 pr-4">Received</th>
              <th className="py-2 pr-4">Listed</th>
              <th className="py-2 pr-4">Remaining</th>
              <th className="py-2 pr-4">Disposed</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Action Qty</th>
              <th className="py-2 pr-4">Actions</th>
              <th className="py-2 pr-4">Notes</th>
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
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items found
                </td>
              </tr>
            )}
            {items.map((it) => {
              const total = it.quantity ?? 0;
              const rec = it.receivedQuantity ?? 0;
              const posted = it.postedListings ?? 0;
              const dispositioned = it.dispositionQuantity ?? 0;

              // If total is 0 but we have posted listings, infer the total should at least match posted
              const effectiveTotal = Math.max(
                total,
                posted,
                rec + dispositioned
              );

              const remaining = Math.max(
                effectiveTotal - rec - posted - dispositioned,
                0
              );
              const unreceived = Math.max(effectiveTotal - rec, 0); // For override cases

              return (
                <tr key={it.id} className="border-t">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-gray-900">
                      {it.description || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Item #{it.itemNumber || "N/A"} • Unit:{" "}
                      {typeof it.unitRetail === "number"
                        ? it.unitRetail.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "N/A"}{" "}
                      • Vendor: {it.vendor || "N/A"}
                    </div>
                    {it.disposition && it.dispositionNotes && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        {it.disposition} Note: {it.dispositionNotes}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-gray-800">{it.list?.name}</div>
                  </td>
                  <td className="py-2 pr-4">
                    {total === 0 && posted > 0 ? (
                      <div className="flex items-center gap-1">
                        <span
                          className="text-gray-400 line-through"
                          title="Database value is incorrect"
                        >
                          {total}
                        </span>
                        <span
                          className="text-green-600 font-medium"
                          title="Inferred from received + listed"
                        >
                          {effectiveTotal}
                        </span>
                      </div>
                    ) : (
                      total
                    )}
                  </td>
                  <td className="py-2 pr-4">{rec}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium text-blue-600">
                      {it.postedListings ?? 0}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{remaining}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {rec > 0 ? (
                      <div className="flex flex-col gap-2">
                        {/* Quantity Input for Disposition Change */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={rec}
                            value={dispositionQuantities[it.id] || 1}
                            onChange={(e) =>
                              setDispositionQuantities((p) => ({
                                ...p,
                                [it.id]: parseInt(e.target.value || "1", 10),
                              }))
                            }
                            className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                          />
                          <span className="text-xs text-gray-500">
                            of {rec}
                          </span>
                        </div>

                        {/* Disposition Dropdown */}
                        <select
                          value={it.disposition || "RECEIVED"}
                          onChange={(e) =>
                            changeDisposition(
                              it.id,
                              e.target.value as "RECEIVED" | "TRASH" | "USE"
                            )
                          }
                          className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                        >
                          <option value="RECEIVED">Received (Normal)</option>
                          <option value="TRASH">Trash (Disposed)</option>
                          <option value="USE">Use (Personal/Business)</option>
                        </select>

                        {/* Show current disposition info if not normal received */}
                        {it.disposition && (
                          <div>
                            <div className="font-medium text-sm">
                              {dispositioned} {dispositionChip(it.disposition)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{statusChip(it.receiveStatus)}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min={1}
                      max={unreceived}
                      value={inputQuantities[it.id] || unreceived}
                      onChange={(e) =>
                        setInputQuantities((p) => ({
                          ...p,
                          [it.id]: parseInt(e.target.value || "0", 10),
                        }))
                      }
                      className="w-20 border rounded px-2 py-1"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Available: {remaining}
                      {unreceived > remaining && (
                        <span className="text-orange-600 font-medium">
                          {" "}
                          (Override available)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => receive(it.id)}
                        disabled={
                          unreceived <= 0 ||
                          (inputQuantities[it.id] || unreceived) <= 0
                        }
                        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" /> Receive
                      </button>
                      <button
                        onClick={() => markAsTrash(it.id)}
                        disabled={
                          remaining <= 0 || (inputQuantities[it.id] ?? 0) <= 0
                        }
                        className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Trash
                      </button>
                      <button
                        onClick={() => markAsUse(it.id)}
                        disabled={
                          remaining <= 0 || (inputQuantities[it.id] ?? 0) <= 0
                        }
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 text-xs flex items-center gap-1"
                      >
                        <User className="h-3 w-3" /> Use
                      </button>
                    </div>
                  </td>
                  <td className="py-2 pr-4 w-72">
                    <div className="flex items-center gap-2">
                      <input
                        name={`notes-${it.id}`}
                        autoComplete="off"
                        defaultValue={it.notes || ""}
                        onBlur={async (e) => {
                          const newNotes = e.target.value;
                          try {
                            await fetch(
                              `/api/admin/inventory/items/${it.id}/notes`,
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ notes: newNotes }),
                              }
                            );
                          } catch {}
                        }}
                        placeholder="Leave a Note Here"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
