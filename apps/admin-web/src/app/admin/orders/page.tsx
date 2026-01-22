"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  Package,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { DensityToggleLink } from "@/components/portal/DensityToggleLink";
import { AdminExportButtons } from "@/components/admin/AdminExportButtons";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

type OrdersResponse = {
  orders: Array<{
    id: string;
    orderNo: string;
    poRef: string | null;
    status: string;
    total: number;
    createdAt: string;
    lineCount: number;
    dealerAccount: {
      companyName: string | null;
      accountNo: string | null;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { color: string; icon: any }> = {
    SUSPENDED: { color: "bg-amber-100 text-amber-800", icon: Clock },
    PROCESSING: { color: "bg-blue-100 text-blue-800", icon: Clock },
    SHIPPED: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    CANCELLED: { color: "bg-rose-100 text-rose-800", icon: AlertCircle },
  };

  const config = configs[status] || { color: "bg-gray-100 text-gray-800", icon: Package };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3 mr-1" /> {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

function OrderListSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex px-6 py-4 border-b border-gray-100 items-center justify-between"
          >
            <div className="w-1/4 h-4 bg-gray-200 rounded" />
            <div className="w-1/4 h-4 bg-gray-100 rounded" />
            <div className="w-1/4 h-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const pageSize = 20;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const query = searchParams.get("query") ?? "";
  const status = searchParams.get("status") ?? "";
  const density = (searchParams.get("density") === "dense" ? "dense" : "comfortable") as
    | "comfortable"
    | "dense";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, query, status],
    queryFn: async () => {
      const response = await api.get("/admin/orders", {
        params: {
          page,
          limit: pageSize,
          query: query || undefined,
          status: status || undefined,
        },
      });
      return (response.data?.data ?? response.data) as OrdersResponse;
    },
  });

  useLoadingCursor(isLoading);

  const orders = data?.orders ?? [];
  const totalCount = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const cellPadding = density === "dense" ? "py-2" : "py-4";

  const emptyStateMessage = useMemo(() => {
    if (query || status) {
      return "Adjust your search or filters to find what you're looking for.";
    }
    return "No orders have been placed yet.";
  }, [query, status]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1 uppercase tracking-wider">
            <Package size={16} />
            Admin Management
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Order Hub</h1>
          <p className="text-base text-gray-500">
            Orchestrate B2B order flow and resolve EDI exceptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <AdminExportButtons />
          <form method="GET" action="/admin/orders" className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="density" value={density} />
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Search PO, ID, or Customer..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none w-full md:w-72 transition-all shadow-sm"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm text-gray-600 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <DensityToggleLink />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </header>

      {isLoading ? (
        <OrderListSkeleton />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No orders found</h3>
          <p className="text-gray-500 max-w-xs text-center mt-2">{emptyStateMessage}</p>
          {(query || status) && (
            <Link href="/admin/orders" className="mt-6 text-blue-600 font-semibold hover:underline">
              Clear all filters
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className={`px-6 ${cellPadding} text-left text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Order & PO
                  </th>
                  <th
                    className={`px-6 ${cellPadding} text-left text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Dealer
                  </th>
                  <th
                    className={`px-6 ${cellPadding} text-left text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Details
                  </th>
                  <th
                    className={`px-6 ${cellPadding} text-left text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 ${cellPadding} text-right text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Total
                  </th>
                  <th
                    className={`px-6 ${cellPadding} text-right text-xs font-semibold text-gray-500 uppercase tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className={`px-6 ${cellPadding} whitespace-nowrap`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{order.orderNo}</span>
                        {order.poRef && (
                          <span className="text-xs text-gray-500">PO: {order.poRef}</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} whitespace-nowrap`}>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 font-medium">
                            {order.dealerAccount?.companyName || "Unknown dealer"}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {order.dealerAccount?.accountNo || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} whitespace-nowrap`}>
                      <div className="flex flex-col text-xs text-gray-500">
                        <div className="flex items-center mb-1">
                          <Package className="w-3 h-3 mr-1" /> {order.lineCount} Line Items
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} whitespace-nowrap`}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className={`px-6 ${cellPadding} whitespace-nowrap text-right`}>
                      <span className="text-sm font-bold text-gray-900">
                        GBP {Number(order.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className={`px-6 ${cellPadding} whitespace-nowrap text-right text-sm`}>
                      <button className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between py-2 px-1">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{totalCount}</span> orders
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/orders?page=${page - 1}${query ? `&query=${query}` : ""}${status ? `&status=${status}` : ""}`}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm ${
                  page <= 1 ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Link>
              <Link
                href={`/admin/orders?page=${page + 1}${query ? `&query=${query}` : ""}${status ? `&status=${status}` : ""}`}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm ${
                  page >= totalPages ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
