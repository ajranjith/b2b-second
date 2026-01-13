'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function MiniCart() {
    const router = useRouter();
    const { cart, itemCount, subtotal, updateItem, removeItem, isLoading } = useCart();
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldAutoExpand, setShouldAutoExpand] = useState(false);

    // Auto-expand when items are added
    useEffect(() => {
        if (itemCount > 0 && shouldAutoExpand) {
            setIsExpanded(true);
            setShouldAutoExpand(false);
            // Auto-collapse after 3 seconds
            const timer = setTimeout(() => setIsExpanded(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [itemCount, shouldAutoExpand]);

    const handleQuantityChange = (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        updateItem({ itemId, qty: newQty });
    };

    const handleRemoveItem = (itemId: string, productCode: string) => {
        if (confirm(`Remove ${productCode} from cart?`)) {
            removeItem(itemId);
        }
    };

    return (
        <>
            {/* Floating Cart Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg relative"
                >
                    <ShoppingCart className="h-6 w-6" />
                    {itemCount > 0 && (
                        <Badge
                            variant="outline"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white border-white p-0 flex items-center justify-center"
                        >
                            {itemCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Sliding Cart Panel */}
            <div
                className={`
                    fixed bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out
                    
                    /* Mobile: Slide from bottom, full width, 85vh height */
                    bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl
                    ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                    
                    /* Desktop: Slide from right, fixed width, full height */
                    md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-96 md:rounded-none
                    ${isExpanded ? 'md:translate-y-0 md:translate-x-0' : 'md:translate-x-full'}
                `}
            >
                <Card className="h-full flex flex-col rounded-none border-0">
                    {/* Header */}
                    <CardHeader className="border-b flex-shrink-0">
                        {/* Mobile drag handle */}
                        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 md:hidden" />

                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cart ({itemCount} items)
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(false)}
                                className="h-10 w-10 md:h-8 md:w-8"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Cart Items */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="space-y-4">
                                <p className="text-center text-sm text-slate-500 mb-4">Loading cart...</p>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                                                <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                                                <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
                                            </div>
                                            <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
                                                <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && (!cart?.items || cart.items.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your cart is empty</h3>
                                <p className="text-sm text-slate-500 mb-6">Start adding items from search</p>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        router.push('/dealer/search');
                                        setIsExpanded(false);
                                    }}
                                >
                                    Browse Products
                                </Button>
                            </div>
                        )}

                        {/* Cart Items */}

                        {!isLoading &&
                            cart?.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-slate-200 rounded-lg p-3 space-y-2 hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-in-out"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm">{item.product.productCode}</h4>
                                            <p className="text-xs text-slate-600 truncate">
                                                {item.product.description}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="mt-1 text-xs bg-slate-100 text-slate-700"
                                            >
                                                {item.product.partType}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(item.id, item.product.productCode)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-110 transition-all duration-200"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-slate-600">
                                            £{item.price.toFixed(2)} each
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-slate-200 rounded">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                                                    disabled={item.qty <= 1}
                                                    className="h-8 w-8 md:h-6 md:w-6 p-0 rounded-r-none"
                                                >
                                                    <Minus className="h-4 w-4 md:h-3 md:w-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-10 md:w-8 text-center">{item.qty}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                                                    className="h-8 w-8 md:h-6 md:w-6 p-0 rounded-l-none"
                                                >
                                                    <Plus className="h-4 w-4 md:h-3 md:w-3" />
                                                </Button>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600 min-w-[60px] text-right">
                                                £{(item.price * item.qty).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </CardContent>

                    {/* Footer */}
                    {!isLoading && cart?.items && cart.items.length > 0 && (
                        <div className="border-t flex-shrink-0 p-4 space-y-3 bg-slate-50">
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>Subtotal</span>
                                <span className="text-blue-600">£{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 md:h-10 transition-all duration-200 hover:scale-105 hover:shadow-md"
                                    onClick={() => {
                                        router.push('/dealer/cart');
                                        setIsExpanded(false);
                                    }}
                                >
                                    View Full Cart
                                </Button>
                                <Button
                                    className="w-full h-12 md:h-10 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                    onClick={() => {
                                        router.push('/dealer/cart?checkout=true');
                                        setIsExpanded(false);
                                    }}
                                >
                                    Checkout
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-300"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </>
    );
}
