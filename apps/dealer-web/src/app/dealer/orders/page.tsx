"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOrders } from "@/lib/services/dealerApi";
import api from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DataTable } from "@/components/portal/DataTable";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { StatusChip } from "@/components/portal/StatusChip";
import { Card, CardContent, Button } from "@repo/ui";

const statusTone: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  Processing: "blue",
  Ready: "amber",
  Shipped: "green",
  Backorder: "red",
};

const datePresets = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(30);
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError("Failed to load orders."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((order) => {
      const inWindow = new Date(order.createdAt) >= cutoff;
      const statusMatch = status === "All" || order.status === status;
      const query = debouncedSearch.trim().toLowerCase();
      const queryMatch =
        !query ||
        order.orderNo.toLowerCase().includes(query) ||
        order.poRef.toLowerCase().includes(query) ||
        order.lines.some((line) => line.sku.toLowerCase().includes(query));
      return inWindow && statusMatch && queryMatch;
    });
  }, [orders, status, debouncedSearch, days]);

  const columns = [
    { key: "order", label: "Order" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total", align: "right" as const },
    { key: "action", label: "", align: "right" as const },
  ];

  const rows = useMemo(
    () =>
      filteredOrders.map((order) => ({
        id: order.id,
        cells: [
          <div key={`${order.id}-order`}>
            <div className="text-sm font-semibold text-slate-900">{order.orderNo}</div>
            <div className="text-xs text-slate-500">
              {order.createdAt} • PO {order.poRef}
            </div>
          </div>,
          <StatusChip
            key={`${order.id}-status`}
            label={order.status}
            tone={statusTone[order.status]}
          />,
          <div
            key={`${order.id}-total`}
            className="text-right text-sm font-semibold text-slate-900"
          >
            GBP {order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0).toFixed(2)}
          </div>,
          <div key={`${order.id}-action`} className="text-right">
            <Link
              href={`/dealer/orders/${order.id}`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View
            </Link>
          </div>,
        ],
      })),
    [filteredOrders],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">Loading orders...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">{error}</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Orders</h1>
            <p className="text-slate-500 mt-1">Track, filter, and manage all dealer orders.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                try {
                  const response = await api.get("/dealer/orders/export", { responseType: "blob" });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `orders-export-${Date.now()}.csv`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              {isExporting ? "Exporting..." : "Export Orders"}
            </Button>
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {datePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDays(preset.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  days === preset.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:text-slate-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="order-status">
            Order status
          </label>
          <select
            id="order-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
          >
            <option value="All">All Status</option>
            <option value="Processing">Processing</option>
            <option value="Ready">Ready</option>
            <option value="Shipped">Shipped</option>
            <option value="Backorder">Backorder</option>
          </select>
          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <input
            id="order-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, PO, SKU"
            className="min-w-[220px] rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            No orders match this filter.
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} rows={rows} density={density} />
      )}

      {filteredOrders[0]?.id && (
        <div className="flex justify-end">
          <Link href={`/dealer/process-order?id=${filteredOrders[0].id}`}>
            <Button variant="outline">Process an Order</Button>
          </Link>
        </div>
      )}
    </>
  );
}
