'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Package, UploadCloud, Users } from 'lucide-react';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';

interface DashboardData {
    dealers: { total: number; active: number; inactive: number; suspended: number };
    orders: { today: number; thisWeek: number; thisMonth: number; totalRevenue: number };
    products: { total: number; genuine: number; aftermarket: number; branded: number; lowStock: number };
    imports: { todayCount: number; lastSuccessful: string | null; failedToday: number };
    recentOrders: Array<{
        id: string;
        orderNo: string;
        createdAt: string;
        status: string;
        total: number;
        dealerAccount: { companyName: string; accountNo: string };
    }>;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'ADMIN') {
            router.push('/login');
            return;
        }

        api.get('/admin/dashboard')
            .then((res) => setData(res.data))
            .catch(() => setError('Failed to load dashboard data.'))
            .finally(() => setIsLoading(false));
    }, [router]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-32 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center text-slate-500">
                {error || 'Unable to load dashboard.'}
            </div>
        );
    }

    const stats = [
        { label: 'Total Dealers', value: String(data.dealers.total), change: `${data.dealers.active} active`, trend: 'up' as const, icon: Users },
        { label: 'Orders This Month', value: String(data.orders.thisMonth), change: `${data.orders.today} today`, trend: 'up' as const, icon: Package },
        { label: 'Imports Today', value: String(data.imports.todayCount), change: `${data.imports.failedToday} failed`, trend: data.imports.failedToday > 0 ? 'down' as const : 'neutral' as const, icon: UploadCloud },
        { label: 'Revenue (Total)', value: `GBP ${Math.round(data.orders.totalRevenue).toLocaleString()}`, change: `${data.orders.thisWeek} orders this week`, trend: 'up' as const, icon: BarChart3 },
    ];

    return (
        <div className="space-y-8">
            <main className="space-y-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
                    <p className="text-slate-600 mt-1">System overview and management tools</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                    <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                                            stat.trend === 'down' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/admin/dealers" className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition group">
                                    <Users className="h-7 w-7 text-indigo-600 mb-2" />
                                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600">Manage Dealers</h4>
                                    <p className="text-sm text-slate-600 mt-1">Add or edit dealer accounts</p>
                                </Link>

                                <Link href="/admin/imports" className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group">
                                    <UploadCloud className="h-7 w-7 text-green-600 mb-2" />
                                    <h4 className="font-semibold text-slate-900 group-hover:text-green-600">Import Data</h4>
                                    <p className="text-sm text-slate-600 mt-1">Upload product & backorder files</p>
                                </Link>

                                <Link href="/admin/orders" className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group">
                                    <Package className="h-7 w-7 text-blue-600 mb-2" />
                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600">View Orders</h4>
                                    <p className="text-sm text-slate-600 mt-1">Monitor all dealer orders</p>
                                </Link>

                                <button className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition group">
                                    <BarChart3 className="h-7 w-7 text-orange-600 mb-2" />
                                    <h4 className="font-semibold text-slate-900 group-hover:text-orange-600">Reports</h4>
                                    <p className="text-sm text-slate-600 mt-1">Generate analytics</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h3>
                        <div className="space-y-4">
                            {data.recentOrders.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No recent orders.</p>
                            ) : (
                                data.recentOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900">
                                                {order.orderNo} — {order.dealerAccount.companyName}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(order.createdAt).toLocaleDateString()} · {order.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link href="/admin/orders" className="block w-full mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium text-center">
                            View all orders
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
