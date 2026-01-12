'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dealer, getErrorMessage, CartItem, CheckoutData } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { isAuthenticated } from '@/lib/auth';

function CartItemRow({ item }: { item: CartItem }) {
    const [qty, setQty] = useState(item.qty);
    const debouncedQty = useDebounce(qty, 500);
    const queryClient = useQueryClient();

    // Sync state with props if props change externally (and not just from our own optimistic update hopefully)
    useEffect(() => {
        setQty(item.qty);
    }, [item.qty]);

    const updateMutation = useMutation({
        mutationFn: (newQty: number) => dealer.updateCartItem(item.id, newQty),
        onMutate: async (newQty) => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData(['cart']);

            // Optimistically update cart item qty and total
            queryClient.setQueryData(['cart'], (old: any) => {
                if (!old) return old;
                const newItems = old.items.map((i: CartItem) => i.id === item.id ? { ...i, qty: newQty, lineTotal: (i.unitPrice || 0) * newQty } : i);
                const newTotal = newItems.reduce((sum: number, i: CartItem) => sum + (i.lineTotal || 0), 0);
                return {
                    ...old,
                    items: newItems,
                    total: newTotal
                };
            });

            return { previousCart };
        },
        onError: (err, newQty, context: any) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            alert(`Failed to update quantity: ${getErrorMessage(err)}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
    });

    const removeMutation = useMutation({
        mutationFn: () => dealer.removeFromCart(item.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData(['cart']);
            queryClient.setQueryData(['cart'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.filter((i: CartItem) => i.id !== item.id)
                };
            });
            return { previousCart };
        },
        onError: (err, _, context: any) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            alert(`Failed to remove item: ${getErrorMessage(err)}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
    });

    // Trigger update when debounced qty changes and differs from prop
    useEffect(() => {
        if (debouncedQty !== item.qty && debouncedQty > 0) {
            updateMutation.mutate(debouncedQty);
        }
    }, [debouncedQty]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) setQty(val);
        else setQty(0); // Allow typing? 
    };

    const formatPrice = (price: number | null) => {
        if (price === null) return 'N/A';
        // Access currency from cart? Passed via props? item doesn't have currency usually, Cart does. 
        // Assuming GBP for now or standard format
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
    };

    const lineTotal = (item.unitPrice || 0) * qty; // Calculate locally for responsiveness

    return (
        <tr className="hover:bg-gray-50 border-b last:border-0 border-gray-100">
            <td className="px-6 py-4 font-medium text-gray-900">{item.productCode}</td>
            <td className="px-6 py-4 text-gray-500">{item.description}</td>
            <td className="px-6 py-4">
                <input
                    type="number"
                    min="1"
                    className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    value={qty}
                    onChange={handleChange}
                />
            </td>
            <td className="px-6 py-4 text-right text-gray-600">
                {formatPrice(item.unitPrice)}
            </td>
            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                {formatPrice(item.lineTotal)} {/* Use server lineTotal or local? Item has lineTotal from server */}
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    onClick={() => removeMutation.mutate()}
                    className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                    disabled={removeMutation.isPending}
                >
                    {removeMutation.isPending ? 'Removing...' : 'Remove'}
                </button>
            </td>
        </tr>
    );
}

export default function DealerCartPage() {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    const { data: cart, isLoading, isError, error } = useQuery({
        queryKey: ['cart'],
        queryFn: () => dealer.getCart(),
    });

    const [dispatchMethod, setDispatchMethod] = useState('STANDARD');
    const [poRef, setPoRef] = useState('');
    const [notes, setNotes] = useState('');

    const checkoutMutation = useMutation({
        mutationFn: (data: CheckoutData) => dealer.checkout(data),
        onSuccess: (res) => {
            alert(`Order Placed Successfully!\nOrder No: ${res.order.orderNo}`);
            setTimeout(() => {
                router.push('/dealer/orders');
            }, 2000);
        },
        onError: (err) => {
            alert(`Checkout failed: ${getErrorMessage(err)}`);
        }
    });

    const handleCheckout = () => {
        if (!confirm("Are you sure you want to place this order?")) return;

        checkoutMutation.mutate({
            dispatchMethod,
            poRef: poRef || undefined,
            notes: notes || undefined
        });
    };

    const formatTotal = (val: number, currency: string) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency }).format(val);
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading cart...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">Error loading cart: {getErrorMessage(error)}</div>;

    if (!cart || cart.items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-lg shadow text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added any items yet.</p>
                <Link href="/dealer/search" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Start Ordering
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-gray-800">Shopping Cart <span className="text-gray-400 text-lg font-normal">({cart.itemCount} items)</span></h2>
                <Link href="/dealer/search" className="text-blue-600 hover:underline">Continue Shopping</Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {cart.items.map(item => (
                            <CartItemRow key={item.id} item={item} />
                        ))}
                    </tbody>
                </table>

                <div className="bg-gray-50 px-6 py-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Checkout Form */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Checkout Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dispatch Method</label>
                            <select
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={dispatchMethod}
                                onChange={(e) => setDispatchMethod(e.target.value)}
                                disabled={checkoutMutation.isPending}
                            >
                                <option value="STANDARD">Standard Delivery</option>
                                <option value="EXPRESS">Express Delivery</option>
                                <option value="PICKUP">Pickup</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">PO Reference (Optional)</label>
                            <input
                                type="text"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={poRef}
                                onChange={(e) => setPoRef(e.target.value)}
                                disabled={checkoutMutation.isPending}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={checkoutMutation.isPending}
                            />
                        </div>
                    </div>

                    {/* Totals & Actions */}
                    <div className="flex flex-col justify-end items-end space-y-4">
                        <div className="text-3xl font-bold text-gray-900 flex gap-4 items-center">
                            <span className="text-xl font-normal text-gray-500">Total:</span>
                            <span>{formatTotal(cart.total, cart.currency)}</span>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                            Prices exclude VAT and delivery charges.
                        </div>
                        <div className="w-full max-w-sm pt-4">
                            <button
                                onClick={handleCheckout}
                                disabled={checkoutMutation.isPending || cart.items.length === 0}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 shadow transition-transform transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {checkoutMutation.isPending ? 'Processing Order...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
