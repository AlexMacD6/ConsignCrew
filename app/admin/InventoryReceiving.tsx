"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, CheckCircle, Package } from "lucide-react";

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
        const defaults: Record<string, number> = {};
        data.items.forEach((it: Item) => {
          const remaining = Math.max(
            (it.quantity || 0) - (it.receivedQuantity || 0),
            0
          );
          defaults[it.id] = remaining > 0 ? remaining : 0;
        });
        setInputQuantities(defaults);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, listId, page]);

  const receive = async (id: string) => {
    const qty = inputQuantities[id] ?? 0;
    if (!qty || qty <= 0) return;
    const res = await fetch(`/api/admin/inventory/items/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    const data = await res.json();
    if (data.success) {
      fetchItems();
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Receiving</h3>
          <p className="text-gray-600 text-sm">
            Confirm and record quantities received for each item. Status updates
            automatically.
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
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Received</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Receive Now</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items found
                </td>
              </tr>
            )}
            {items.map((it) => {
              const total = it.quantity ?? 0;
              const rec = it.receivedQuantity ?? 0;
              const remaining = Math.max(total - rec, 0);
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
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-gray-800">{it.list?.name}</div>
                  </td>
                  <td className="py-2 pr-4">{total}</td>
                  <td className="py-2 pr-4">{rec}</td>
                  <td className="py-2 pr-4">{statusChip(it.receiveStatus)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={remaining}
                        value={inputQuantities[it.id] ?? 0}
                        onChange={(e) =>
                          setInputQuantities((p) => ({
                            ...p,
                            [it.id]: parseInt(e.target.value || "0", 10),
                          }))
                        }
                        className="w-20 border rounded px-2 py-1"
                      />
                      <button
                        onClick={() => receive(it.id)}
                        disabled={
                          remaining <= 0 || (inputQuantities[it.id] ?? 0) <= 0
                        }
                        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" /> Receive
                      </button>
                      <div className="text-xs text-gray-500">
                        Remaining: {remaining}
                      </div>
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
