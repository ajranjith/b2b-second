"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Phone, Mail, AlertCircle } from "lucide-react";
import { getOrderById } from "@/lib/services/dealerApi";
import { StatusChip } from "@/components/portal/StatusChip";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/ui";

const statusTone: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  Processing: "blue",
  Ready: "amber",
  Shipped: "green",
  Backorder: "red",
};

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
}

export default function ProcessOrderPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("id") || "order-1001";
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderById>>>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "verify",
      label: "Verify Order Details",
      completed: true,
      description: "Order details have been verified and confirmed",
    },
    {
      id: "payment",
      label: "Payment Processing",
      completed: true,
      description: "Payment has been successfully processed",
    },
    {
      id: "picking",
      label: "Order Picking",
      completed: false,
      description: "Items are being picked from warehouse",
    },
    {
      id: "packing",
      label: "Packing & Quality Check",
      completed: false,
      description: "Items will be packed and quality checked",
    },
    {
      id: "dispatch",
      label: "Dispatch",
      completed: false,
      description: "Order will be dispatched to your location",
    },
  ]);

  useEffect(() => {
    getOrderById(orderId).then(setOrder);
  }, [orderId]);

  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">
          Loading order details...
        </CardContent>
      </Card>
    );
  }

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Order
      </Button>

      {/* Status Hero Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Order Number</p>
                  <h1 className="text-3xl font-bold text-slate-900">{order.orderNo}</h1>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">Status:</span>
                  <StatusChip label={order.status} tone={statusTone[order.status]} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">Created:</span>
                  <span className="font-medium text-slate-900">{order.createdAt}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">PO Reference:</span>
                  <span className="font-medium text-slate-900">{order.poRef}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">Dispatch Method:</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {order.dispatchMethod}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Order Progress</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {completedCount}/{totalCount} completed
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-w-[220px]">
              <p className="text-sm text-slate-600 mb-1">Order Total</p>
              <p className="text-3xl font-bold text-slate-900">
                GBP{" "}
                {order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {order.lines.length} item{order.lines.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* What Happens Next - Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklist.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.completed ? (
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-500">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-semibold ${
                        item.completed ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {item.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated Completion */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Estimated Completion</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {order.dispatchMethod === "Express"
                      ? "Your order will be dispatched within 24 hours"
                      : order.dispatchMethod === "Collection"
                        ? "Your order will be ready for collection in 2-3 business days"
                        : "Your order will be dispatched in 3-5 business days"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support & Actions */}
        <div className="space-y-6">
          {/* Order Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {order.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-start justify-between pb-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{line.sku}</p>
                      <p className="text-xs text-slate-500 mt-1">{line.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-slate-900">
                        GBP {(line.unitPrice * line.qty).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">Qty: {line.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-slate-300">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                This order is processed offline by the warehouse team. Contact support with your
                order number and PO reference.
              </p>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open("tel:+441234567890")}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Support: +44 1234 567 890
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open("mailto:support@example.com")}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email: support@example.com
              </Button>

              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  // TODO: Implement PDF download
                  alert("Downloading invoice...");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
