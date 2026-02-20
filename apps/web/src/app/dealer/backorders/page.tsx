'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getOrders } from '@/lib/services/dealerApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DataTable } from '@/components/portal/DataTable';
import { DensityToggle } from '@/components/portal/DensityToggle';
import { StatusChip } from '@/components/portal/StatusChip';
import { Card, CardContent } from '@/ui';

const datePresets = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'All time', value: 3650 },
];

export default function DealerBackordersPage() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(90);
  const [density, setDensity] = useState<'comfortable' | 'dense'>('comfortable');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load backorders.'))
      .finally(() => setIsLoading(false));
  }, []);

  const backorders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders
      .filter((order) => order.status === 'Backorder')
      .filter((order) => {
        const inWindow = new Date(order.createdAt) >= cutoff;
        const query = debouncedSearch.trim().toLowerCase();
        const queryMatch =
          !query ||
          order.orderNo.toLowerCase().includes(query) ||
          order.poRef.toLowerCase().includes(query) ||
          order.lines.some((line) =>
            line.sku.toLowerCase().includes(query) ||
            line.description.toLowerCase().includes(query)
          );
        return inWindow && queryMatch;
      });
  }, [orders, debouncedSearch, days]);

  const columns = [
    { key: 'order', label: 'Order' },
    { key: 'items', label: 'Items' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total', align: 'right' as const },
    { key: 'action', label: '', align: 'right' as const },
  ];

  const rows = useMemo(
    () =>
      backorders.map((order) => ({
        id: order.id,
        cells: [
          <div key={`${order.id}-order`}>
            <div className="text-sm font-semibold text-slate-900">{order.orderNo}</div>
            <div className="text-xs text-slate-500">{order.createdAt} &middot; PO {order.poRef}</div>
          </div>,
          <div key={`${order.id}-items`} className="text-sm text-slate-600">
            {order.lines.length} line{order.lines.length !== 1 ? 's' : ''}
          </div>,
          <StatusChip key={`${order.id}-status`} label={order.status} tone="red" />,
          <div key={`${order.id}-total`} className="text-right text-sm font-semibold text-slate-900">
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
    [backorders]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">Loading backorders...</CardContent>
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
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Backorders</h1>
              <p className="text-slate-500 mt-1">
                {backorders.length} backorder{backorders.length !== 1 ? 's' : ''} awaiting stock
              </p>
            </div>
          </div>
          <DensityToggle value={density} onChange={setDensity} />
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
                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="backorder-search">Search backorders</label>
          <input
            id="backorder-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, PO, SKU, description"
            className="min-w-[260px] rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          />
        </div>
      </div>

      {backorders.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-16 text-center text-slate-500">
            No backorders match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <DataTable columns={columns} rows={rows} density={density} />
        </div>
      )}
    </>
  );
}
