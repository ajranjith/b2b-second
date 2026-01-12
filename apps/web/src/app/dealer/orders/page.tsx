'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { dealer, getErrorMessage, Order, OrderLine } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    switch (status) {
        case 'SUSPENDED': colorClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200'; break;
        case 'PROCESSING': colorClass = 'bg-blue-100 text-blue-800 border border-blue-200'; break;
        case 'SHIPPED': colorClass = 'bg-green-100 text-green-800 border border-green-200'; break;
        case 'CANCELLED': colorClass = 'bg-red-100 text-red-800 border border-red-200'; break;
    }
    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {status}
        </span>
    );
};

function OrderRow({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatMoney = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
    };

    return (
        <>
            <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expanded ? 'bg-gray-50' : ''}`} onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.orderNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.poRef || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatMoney(order.total, order.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        className="text-gray-400 hover:text-gray-600 transition-transform transform duration-200"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        ▼
                    </button>
                </td>
            </tr>

            {expanded && (
                <tr>
                    <td colSpan={6} className="px-0 py-0 border-b border-gray-200 bg-gray-50">
                        <div className="p-4 pl-12 sm:p-6 sm:pl-16 space-y-4">
                            {/* Order Details Header */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4 border-b border-gray-200 pb-4">
                                <div>
                                    <span className="font-semibold block">Notes:</span> {order.notes || 'None'}
                                </div>
                                <div>
                                    <span className="font-semibold block">Dispatch Method:</span> {order.dispatchMethod || 'Standard'}
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300 bg-white">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Product</th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Description</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Qty</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Price</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {order.lines.map((line) => (
                                            <tr key={line.id}>
                                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{line.productCodeSnapshot}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{line.descriptionSnapshot}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 text-right">{line.qty}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 text-right">{formatMoney(line.unitPriceSnapshot, order.currency)}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900 text-right">{formatMoney(line.unitPriceSnapshot * line.qty, order.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function DealerOrdersPage() {
    const router = useRouter();
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    const { data: orders, isLoading, isError, error } = useQuery({
        queryKey: ['orders'],
        queryFn: () => dealer.getOrders(),
    });

    const filteredOrders = orders?.filter(order => {
        if (filter === 'ALL') return true;
        if (filter === 'OPEN') return ['SUSPENDED', 'PROCESSING'].includes(order.status);
        return order.status === filter;
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">Error loading orders: {getErrorMessage(error)}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Order History</h2>

                {/* Filter Tabs */}
                <div className="inline-flex rounded-md shadow-sm">
                    {['ALL', 'OPEN', 'SHIPPED', 'CANCELLED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg 
                        ${filter === f
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'OPEN' ? 'Open' : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredOrders && filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map(order => (
                                    <OrderRow key={order.id} order={order} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
