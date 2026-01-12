'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CartItem {
    id: string;
    productId: string;
    qty: number;
    product: {
        productCode: string;
        description: string;
        partType: string;
    };
    price: number;
}

interface Cart {
    items: CartItem[];
    subtotal: number;
    itemCount: number;
}

export default function DealerCartPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showCheckout, setShowCheckout] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [dispatchMethod, setDispatchMethod] = useState('STANDARD');
    const [poRef, setPoRef] = useState('');
    const [notes, setNotes] = useState('');

    const { data: cart, isLoading } = useQuery<Cart>({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/dealer/cart');
            return response.data;
        },
    });

    const updateQuantityMutation = useMutation({
        mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
            await api.patch(`/dealer/cart/items/${itemId}`, { qty });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: () => {
            toast.error('Failed to update quantity');
        },
    });

    const removeItemMutation = useMutation({
        mutationFn: async (itemId: string) => {
            await api.delete(`/dealer/cart/items/${itemId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed from cart');
        },
        onError: () => {
            toast.error('Failed to remove item');
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/dealer/checkout', {
                dispatchMethod,
                poRef,
                notes,
            });
            return response.data;
        },
        onSuccess: (data) => {
            setOrderNumber(data.orderNo);
            setShowCheckout(false);
            setShowConfirmation(true);
            queryClient.invalidateQueries({ queryKey: ['cart'] });

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/dealer/orders');
            }, 3000);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message;
            if (message?.includes('SUSPENDED')) {
                toast.error('Your account is suspended. Please contact support.');
            } else {
                toast.error(message || 'Failed to place order');
            }
        },
    });

    const handleQuantityChange = (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        updateQuantityMutation.mutate({ itemId, qty: newQty });
    };

    const handleRemoveItem = (itemId: string) => {
        if (confirm('Remove this item from cart?')) {
            removeItemMutation.mutate(itemId);
        }
    };

    const handleCheckout = () => {
        if (!cart?.items?.length) return;
        setShowCheckout(true);
    };

    const handlePlaceOrder = () => {
        checkoutMutation.mutate();
    };

    const partTypeColors: Record<string, string> = {
        GENUINE: 'bg-blue-100 text-blue-700 border-blue-200',
        AFTERMARKET: 'bg-purple-100 text-purple-700 border-purple-200',
        BRANDED: 'bg-green-100 text-green-700 border-green-200',
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500">Loading cart...</p>
            </div>
        );
    }

    const isEmpty = !cart?.items?.length;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">Shopping Cart</h1>
                        {!isEmpty && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                {cart.itemCount} items
                            </Badge>
                        )}
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dealer/search')}>
                        Continue Shopping
                    </Button>
                </div>

                {/* Empty State */}
                {isEmpty && (
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="py-16 text-center">
                            <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-slate-700 mb-2">Your cart is empty</h2>
                            <p className="text-slate-500 mb-6">Add items to your cart to get started</p>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/dealer/search')}>
                                Continue Shopping
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Cart Items */}
                {!isEmpty && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <Card key={item.id} className="shadow-sm border-slate-200">
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            {/* Product Image Placeholder */}
                                            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-slate-400 text-xs">Image</span>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg">{item.product.productCode}</h3>
                                                        <p className="text-sm text-slate-600">{item.product.description}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`mt-2 ${partTypeColors[item.product.partType]}`}
                                                        >
                                                            {item.product.partType}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Price and Quantity */}
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm text-slate-600">
                                                        Unit Price: <span className="font-semibold">£{item.price.toFixed(2)}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center border border-slate-200 rounded-lg">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                                                                disabled={item.qty <= 1}
                                                                className="h-8 w-8 p-0 rounded-r-none"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                value={item.qty}
                                                                onChange={(e) =>
                                                                    handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                                                                }
                                                                className="h-8 w-16 text-center border-0 focus-visible:ring-0"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                                                                className="h-8 w-8 p-0 rounded-l-none"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        <div className="text-lg font-bold text-blue-600 min-w-[100px] text-right">
                                                            £{(item.price * item.qty).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-sm border-slate-200 sticky top-6">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Items ({cart.itemCount})</span>
                                        <span className="font-semibold">£{cart.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Subtotal</span>
                                            <span className="text-blue-600">£{cart.subtotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                                        onClick={handleCheckout}
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Checkout Dialog */}
                <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Complete Your Order</DialogTitle>
                            <DialogDescription>Please provide delivery and order details</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Dispatch Method */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Dispatch Method</Label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            value="STANDARD"
                                            checked={dispatchMethod === 'STANDARD'}
                                            onChange={(e) => setDispatchMethod(e.target.value)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Standard Delivery</div>
                                            <div className="text-sm text-slate-500">3-5 business days</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            value="EXPRESS"
                                            checked={dispatchMethod === 'EXPRESS'}
                                            onChange={(e) => setDispatchMethod(e.target.value)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Express Delivery</div>
                                            <div className="text-sm text-slate-500">1-2 business days</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            value="COLLECTION"
                                            checked={dispatchMethod === 'COLLECTION'}
                                            onChange={(e) => setDispatchMethod(e.target.value)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Collection</div>
                                            <div className="text-sm text-slate-500">Same day pickup</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* PO Reference */}
                            <div className="space-y-2">
                                <Label htmlFor="poRef">PO Reference (Optional)</Label>
                                <Input
                                    id="poRef"
                                    value={poRef}
                                    onChange={(e) => setPoRef(e.target.value)}
                                    placeholder="Enter your PO reference number"
                                />
                            </div>

                            {/* Order Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Order Notes (Optional)</Label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special instructions or notes"
                                    className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                                    Back to Cart
                                </Button>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={checkoutMutation.isPending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {checkoutMutation.isPending ? 'Placing Order...' : 'Place Order'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Order Confirmation Dialog */}
                <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                    <DialogContent>
                        <DialogHeader>
                            <div className="mx-auto mb-4">
                                <CheckCircle className="h-16 w-16 text-green-600" />
                            </div>
                            <DialogTitle className="text-center text-2xl">Order Placed Successfully!</DialogTitle>
                            <DialogDescription className="text-center">
                                Your order has been received and is being processed
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-slate-600 mb-1">Order Number</div>
                                <div className="text-2xl font-bold text-blue-600">{orderNumber}</div>
                            </div>

                            <p className="text-sm text-slate-600 text-center">
                                You will be redirected to your orders page shortly...
                            </p>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => router.push('/dealer/orders')} className="flex-1">
                                    View Order
                                </Button>
                                <Button onClick={() => router.push('/dealer/search')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
