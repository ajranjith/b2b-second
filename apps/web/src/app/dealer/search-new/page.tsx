'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product, SearchFilters as SearchFiltersType, CartItem } from '@/types/dealer';
import { SearchFilters } from '@/components/dealer/SearchFilters';
import { ProductResultsTable } from '@/components/dealer/ProductResultsTable';
import { CartPreview } from '@/components/dealer/CartPreview';
import { showToast, commonToasts } from '@/components/global';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Search Parts Page
 *
 * Main search interface with:
 * - Sticky filter bar
 * - Results table (expandable rows)
 * - Right sticky cart preview panel
 * - Loading/empty/error states
 */
export default function SearchPartsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [filters, setFilters] = useState<SearchFiltersType>({
    query: initialQuery,
    availability: [],
    sortBy: 'relevance',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      if (!filters.query.trim()) {
        setProducts([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with real API call
        // const response = await productAPI.search(filters, 1, 50);
        // setProducts(response.data);
        setProducts([]);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
        showToast.error('Search failed', 'Please try again');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleSearch = () => {
    // Trigger search (will be handled by useEffect)
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    // Create cart item
    const cartItem: CartItem = {
      id: `cart-${Date.now()}-${product.id}`,
      product,
      quantity,
      lineTotal: product.dealerPrice * quantity,
    };

    setCartItems((prev) => {
      // Check if item already exists
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          lineTotal:
            updated[existingIndex].product.dealerPrice *
            (updated[existingIndex].quantity + quantity),
        };
        return updated;
      } else {
        // Add new item
        return [...prev, cartItem];
      }
    });

    commonToasts.addedToCart(`${product.lrNo} (${quantity})`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    if (item) {
      commonToasts.removedFromCart(item.product.lrNo);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Search Parts</h1>
        <p className="text-slate-600 mt-1">
          Find parts by part number, JagAlt, or description
        </p>
      </div>

      {/* Search Filters (Sticky) */}
      <div className="-mx-6 md:-mx-8">
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isLoading={isLoading}
          resultCount={products.length}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Results Table (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="rounded-lg border-2 border-dashed border-red-300 p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : !filters.query.trim() ? (
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-600 mb-2">Start searching</p>
              <p className="text-sm text-slate-500">
                Enter a part number, JagAlt, or description to find parts
              </p>
            </div>
          ) : (
            <ProductResultsTable
              products={products}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>

        {/* Cart Preview (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <CartPreview
            items={cartItems}
            subtotal={calculateSubtotal()}
            onRemoveItem={handleRemoveFromCart}
          />
        </div>
      </div>
    </div>
  );
}
