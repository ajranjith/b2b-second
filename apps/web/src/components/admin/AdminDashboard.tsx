"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Package, UploadCloud, Users } from "lucide-react";
import api from "@/lib/api";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";
import { getUser } from "@/lib/auth";

type AdminDashboardData = {
  dealers: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalRevenue: number;
  };
  products: {
    total: number;
    genuine: number;
    aftermarket: number;
    branded: number;
    lowStock: number;
  };
  imports: {
    todayCount: number;
    lastSuccessful: string | null;
    failedToday: number;
    activeImports: number;
  };
  recentOrders: Array<{
    id: string;
    orderNo: string;
    status: string;
    total: number;
    createdAt: string;
    dealerAccount?: { companyName?: string | null; accountNo?: string | null } | null;
  }>;
};

const statConfig = [
  { key: "dealers", label: "Total Dealers", icon: Users },
  { key: "products", label: "Total Products", icon: Package },
  { key: "ordersToday", label: "Orders Today", icon: BarChart3 },
  { key: "activeImports", label: "Active Imports", icon: UploadCloud },
] as const;

export function AdminDashboard() {
  const [adminLabel, setAdminLabel] = useState("Admin");

  useEffect(() => {
    const user = getUser();
    if (user?.email) {
      setAdminLabel(user.email);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard");
      return response.data as AdminDashboardData;
    },
  });

  useLoadingCursor(isLoading);

  const stats = data?.dealers
    ? {
        dealers: data.dealers?.total ?? 0,
        products: data.products?.total ?? 0,
        ordersToday: data.orders?.today ?? 0,
        activeImports: data.imports?.activeImports ?? 0,
      }
    : {
        dealers: 0,
        products: 0,
        ordersToday: 0,
        activeImports: 0,
      };

  return (
    <div className="space-y-8">
      <main className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
          <p className="text-slate-600 mt-1">Welcome back, {adminLabel}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statConfig.map((stat) => (
            <div
              key={stat.key}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
              data-source="api"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats[stat.key]}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/admin/dealers"
                  className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition group"
                >
                  <Users className="h-7 w-7 text-indigo-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600">
                    Manage Dealers
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">Add or edit dealer accounts</p>
                </Link>

                <Link
                  href="/admin/imports"
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group"
                >
                  <UploadCloud className="h-7 w-7 text-green-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 group-hover:text-green-600">
                    Import Data
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">Upload product & backorder files</p>
                </Link>

                <Link
                  href="/admin/orders"
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <Package className="h-7 w-7 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 group-hover:text-blue-600">
                    View Orders
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">Monitor all dealer orders</p>
                </Link>

                <Link
                  href="/admin/news"
                  className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition group"
                >
                  <BarChart3 className="h-7 w-7 text-orange-600 mb-2" />
                  <h4 className="font-semibold text-slate-900 group-hover:text-orange-600">
                    News Articles
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">Publish dealer updates</p>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Imports Today</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {data?.imports?.todayCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Imports</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    {data?.imports?.activeImports ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Failed Imports Today</span>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                    {data?.imports?.failedToday ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h3>
            <div className="space-y-4">
              {data?.recentOrders?.length ? (
                data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{order.orderNo}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {order.dealerAccount?.companyName || "Unknown dealer"} •{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      GBP {Number(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  No orders yet. Recent orders will appear here once dealers place orders.
                </div>
              )}
            </div>
            <Link
              href="/admin/orders"
              className="w-full mt-4 inline-flex justify-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
