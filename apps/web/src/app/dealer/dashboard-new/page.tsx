"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Package, TrendingUp, Download } from "lucide-react";
import { DashboardKPICard, DashboardKPICardSkeleton } from "@/components/dealer/DashboardKPICard";
import {
  RecentOrdersTable,
  RecentOrdersTableSkeleton,
} from "@/components/dealer/RecentOrdersTable";
import { NewsFeed, NewsFeedSkeleton } from "@/components/dealer/NewsFeed";
import { AppShellSection } from "@/components/layouts";
import { showToast } from "@/components/global";
import type { DashboardKPI, Order, NewsItem } from "@/types/dealer";
import { dashboardAPI, orderAPI } from "@/services/dealer-api";
import { mockDashboardKPI, mockOrders, mockNewsItems } from "@/mocks/dealer-data";

/**
 * Dealer Dashboard Page
 *
 * Overview page showing:
 * - KPI Cards (Backorders, Orders in Progress, Account Summary)
 * - Recent Orders table (last 10)
 * - News/Updates feed
 */
export default function DealerDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with real API calls
        // Simulating API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Use mock data for now
        setKpis(mockDashboardKPI);
        setRecentOrders(mockOrders.slice(0, 10));
        setNews(mockNewsItems);

        // Real API calls (commented out for now):
        // const [kpisData, ordersData, newsData] = await Promise.all([
        //   dashboardAPI.getKPIs(),
        //   dashboardAPI.getRecentOrders(),
        //   dashboardAPI.getNews(),
        // ]);
        // setKpis(kpisData);
        // setRecentOrders(ordersData);
        // setNews(newsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
        showToast.error("Failed to load dashboard", "Please try refreshing the page");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDownloadBackorders = () => {
    showToast.info("Downloading backorders", "Preparing your backorders report...");
    // TODO: Implement backorders download
  };

  const handleDownloadInvoice = (orderId: string) => {
    showToast.promise(
      // TODO: Replace with real API call
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Downloading invoice...",
        success: "Invoice downloaded successfully",
        error: "Failed to download invoice",
      },
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const calculateCreditUsage = () => {
    if (!kpis) return 0;
    return (kpis.accountBalance / kpis.accountCreditLimit) * 100;
  };

  // Error State
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back</p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back to your dealer portal</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <AppShellSection spacing="medium">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <DashboardKPICardSkeleton />
              <DashboardKPICardSkeleton />
              <DashboardKPICardSkeleton />
            </>
          ) : kpis ? (
            <>
              {/* Backorders Card */}
              <DashboardKPICard
                title="Backorders"
                value={kpis.backordersCount}
                subtitle="Items awaiting stock"
                icon={Clock}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-100"
                action={{
                  label: "Download Report",
                  onClick: handleDownloadBackorders,
                }}
              />

              {/* Orders in Progress Card */}
              <DashboardKPICard
                title="Orders in Progress"
                value={kpis.ordersInProgress}
                subtitle="Currently being processed"
                icon={Package}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-100"
                action={{
                  label: "View Orders",
                  onClick: () => router.push("/dealer/orders"),
                }}
              />

              {/* Account Summary Card */}
              <DashboardKPICard
                title="Account Balance"
                value={formatCurrency(kpis.accountBalance)}
                subtitle={`${calculateCreditUsage().toFixed(0)}% of ${formatCurrency(
                  kpis.accountCreditLimit,
                )} limit`}
                icon={TrendingUp}
                iconColor="text-green-600"
                iconBgColor="bg-green-100"
                action={{
                  label: "View Account",
                  onClick: () => router.push("/dealer/account"),
                }}
              />
            </>
          ) : null}
        </div>
      </AppShellSection>

      {/* Recent Orders + News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <RecentOrdersTableSkeleton />
          ) : (
            <RecentOrdersTable orders={recentOrders} onDownloadInvoice={handleDownloadInvoice} />
          )}
        </div>

        {/* News Feed (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <NewsFeedSkeleton />
          ) : (
            <NewsFeed
              news={news}
              onNewsClick={(item) => {
                showToast.info(item.title, item.summary);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
