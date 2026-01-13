'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, ShoppingCart, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { useCartUI } from '@/context/CartContext';

type PartType = 'GENUINE' | 'AFTERMARKET' | 'BRANDED';
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'stock';

interface Product {
    id: string;
    productCode: string;
    description: string;
    partType: PartType;
    freeStock: number;
    price: number;
    bandLevel?: string;
    entitlementContext?: string;
}

const partTypeColors: Record<PartType, string> = {
    GENUINE: 'bg-blue-100 text-blue-700 border-blue-200',
    AFTERMARKET: 'bg-purple-100 text-purple-700 border-purple-200',
    BRANDED: 'bg-green-100 text-green-700 border-green-200',
};

export default function DealerSearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [partTypeFilter, setPartTypeFilter] = useState<PartType | 'ALL'>('ALL');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    const { addItem } = useCart();
    const { openMiniCart, closeMiniCart } = useCartUI();

    const { data: products, isLoading } = useQuery({
        queryKey: ['products', activeSearch, partTypeFilter, inStockOnly, sortBy],
        queryFn: async () => {
            if (!activeSearch) return [];

            const params: any = { q: activeSearch };
            if (partTypeFilter !== 'ALL') params.partType = partTypeFilter;
            if (inStockOnly) params.inStockOnly = 'true';
            if (sortBy !== 'relevance') params.sortBy = sortBy;

            const response = await api.get('/dealer/search', { params });
            return response.data.products as Product[];
        },
        enabled: !!activeSearch,
    });

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setActiveSearch(searchQuery.trim());
        }
    };

    const handleAddToCart = async (product: Product) => {
        const quantity = quantities[product.id] || 1;
        setAddingToCart(product.id);

        try {
            await addItem(product.id, quantity);
            toast.success(`Added ${quantity}x ${product.productCode} to cart!`);

            // Auto-open mini cart
            openMiniCart();

            // Auto-close after 3 seconds
            setTimeout(() => {
                closeMiniCart();
            }, 3000);
        } catch (error) {
            toast.error('Failed to add item to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    const getStockBadge = (freeStock: number) => {
        if (freeStock === 0) {
            return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Out of Stock</Badge>;
        } else if (freeStock <= 5) {
            return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Low Stock ({freeStock} units)</Badge>;
        } else {
            return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">In Stock ({freeStock} units)</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Search Header */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {/* Main Search */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder="Search by part number, description, or vehicle model..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-12 h-14 text-lg"
                                    />
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 h-14 px-8" onClick={handleSearch}>
                                    Search
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-14 px-6"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </div>

                            {/* Filters */}
                            {showFilters && (
                                <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Part Type</label>
                                        <select
                                            value={partTypeFilter}
                                            onChange={(e) => setPartTypeFilter(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                        >
                                            <option value="ALL">All Types</option>
                                            <option value="GENUINE">Genuine</option>
                                            <option value="AFTERMARKET">Aftermarket</option>
                                            <option value="BRANDED">Branded</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Availability</label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={inStockOnly}
                                                onChange={(e) => setInStockOnly(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm">In Stock Only</span>
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sort By</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="price_asc">Price: Low to High</option>
                                            <option value="price_desc">Price: High to Low</option>
                                            <option value="stock">Stock Level</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Results Count */}
                {activeSearch && (
                    <div className="text-sm text-slate-600">
                        {isLoading ? (
                            'Searching...'
                        ) : (
                            `Showing ${products?.length || 0} results for "${activeSearch}"`
                        )}
                    </div>
                )}

                {/* Product Results */}
                {isLoading && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-32 bg-slate-200 rounded mb-4" />
                                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-slate-200 rounded w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!isLoading && products && products.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Card key={product.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    {/* Product Image Placeholder */}
                                    <div className="w-full h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                                        <span className="text-slate-400 text-sm">Product Image</span>
                                    </div>

                                    {/* Product Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-bold text-lg">{product.productCode}</h3>
                                            <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Badge variant="outline" className={partTypeColors[product.partType]}>
                                                {product.partType}
                                            </Badge>
                                            {getStockBadge(product.freeStock)}
                                        </div>

                                        {/* Pricing */}
                                        <div className="border-t pt-3">
                                            <div className="text-3xl font-bold text-blue-600">
                                                £{product.price.toFixed(2)}
                                            </div>
                                            {product.bandLevel && (
                                                <div className="text-xs text-slate-500">Band {product.bandLevel} pricing</div>
                                            )}
                                            {product.entitlementContext && (
                                                <div className="text-xs text-slate-500 mt-1">{product.entitlementContext}</div>
                                            )}
                                        </div>

                                        {/* Add to Cart */}
                                        <div className="flex gap-2 pt-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={quantities[product.id] || 1}
                                                onChange={(e) =>
                                                    setQuantities({ ...quantities, [product.id]: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-20"
                                            />
                                            <Button
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.freeStock === 0 || addingToCart === product.id}
                                            >
                                                {addingToCart === product.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                        Add to Cart
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!isLoading && products && products.length === 0 && activeSearch && (
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="py-16 text-center">
                            <p className="text-slate-500 text-lg">No products found for "{activeSearch}"</p>
                            <p className="text-slate-400 text-sm mt-2">Try adjusting your search or filters</p>
                        </CardContent>
                    </Card>
                )}

                {!activeSearch && (
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="py-16 text-center">
                            <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">Search for parts to get started</p>
                            <p className="text-slate-400 text-sm mt-2">
                                Use part numbers, descriptions, or vehicle models
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
