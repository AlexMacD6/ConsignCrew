"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Package } from "lucide-react";

interface Item {
  id: string;
  description?: string;
  itemNumber?: string;
  quantity?: number;
  receivedQuantity?: number;
  unitRetail?: number;
  purchasePrice?: number | null;
  vendor?: string;
  list: { id: string; name: string; lotNumber?: string | null };
  notes?: string;
  originalQuantity?: number;
  unitPurchasePrice?: number;
}

export default function InventoryInStock() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [listId, setListId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (listId) params.set("listId", listId);
      params.set("page", String(page));
      params.set("limit", String(limit));
      // Special filter for in-stock
      params.set("inStock", "true");

      const res = await fetch(
        `/api/admin/inventory/items?${params.toString()}`
      );
      const data = await res.json();
      if (data.success) {
        // Expand partially received items to only show the received count rows
        const expanded: Item[] = [];
        for (const it of data.items) {
          const total = it.quantity ?? 0;
          const received = it.receivedQuantity ?? 0;
          if (received <= 0) continue;
          // Show one row per item, but we conceptually treat quantity=received
          expanded.push({ ...it, originalQuantity: total, quantity: received });
        }
        setItems(expanded);
        setTotalPages(data.pagination.totalPages || 1);
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
  }, [q, listId, page]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">In Stock</h3>
          <p className="text-gray-600 text-sm">
            Shows all fully received plus the received portion of partial items.
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
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search description, item #, vendor, dept"
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Delivery</th>
              <th className="py-2 pr-4">In Stock Qty</th>
              <th className="py-2 pr-4">Unit MSRP</th>
              <th className="py-2 pr-4">Unit Purchase</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items in stock
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="py-2 pr-4">
                  <div className="font-medium text-gray-900">
                    {it.description || "Untitled"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Item #{it.itemNumber || "N/A"} • Vendor:{" "}
                    {it.vendor || "N/A"}
                  </div>
                </td>
                <td className="py-2 pr-4">{it.list?.name}</td>
                <td className="py-2 pr-4">{it.quantity ?? 0}</td>
                <td className="py-2 pr-4">
                  {typeof it.unitRetail === "number"
                    ? it.unitRetail.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "N/A"}
                </td>
                <td className="py-2 pr-4">
                  {typeof (it as any).unitPurchasePrice === "number"
                    ? (it as any).unitPurchasePrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "N/A"}
                </td>
                <td className="py-2 pr-4">
                  <div className="text-xs text-gray-600 whitespace-pre-wrap">
                    {it.notes || ""}
                  </div>
                </td>
              </tr>
            ))}
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
