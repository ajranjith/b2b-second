'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { dealer, getErrorMessage, Product } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function DealerSearchPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const queryClient = useQueryClient();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

    // Protected Route Check
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    // Search Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['products', debouncedSearch],
        queryFn: () => dealer.search(debouncedSearch),
        // Keep previous data while fetching new results for smoother UX
        placeholderData: (previousData) => previousData,
    });

    // Add to Cart Mutation
    const addToCartMutation = useMutation({
        mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
            dealer.addToCart(productId, qty),
        onSuccess: (_, variables) => {
            // Show success feedback
            setSuccessIds((prev) => {
                const next = new Set(prev);
                next.add(variables.productId);
                return next;
            });

            // Clear success after 3 seconds
            setTimeout(() => {
                setSuccessIds((prev) => {
                    const next = new Set(prev);
                    next.delete(variables.productId);
                    return next;
                });
            }, 3000);

            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (err) => {
            alert(`Failed to add to cart: ${getErrorMessage(err)}`);
        }
    });

    const handleQuantityChange = (productId: string, val: string) => {
        const qty = parseInt(val);
        if (!isNaN(qty) && qty >= 1) {
            setQuantities(prev => ({ ...prev, [productId]: qty }));
        }
    };

    const handleAddToCart = (product: Product) => {
        const qty = quantities[product.id] || 1;
        addToCartMutation.mutate({ productId: product.id, qty });
    };

    const formatPrice = (price: number | null, currency: string) => {
        if (price === null) return 'N/A';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP'
        }).format(price);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Product Search</h2>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Search by product code or description..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading && !data ? (
                    <div className="p-8 text-center text-gray-500">Loading products...</div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">
                        Error loading products: {getErrorMessage(error)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Your Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.results.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.productCode}</td>
                                        <td className="px-6 py-4 text-gray-500">{product.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.partType === 'GENUINE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {product.partType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{product.freeStock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                            {formatPrice(product.yourPrice, product.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 items-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 p-1 border rounded text-center"
                                                    value={quantities[product.id] || 1}
                                                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={addToCartMutation.isPending && addToCartMutation.variables?.productId === product.id}
                                                    className={`px-3 py-1 rounded text-white transition-colors ${successIds.has(product.id)
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                                                        }`}
                                                >
                                                    {successIds.has(product.id) ? 'Added' : 'Add'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.results.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No products found matching "{debouncedSearch}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
