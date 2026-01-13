'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
    // Mock data - replace with real API calls
    const stats = [
        {
            name: 'Total Dealers',
            value: '24',
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'blue'
        },
        {
            name: 'Total Products',
            value: '1,234',
            change: '+5%',
            trend: 'up',
            icon: Package,
            color: 'green'
        },
        {
            name: 'Orders Today',
            value: '45',
            change: '-3%',
            trend: 'down',
            icon: ShoppingCart,
            color: 'orange'
        },
        {
            name: 'Revenue (MTD)',
            value: '£45,231',
            change: '+18%',
            trend: 'up',
            icon: TrendingUp,
            color: 'purple'
        },
    ]

    const recentOrders = [
        { id: 'ORD-001', dealer: 'Test Dealer Ltd', amount: '£234.50', status: 'completed' },
        { id: 'ORD-002', dealer: 'ABC Motors', amount: '£445.00', status: 'processing' },
        { id: 'ORD-003', dealer: 'XYZ Parts', amount: '£189.99', status: 'pending' },
    ]

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, here's what's happening today</p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600',
                        green: 'bg-green-100 text-green-600',
                        orange: 'bg-orange-100 text-orange-600',
                        purple: 'bg-purple-100 text-purple-600',
                    }[stat.color]

                    return (
                        <Card key={stat.name} className="stat-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.name}
                                </CardTitle>
                                <div className={`rounded-lg p-2 ${colorClasses}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Recent orders */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
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
        </div>
    )
}
