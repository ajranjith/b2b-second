"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Package, UserCircle } from "lucide-react";
import {
  getBackorders,
  getDealerProfile,
  getNewsArticles,
  getOrders,
  getPricingContext,
} from "@/lib/services/dealerApi";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { StatusChip } from "@/components/portal/StatusChip";

const statusTone: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  Processing: "blue",
  Ready: "amber",
  Shipped: "green",
  Backorder: "red",
  PROCESSING: "blue",
  READY: "amber",
  SHIPPED: "green",
  BACKORDER: "red",
  SUSPENDED: "slate",
};

export default function DealerDashboard() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [backorders, setBackorders] = useState<any[]>([]);
  const [pricingContext, setPricingContext] =
    useState<Awaited<ReturnType<typeof getPricingContext>>>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getDealerProfile>>>(null);
  const [news, setNews] = useState<Awaited<ReturnType<typeof getNewsArticles>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getOrders(),
      getBackorders(),
      getPricingContext(),
      getDealerProfile(),
      getNewsArticles(),
    ])
      .then(([ordersData, backordersData, pricingData, profileData, newsData]) => {
        setOrders(ordersData);
        setBackorders(backordersData);
        setPricingContext(pricingData);
        setProfile(profileData);
        setNews(newsData);
      })
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const inProgress = orders.filter((order) =>
      ["PROCESSING", "READY", "SUSPENDED"].includes(String(order.status).toUpperCase()),
    ).length;
    return {
      backorders: backorders.length,
      inProgress,
    };
  }, [orders, backorders]);

  const recentOrders = useMemo(() => {
    if (orders.length === 0) return [];
    return Array.from({ length: 10 }, (_, index) => orders[index % orders.length]).map(
      (order, idx) => ({
        ...order,
        rowId: `${order.id}-${idx}`,
        total: order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
      }),
    );
  }, [orders]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">Loading dashboard...</CardContent>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">
          Welcome back, here&apos;s what needs your attention today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-slate-500">Backorders</CardTitle>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{stats.backorders}</div>
            <p className="text-sm text-slate-500 mt-1">Outstanding lines awaiting stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-slate-500">Orders in Progress</CardTitle>
            <Package className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{stats.inProgress}</div>
            <p className="text-sm text-slate-500 mt-1">Processing & ready to dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-slate-500">Account Summary</CardTitle>
            <UserCircle className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Genuine tier</span>
                <span>{pricingContext?.genuineTier || "Not configured"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Aftermarket ES tier</span>
                <span>{pricingContext?.aftermarketEsTier || "Not configured"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Aftermarket BR tier</span>
                <span>{pricingContext?.aftermarketBTier || "Not configured"}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Default shipping</span>
                <span>{profile?.defaultShippingMethod || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status</span>
                <span>{profile?.account.status || "Unknown"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-500">
                        No orders yet. Start by searching for parts.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.rowId} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-semibold text-slate-900">{order.orderNo}</td>
                        <td className="px-6 py-3 text-slate-600">{order.createdAt}</td>
                        <td className="px-6 py-3 text-right text-slate-900 font-semibold">
                          GBP {order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <StatusChip
                            label={order.status}
                            tone={statusTone[order.status] || "slate"}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 text-right">
              <Link
                href="/dealer/orders"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all orders
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>News Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {news.length === 0 ? (
              <div className="text-sm text-slate-500">No news published yet.</div>
            ) : (
              news.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {item.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {item.endsAt ? (
                    <p className="text-xs text-slate-500 mt-2">
                      Valid until {new Date(item.endsAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {item.bodyMd || "No message provided."}
                  </p>
                  {item.attachments?.length ? (
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      href="/dealer/news"
                    >
                      <FileText className="h-3 w-3" />
                      View attachments
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
