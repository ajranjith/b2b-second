'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Package,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { getOrders } from '@/lib/services/dealerApi';
import { Badge, Card, CardContent } from '@/ui';
import { StatusChip } from '@/components/portal/StatusChip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const statusTone: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'slate'> = {
  Processing: 'blue',
  Ready: 'amber',
  Shipped: 'green',
  Backorder: 'red',
};

const statusIcon: Record<string, typeof Package> = {
  Processing: Clock,
  Ready: Package,
  Shipped: Truck,
  Backorder: AlertTriangle,
};

/* ── Animated counter hook ───────────────────────────────────── */
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    setCount(0);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

/* ── KPI Card (inline, Garaze-style) ─────────────────────────── */
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Package;
  gradient: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6
                 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out
                 opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-2xl', gradient)} />

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-slate-900 tabular-nums">{animatedValue}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div
          className={cn(
            'rounded-xl p-3 transition-transform duration-300 group-hover:scale-110',
            gradient
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ── Revenue KPI (formatted as currency) ─────────────────────── */
function RevenueKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Package;
  gradient: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(Math.round(value));

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6
                 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out
                 opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-2xl', gradient)} />
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-slate-900 tabular-nums">
            <span className="text-2xl font-semibold text-slate-500">GBP</span>{' '}
            {animatedValue.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div
          className={cn(
            'rounded-xl p-3 transition-transform duration-300 group-hover:scale-110',
            gradient
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ── Order row with rollover popup ───────────────────────────── */
function OrderRow({
  order,
  delay,
}: {
  order: {
    rowId: string;
    id: string;
    orderNo: string;
    createdAt: string;
    status: string;
    dispatchMethod: string;
    poRef: string;
    lines: { id: string; sku: string; description: string; qty: number; unitPrice: number }[];
    total: number;
  };
  delay: number;
}) {
  const Icon = statusIcon[order.status] || Package;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <tr
          className="group cursor-default border-b border-slate-100 last:border-0
                     hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent
                     transition-colors duration-200
                     opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
          style={{ animationDelay: `${delay}ms` }}
        >
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <div>
                <span className="font-semibold text-slate-900">{order.orderNo}</span>
                {order.poRef && (
                  <p className="text-xs text-slate-400 mt-0.5">PO: {order.poRef}</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-slate-600">{order.createdAt}</td>
          <td className="px-6 py-4">
            <Badge variant="outline" className="text-xs font-normal capitalize">
              {order.dispatchMethod}
            </Badge>
          </td>
          <td className="px-6 py-4 text-right font-semibold text-slate-900 tabular-nums">
            GBP {order.total.toFixed(2)}
          </td>
          <td className="px-6 py-4 text-right">
            <StatusChip label={order.status} tone={statusTone[order.status]} />
          </td>
          <td className="px-6 py-4 text-right">
            <Link
              href={`/dealer/orders/${order.id}`}
              className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Eye className="h-4 w-4 inline" />
            </Link>
          </td>
        </tr>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={12}
        className="bg-slate-900 text-white p-0 rounded-xl shadow-2xl border border-slate-700 max-w-sm"
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-sm">Order Lines</span>
            <span className="text-xs text-slate-400">{order.lines.length} item(s)</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {order.lines.map((line) => (
              <div key={line.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-blue-300">{line.sku}</span>
                  <p className="text-slate-400 truncate mt-0.5">{line.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-slate-300">{line.qty} x</span>{' '}
                  <span className="font-semibold text-white">{line.unitPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-700 flex justify-between text-sm">
            <span className="text-slate-400">Total</span>
            <span className="font-bold">GBP {order.total.toFixed(2)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Quick Action Button ─────────────────────────────────────── */
function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  delay = 0,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  description: string;
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-slate-200/60 bg-white p-4
                 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5
                 transition-all duration-300 ease-out
                 opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="rounded-xl bg-slate-100 p-3 group-hover:bg-blue-100 transition-colors duration-300">
        <Icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
export default function DealerDashboard() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data))
      .catch(() => setError('Unable to load dashboard data.'))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const backorders = orders.filter((o) => o.status === 'Backorder').length;
    const inProgress = orders.filter((o) => o.status === 'Processing' || o.status === 'Ready').length;
    const shipped = orders.filter((o) => o.status === 'Shipped').length;
    const totalSpend = orders.reduce(
      (sum, o) => sum + o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
      0
    );
    return { backorders, inProgress, shipped, totalOrders: orders.length, totalSpend };
  }, [orders]);

  const recentOrders = useMemo(() => {
    if (orders.length === 0) return [];
    const nonBackorders = orders.filter((o) => o.status !== 'Backorder');
    return nonBackorders.slice(0, 3).map((order, idx) => ({
      ...order,
      rowId: `${order.id}-${idx}`,
      total: order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
    }));
  }, [orders]);

  const recentBackorders = useMemo(() => {
    if (orders.length === 0) return [];
    return orders
      .filter((o) => o.status === 'Backorder')
      .slice(0, 3)
      .map((order, idx) => ({
        ...order,
        rowId: `${order.id}-bo-${idx}`,
        total: order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
      }));
  }, [orders]);

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton banner */}
        <div className="h-40 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
        {/* Skeleton KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        {/* Skeleton table */}
        <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">{error}</CardContent>
      </Card>
    );
  }

  if (!orders.length) {
    return (
      <>
        <AnimationStyles />
        <div className="space-y-8">
          <DealerBanner />
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              No orders yet. Start by searching for parts and placing your first order.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimationStyles />
      <div className="space-y-8">
        {/* ── Dealer Welcome Banner ── */}
        <DealerBanner />

        {/* ── KPI Cards ── */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle="All-time orders placed"
            icon={ShoppingCart}
            gradient="bg-gradient-to-r from-blue-600 to-blue-500"
            delay={100}
          />
          <KPICard
            title="In Progress"
            value={stats.inProgress}
            subtitle="Processing & ready to ship"
            icon={Clock}
            gradient="bg-gradient-to-r from-amber-500 to-orange-400"
            delay={200}
          />
          <KPICard
            title="Backorders"
            value={stats.backorders}
            subtitle="Awaiting stock"
            icon={AlertTriangle}
            gradient="bg-gradient-to-r from-rose-500 to-red-400"
            delay={300}
          />
          <RevenueKPICard
            title="Total Spend"
            value={stats.totalSpend}
            subtitle="Lifetime order value"
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-emerald-600 to-emerald-500"
            delay={400}
          />
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* ── Left Column: Recent Orders + Backorders ── */}
          <div className="space-y-6">
            {/* ── Recent Orders Table (3 items) ── */}
            <div
              className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden
                          opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
              style={{ animationDelay: '500ms' }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Hover an order to see line items</p>
                </div>
                <Link
                  href="/dealer/orders"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatch</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, idx) => (
                      <OrderRow key={order.rowId} order={order} delay={550 + idx * 50} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Backorders Table (3 items) ── */}
            <div
              className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden
                          opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
              style={{ animationDelay: '700ms' }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Backorders</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Items awaiting stock</p>
                </div>
                <Link
                  href="/dealer/backorders"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {recentBackorders.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">
                  No backorders — all items are in stock.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatch</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {recentBackorders.map((order, idx) => (
                        <OrderRow key={order.rowId} order={order} delay={750 + idx * 50} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar: Quick Actions + Order Status Breakdown ── */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className="opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
              style={{ animationDelay: '600ms' }}
            >
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <QuickAction
                  href="/dealer/search"
                  icon={Package}
                  label="Search Parts"
                  description="Find genuine & aftermarket parts"
                  delay={650}
                />
                <QuickAction
                  href="/dealer/cart"
                  icon={ShoppingCart}
                  label="View Cart"
                  description="Review items before checkout"
                  delay={700}
                />
                <QuickAction
                  href="/dealer/backorders"
                  icon={AlertTriangle}
                  label="View Backorders"
                  description="Track outstanding line items"
                  delay={750}
                />
                <QuickAction
                  href="/dealer/orders"
                  icon={Truck}
                  label="Order History"
                  description="View all past & current orders"
                  delay={800}
                />
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div
              className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm
                          opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
              style={{ animationDelay: '850ms' }}
            >
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Status Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Processing', count: orders.filter((o) => o.status === 'Processing').length, color: 'bg-blue-500' },
                  { label: 'Ready', count: orders.filter((o) => o.status === 'Ready').length, color: 'bg-amber-500' },
                  { label: 'Shipped', count: stats.shipped, color: 'bg-emerald-500' },
                  { label: 'Backorder', count: stats.backorders, color: 'bg-rose-500' },
                ].map((item) => {
                  const pct = stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0;
                  return (
                    <div key={item.label} className="group">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <span className="text-slate-500 tabular-nums">
                          {item.count}
                          <span className="text-slate-400 ml-1 text-xs">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000 ease-out',
                            item.color
                          )}
                          style={{ width: `${pct}%`, transitionDelay: '900ms' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared animation keyframes ───────────────────────────────── */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEALER WELCOME BANNER
   Shows account number, tier/band, and status
   Data matches backend: Dealer.code, DealerBandAssignment.bandCode
   ═══════════════════════════════════════════════════════════════ */
function DealerBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                 border border-slate-700/50 shadow-xl
                 opacity-0 animate-[fadeSlideUp_0.5s_ease-out_forwards]"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient accent glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative px-8 py-8 md:flex md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
              <Crown className="h-3.5 w-3.5" />
              Premium Dealer
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Here&apos;s what needs your attention today. Hover over orders for detailed line items.
          </p>
        </div>

        {/* Account Details */}
        <div className="mt-6 md:mt-0 flex flex-wrap gap-4 md:gap-6">
          <AccountDetail label="Account No." value="HB-2847" />
          <AccountDetail label="Pricing Band" value="Band 1" />
          <AccountDetail label="Terms" value="Net 30" />
          <AccountDetail label="Status" value="Active" valueClassName="text-emerald-400" />
        </div>
      </div>

      {/* Band breakdown bar */}
      <div className="relative border-t border-slate-700/50 px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tier Pricing</span>
        <div className="flex flex-wrap items-center gap-3">
          <BandPill label="Genuine" band="Band 1" color="bg-blue-500/20 text-blue-300 border-blue-500/30" />
          <BandPill label="Aftermarket" band="Band 2" color="bg-emerald-500/20 text-emerald-300 border-emerald-500/30" />
          <BandPill label="Branded" band="Band 1" color="bg-purple-500/20 text-purple-300 border-purple-500/30" />
        </div>
        <div className="ml-auto">
          <Link
            href="/dealer/account"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Manage Account <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccountDetail({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="text-right md:text-left">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-semibold text-white mt-0.5', valueClassName)}>{value}</p>
    </div>
  );
}

function BandPill({
  label,
  band,
  color,
}: {
  label: string;
  band: string;
  color: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', color)}>
      <ShieldCheck className="h-3 w-3" />
      {label}: {band}
    </span>
  );
}
