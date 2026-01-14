'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/ui';
import { Loader2, Package, FileText, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface OrderLine {
    id: string;
    productCodeSnapshot: string;
    descriptionSnapshot: string;
    qty: number;
    unitPriceSnapshot: number;
    lineStatus: string | null;
}

interface Order {
    id: string;
    orderNo: string;
    status: string;
    createdAt: string;
    total: number;
    poRef: string | null;
    lines: OrderLine[];
}

const statusColors: Record<string, string> = {
    SUSPENDED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    SHIPPED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export default function DealerOrdersPage() {
    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['dealer-orders'],
        queryFn: async () => {
            const response = await api.get('/dealer/orders');
            return response.data as Order[];
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load orders. Please try again later.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                        <p className="text-slate-500 mt-1">View and track your recent orders</p>
                    </div>
                </div>

                {!orders || orders.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No orders yet</h3>
                            <p className="text-slate-500 mt-2">
                                You haven&apos;t placed any orders yet. Start searching for parts!
                            </p>
                            <Link href="/dealer/search" className="inline-block mt-6">
                                <Button>Browse Parts</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="border-b bg-slate-50/50 p-4 flex flex-wrap gap-4 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold text-slate-900">{order.orderNo}</span>
                                        </div>
                                        <Badge variant="outline" className={statusColors[order.status] || 'bg-slate-100'}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-2">PO Ref:</span>
                                            <span className="font-medium text-slate-900">{order.poRef || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-2">Total:</span>
                                            <span className="font-bold text-slate-900">£{Number(order.total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-2">Product Info</th>
                                                    <th className="px-4 py-2 text-right">Qty</th>
                                                    <th className="px-4 py-2 text-right">Unit Price</th>
                                                    <th className="px-4 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {order.lines.map((line) => (
                                                    <tr key={line.id} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-900">
                                                                {line.productCodeSnapshot}
                                                            </div>
                                                            <div className="text-slate-500 text-xs truncate max-w-md">
                                                                {line.descriptionSnapshot}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium">
                                                            {line.qty}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-600">
                                                            £{Number(line.unitPriceSnapshot).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                            £{(Number(line.unitPriceSnapshot) * line.qty).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Link to details (future placeholder) */}
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            View Details <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
