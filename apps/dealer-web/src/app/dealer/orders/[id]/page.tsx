"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getOrderById, getOrderTimeline } from "@/lib/services/dealerApi";
import { StatusChip } from "@/components/portal/StatusChip";
import { DataTable } from "@/components/portal/DataTable";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui";

const statusTone: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  Processing: "blue",
  Ready: "amber",
  Shipped: "green",
  Backorder: "red",
};

export default function DealerOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderById>>>(null);
  const [timeline, setTimeline] = useState<Awaited<ReturnType<typeof getOrderTimeline>>>([]);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    getOrderById(id as string).then(setOrder);
    getOrderTimeline(id as string).then(setTimeline);
  }, [params.id]);

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "description", label: "Description" },
    { key: "qty", label: "Qty", align: "center" as const },
    { key: "price", label: "Unit Price", align: "right" as const },
    { key: "total", label: "Total", align: "right" as const },
  ];

  const rows = useMemo(() => {
    if (!order) return [];
    return order.lines.map((line) => ({
      id: line.id,
      cells: [
        <div key={`${line.id}-sku`} className="font-semibold text-slate-900">
          {line.sku}
        </div>,
        <div key={`${line.id}-desc`} className="text-sm text-slate-600">
          {line.description}
        </div>,
        <div key={`${line.id}-qty`} className="text-center text-sm font-semibold">
          {line.qty}
        </div>,
        <div key={`${line.id}-price`} className="text-right text-sm text-slate-700">
          GBP {line.unitPrice.toFixed(2)}
        </div>,
        <div key={`${line.id}-total`} className="text-right text-sm font-semibold text-slate-900">
          GBP {(line.unitPrice * line.qty).toFixed(2)}
        </div>,
      ],
    }));
  }, [order]);

  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">
          Loading order details...
        </CardContent>
      </Card>
    );
  }

  const total = order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Order Detail</p>
          <h1 className="text-3xl font-semibold text-slate-900">{order.orderNo}</h1>
          <p className="text-slate-500 mt-1">{order.createdAt}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip label={order.status} tone={statusTone[order.status]} />
          <Link href={`/dealer/process-order?id=${order.id}`}>
            <Button variant="outline">Process Order</Button>
          </Link>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Download PDF</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable columns={columns} rows={rows} />
            <div className="flex justify-end text-lg font-semibold text-slate-900">
              Total: GBP {total.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeline.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.status === "done"
                        ? "bg-emerald-500"
                        : item.status === "current"
                          ? "bg-blue-600"
                          : "bg-slate-300"
                    }`}
                  />
                  {index < timeline.length - 1 && <div className="h-10 w-px bg-slate-200" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              Dispatch method: {order.dispatchMethod} • PO Ref: {order.poRef}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
