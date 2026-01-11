'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Product } from '@/lib/api-client';
import Link from 'next/link';

export default function DealerSearchPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [dealerAccountId, setDealerAccountId] = useState('');
    const [dealerUserId, setDealerUserId] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        const email = localStorage.getItem('userEmail');
        const accountId = localStorage.getItem('dealerAccountId');
        const userId = localStorage.getItem('dealerUserId');

        if (role !== 'dealer') {
            router.push('/dealer/login');
        } else {
            setUserEmail(email || '');
            setDealerAccountId(accountId || '');
            setDealerUserId(userId || '');
        }
    }, [router]);

    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products', searchQuery, dealerAccountId],
        queryFn: () => apiClient.searchProducts(dealerAccountId, searchQuery),
        enabled: searchQuery.length > 0 && dealerAccountId.length > 0,
    });

    const addToCartMutation = useMutation({
        mutationFn: ({ productCode, qty }: { productCode: string; qty: number }) =>
            apiClient.addToCart(dealerUserId, productCode, qty),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            alert('Added to cart!');
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleAddToCart = (productCode: string) => {
        addToCartMutation.mutate({ productCode, qty: 1 });
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/dealer/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-bold text-slate-900">Hotbray Portal</h1>
                            <nav className="hidden md:flex space-x-6">
                                <Link href="/dealer/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
                                <Link href="/dealer/search" className="text-blue-600 font-medium">Search Parts</Link>
                                <Link href="/dealer/cart" className="text-slate-600 hover:text-slate-900">Cart</Link>
                                <Link href="/dealer/orders" className="text-slate-600 hover:text-slate-900">Orders</Link>
                                <Link href="/dealer/backorders" className="text-slate-600 hover:text-slate-900">Backorders</Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600">{userEmail}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Search Parts</h2>
                    <p className="text-slate-600">Find the parts you need with dealer-specific pricing</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by part number or description..."
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                        >
                            Search
                        </button>
                    </div>
                </form>

                {/* Results */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-slate-600">Searching products...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        Error loading products. Please try again.
                    </div>
                )}

                {products && products.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-600">No products found. Try a different search term.</p>
                    </div>
                )}

                {products && products.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">
                                Found {products.length} product{products.length !== 1 ? 's' : ''}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Part Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Your Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Band</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {products.map((product) => (
                                        <tr key={product.productCode} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-slate-900">{product.productCode}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-700">{product.description}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">
                                                        £{product.unitPrice.toFixed(2)}
                                                    </span>
                                                    {product.minPriceApplied && (
                                                        <span className="text-xs text-orange-600">Min price applied</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                    Band {product.bandUsed}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleAddToCart(product.productCode)}
                                                    disabled={addToCartMutation.isPending}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                                >
                                                    {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Search Tips */}
                {!searchQuery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-2">Search Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Enter a part number (e.g., "LR001234" or "BP-1001")</li>
                            <li>• Search by description (e.g., "brake" or "filter")</li>
                            <li>• Prices shown are specific to your dealer account and band</li>
                            <li>• Minimum price rules are automatically applied</li>
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}
