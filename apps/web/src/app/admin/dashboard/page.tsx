'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Package, UploadCloud, Users } from 'lucide-react';
import { getUser } from '@/lib/auth';

export default function AdminDashboard() {
    const router = useRouter();

    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'ADMIN') {
            router.push('/login');
            return;
        }
    }, [router]);

    const stats = [
        { label: 'Total Dealers', value: '142', change: '+8', trend: 'up', icon: Users },
        { label: 'Active Orders', value: '89', change: '+12', trend: 'up', icon: Package },
        { label: 'Pending Imports', value: '3', change: '0', trend: 'neutral', icon: UploadCloud },
        { label: 'Revenue (MTD)', value: 'GBP 245K', change: '+18%', trend: 'up', icon: BarChart3 },
    ];

    const recentActivity = [
        { type: 'import', message: 'Genuine parts import completed', time: '10 mins ago', status: 'success' },
        { type: 'dealer', message: 'New dealer account created: Acme Motors', time: '1 hour ago', status: 'info' },
        { type: 'order', message: 'Large order placed by Premium Parts Ltd', time: '2 hours ago', status: 'warning' },
        { type: 'import', message: 'Backorder data updated', time: '3 hours ago', status: 'success' },
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

                        {/* System Health */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">System Health</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">API Status</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Operational</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Database</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Healthy</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Import Queue</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">3 Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 mt-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' :
                                            activity.status === 'warning' ? 'bg-orange-500' :
                                                'bg-blue-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900">{activity.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                            View all activity
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
