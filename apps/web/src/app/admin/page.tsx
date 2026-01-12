'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import {
    Users,
    ShoppingCart,
    Package,
    Upload,
    TrendingUp,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface DashboardData {
    dealers: {
        total: number;
        active: number;
        inactive: number;
        suspended: number;
    };
    orders: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        totalRevenue: number;
    };
    products: {
        total: number;
        genuine: number;
        aftermarket: number;
        branded: number;
        lowStock: number;
    };
    imports: {
        todayCount: number;
        lastSuccessful: string | null;
        failedToday: number;
    };
    recentOrders: Array<{
        id: string;
        orderNo: string;
        createdAt: string;
        total: number;
        dealerAccount: {
            companyName: string;
            accountNo: string;
        };
    }>;
    topDealers: Array<{
        companyName: string;
        accountNo: string;
        orderCount: number;
    }>;
}

export default function AdminDashboard() {
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard');
            return response.data;
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    });

    if (isLoading || !data) {
        return (
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-slate-500">Loading dashboard data...</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-4 bg-slate-200 rounded w-24" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
                                <div className="h-3 bg-slate-200 rounded w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-500">Welcome to the Hotbray administration console.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Dealers Card */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Dealers</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{data.dealers.total}</div>
                        <div className="flex gap-2 mt-3 text-xs">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {data.dealers.active} Active
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                {data.dealers.inactive} Inactive
                            </Badge>
                            {data.dealers.suspended > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    {data.dealers.suspended} Suspended
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Card */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{data.orders.thisMonth}</div>
                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Today:</span>
                                <span className="font-semibold">{data.orders.today}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>This Week:</span>
                                <span className="font-semibold">{data.orders.thisWeek}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Revenue:</span>
                                <span className="font-semibold">£{data.orders.totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Card */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Products</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{data.products.total}</div>
                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Genuine:</span>
                                <span className="font-semibold">{data.products.genuine}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Aftermarket:</span>
                                <span className="font-semibold">{data.products.aftermarket}</span>
                            </div>
                            {data.products.lowStock > 0 && (
                                <div className="flex items-center gap-1 text-amber-600 font-semibold">
                                    <AlertCircle className="h-3 w-3" />
                                    {data.products.lowStock} Low Stock
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Imports Card */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Import Status</CardTitle>
                        <Upload className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{data.imports.todayCount}</div>
                        <div className="mt-3 space-y-2 text-xs">
                            {data.imports.lastSuccessful && (
                                <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Last: {new Date(data.imports.lastSuccessful).toLocaleTimeString()}
                                </div>
                            )}
                            {data.imports.failedToday > 0 && (
                                <div className="flex items-center gap-1 text-red-600 font-semibold">
                                    <AlertCircle className="h-3 w-3" />
                                    {data.imports.failedToday} Failed Today
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Orders */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                        <CardDescription>Latest 10 orders from dealers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.recentOrders.slice(0, 10).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{order.orderNo}</div>
                                        <div className="text-xs text-slate-500">{order.dealerAccount.companyName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-sm">£{order.total.toFixed(2)}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {data.recentOrders.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">No recent orders</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Dealers */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Top Dealers</CardTitle>
                        <CardDescription>Top 5 dealers by order count (this month)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.topDealers.map((dealer, index) => (
                                <div
                                    key={dealer.accountNo}
                                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{dealer.companyName}</div>
                                            <div className="text-xs text-slate-500">{dealer.accountNo}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {dealer.orderCount} orders
                                    </Badge>
                                </div>
                            ))}
                            {data.topDealers.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">No data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
