'use client'

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/ui';
import { Users, Package, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminDashboard() {
    const { data: layout, isLoading } = useQuery({
        queryKey: ['admin-dashboard-layout'],
        queryFn: async () => {
            const response = await api.get('/api/layout/dashboard');
            return response.data;
        }
    });

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;

    const stats = layout?.widgets?.filter((w: any) => w.type === 'stats') || [];
    const recentOrdersWidget = layout?.widgets?.find((w: any) => w.type === 'recent-orders');

    // Recent orders still mock for now until order service integration
    const recentOrders = [
        { id: 'ORD-001', dealer: 'Test Dealer Ltd', amount: '£234.50', status: 'completed' },
        { id: 'ORD-002', dealer: 'ABC Motors', amount: '£445.00', status: 'processing' },
        { id: 'ORD-003', dealer: 'XYZ Parts', amount: '£189.99', status: 'pending' },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, here's what's happening today (SDUI Active)</p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat: any) => {
                    const Icon = {
                        blue: Users,
                        green: Package,
                        orange: ShoppingCart,
                        purple: TrendingUp
                    }[stat.color as 'blue' | 'green' | 'orange' | 'purple'] || Package;

                    const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600',
                        green: 'bg-green-100 text-green-600',
                        orange: 'bg-orange-100 text-orange-600',
                        purple: 'bg-purple-100 text-purple-600',
                    }[stat.color as 'blue' | 'green' | 'orange' | 'purple']

                    return (
                        <Card key={stat.title} className="stat-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`rounded-lg p-2 ${colorClasses}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                {stat.change && (
                                    <div className="flex items-center gap-1 mt-1">
                                        {stat.trend === 'up' ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                            {stat.change}
                                        </span>
                                        <span className="text-xs text-gray-500">from last month</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Recent orders */}
            {recentOrdersWidget && (
                <Card>
                    <CardHeader>
                        <CardTitle>{recentOrdersWidget.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{order.id}</p>
                                        <p className="text-sm text-gray-500">{order.dealer}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-medium text-gray-900">{order.amount}</p>
                                        <Badge variant={
                                            order.status === 'completed' ? 'default' :
                                                order.status === 'processing' ? 'secondary' :
                                                    'outline'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
