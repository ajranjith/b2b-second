'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchParts, type SearchParams, getPartBySku } from '@/lib/services/dealerApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDealerCart } from '@/context/DealerCartContext';
import { DataTable } from '@/components/portal/DataTable';
import { DensityToggle } from '@/components/portal/DensityToggle';
import { StatusChip } from '@/components/portal/StatusChip';
import { SearchInput } from '@/components/portal/SearchInput';
import { Card, CardContent, CardHeader, Button } from '@/ui';

const stockTone: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  'In Stock': 'green',
  'Low Stock': 'amber',
  Backorder: 'red',
};

export default function DealerSearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const queryParam = params.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [partType, setPartType] = useState<SearchParams['partType']>('All');
  const [stock, setStock] = useState<SearchParams['stock']>('All');
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<'comfortable' | 'dense'>('comfortable');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const { addItem, items } = useDealerCart();

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const applySearch = (value: string) => {
    setQuery(value);
    setPage(1);
    const nextParams = new URLSearchParams(params.toString());
    if (value) {
      nextParams.set('q', value);
    } else {
      nextParams.delete('q');
    }
    router.push(`/dealer/search?${nextParams.toString()}`);
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const response = await searchParts({
        query: debouncedQuery,
        page,
        pageSize: 6,
        stock,
        partType,
      });
      setResults(response);
      setLoading(false);
    };
    fetchResults();
  }, [debouncedQuery, page, partType, stock]);

  const totalPages = Math.max(1, Math.ceil(results.total / 6));

  const columns = [
    { key: 'sku', label: 'Part', width: '30%' },
    { key: 'stock', label: 'Stock', width: '20%' },
    { key: 'price', label: 'Price', align: 'right' as const },
    { key: 'action', label: '', align: 'right' as const, width: '20%' },
  ];

  const rows = useMemo(
    () =>
      results.items.map((part) => ({
        id: part.id,
        onClick: () => setExpandedPartId(part.id === expandedPartId ? null : part.id),
        cells: [
          <div key={`${part.id}-name`}>
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              {part.sku}
              {part.supersededBy && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Superseded
                </span>
              )}
            </div>
            {part.supersededBy && (
              <div className="text-xs text-amber-700">
                Superseded by{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    applySearch(part.supersededBy || '');
                  }}
                >
                  {part.supersededBy}
                </button>
                {part.replacementExists === false && ' (not currently stocked online)'}
              </div>
            )}
            <div className="text-xs text-slate-500">{part.name}</div>
            <div className="text-xs text-slate-400">{part.description}</div>
          </div>,
          <div key={`${part.id}-stock`} className="space-y-2">
            <StatusChip label={part.stockStatus} tone={stockTone[part.stockStatus]} />
            <div className="text-xs text-slate-400">{part.stockQty} available</div>
          </div>,
          <div key={`${part.id}-price`} className="text-right">
            <div className="text-sm font-semibold text-slate-900">GBP {part.price.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{part.band}</div>
          </div>,
          <div key={`${part.id}-action`} className="flex justify-end">
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={(event) => {
                event.stopPropagation();
                if (part.supersededBy && part.replacementExists) {
                  const replacement = getPartBySku(part.supersededBy);
                  if (replacement) {
                    addItem(replacement);
                  }
                  return;
                }
                if (part.supersededBy && part.replacementExists === false) {
                  return;
                }
                addItem(part);
              }}
              disabled={!!part.supersededBy && part.replacementExists === false}
            >
              {part.supersededBy && part.replacementExists ? 'Add Replacement' : 'Add to Cart'}
            </Button>
          </div>,
        ],
      })),
    [results.items, addItem, expandedPartId]
  );

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Search Parts</h1>
            <p className="text-slate-500 mt-1">Live stock and pricing for your account.</p>
          </div>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label className="sr-only" htmlFor="dealer-search">Search parts</label>
            <SearchInput
              defaultValue={query}
              onSearch={(value) => applySearch(value)}
              size="lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="part-type-filter">
              Part Type
            </label>
            <select
              id="part-type-filter"
              value={partType}
              onChange={(event) => {
                setPartType(event.target.value as SearchParams['partType']);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <option value="All">All Part Types</option>
              <option value="Genuine">Genuine</option>
              <option value="Aftermarket">Aftermarket</option>
              <option value="Branded">Branded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2" htmlFor="stock-filter">
              Stock Status
            </label>
            <select
              id="stock-filter"
              value={stock}
              onChange={(event) => {
                setStock(event.target.value as SearchParams['stock']);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <option value="All">All Stock</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Backorder">Backorder</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-500">Loading results...</CardContent>
            </Card>
          ) : (
            <DataTable columns={columns} rows={rows} density={density} />
          )}
          {expandedPartId && (
            <Card>
              <CardContent className="py-6 text-sm text-slate-600">
                Details for this part will appear here (supersessions, fitment notes, and lead time).
              </CardContent>
            </Card>
          )}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-slate-900">Cart Preview</h2>
            <p className="text-xs text-slate-400">Updates instantly as you add items.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-slate-500">No items yet.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.part.sku}</div>
                    <div className="text-xs text-slate-400">{item.part.name}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">x{item.qty}</div>
                </div>
              ))
            )}
            <div className="pt-2">
              <Link
                href="/dealer/cart"
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
              >
                Go to Cart
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
