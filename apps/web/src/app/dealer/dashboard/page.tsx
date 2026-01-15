'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DealerDashboard() {
    const router = useRouter();
    const { data: layout, isLoading, error } = useQuery({
        queryKey: ['dealer-dashboard-layout'],
        queryFn: async () => {
            const response = await api.get('/api/layout/dashboard');
            return response.data;
        }
    });

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;

    if (error) {
        router.push('/login');
        return null;
    }

    const stats = layout?.widgets?.filter((w: any) => w.type === 'stats') || [];

    const recentOrders = [
        { id: 'ORD-1001', date: '2024-01-10', items: 5, total: '£1,245.00', status: 'Processing' },
        { id: 'ORD-1002', date: '2024-01-09', items: 3, total: '£890.50', status: 'Shipped' },
        { id: 'ORD-1003', date: '2024-01-08', items: 8, total: '£2,100.00', status: 'Processing' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
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
                                <Link href="/dealer/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                                <Link href="/dealer/search" className="text-slate-600 hover:text-slate-900">Search Parts</Link>
                                <Link href="/dealer/cart" className="text-slate-600 hover:text-slate-900">Cart</Link>
                                <Link href="/dealer/orders" className="text-slate-600 hover:text-slate-900">Orders</Link>
                                <Link href="/dealer/backorders" className="text-slate-600 hover:text-slate-900">Backorders</Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600">Dealer Portal</span>
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
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">Welcome back!</h2>
                    <p className="text-slate-600 mt-1">Here's what's happening with your account today (SDUI Active).</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat: any, index: number) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                </div>
                                {stat.change && (
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                                        stat.trend === 'down' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {stat.change}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link href="/dealer/search" className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition transform hover:scale-[1.02]">
                        <div className="text-3xl mb-3">🔍</div>
                        <h3 className="text-xl font-bold mb-2">Search Parts</h3>
                        <p className="text-blue-100">Find the parts you need</p>
                    </Link>

                    <Link href="/dealer/cart" className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition transform hover:scale-[1.02]">
                        <div className="text-3xl mb-3">🛒</div>
                        <h3 className="text-xl font-bold mb-2">View Cart</h3>
                        <p className="text-green-100">Review your items</p>
                    </Link>

                    <Link href="/dealer/backorders" className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition transform hover:scale-[1.02]">
                        <div className="text-3xl mb-3">📋</div>
                        <h3 className="text-xl font-bold mb-2">Backorders</h3>
                        <p className="text-orange-100">Check pending items</p>
                    </Link>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.items}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.total}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-200">
                        <Link href="/dealer/orders" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                            View all orders →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
