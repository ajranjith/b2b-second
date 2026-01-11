'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        const email = localStorage.getItem('userEmail');

        if (role !== 'admin') {
            router.push('/admin/login');
        } else {
            setUserEmail(email || '');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        router.push('/admin/login');
    };

    const stats = [
        { label: 'Total Dealers', value: '142', change: '+8', trend: 'up', icon: '👥' },
        { label: 'Active Orders', value: '89', change: '+12', trend: 'up', icon: '📦' },
        { label: 'Pending Imports', value: '3', change: '0', trend: 'neutral', icon: '📥' },
        { label: 'Revenue (MTD)', value: '£245K', change: '+18%', trend: 'up', icon: '💰' },
    ];

    const recentActivity = [
        { type: 'import', message: 'Genuine parts import completed', time: '10 mins ago', status: 'success' },
        { type: 'dealer', message: 'New dealer account created: Acme Motors', time: '1 hour ago', status: 'info' },
        { type: 'order', message: 'Large order placed by Premium Parts Ltd', time: '2 hours ago', status: 'warning' },
        { type: 'import', message: 'Backorder data updated', time: '3 hours ago', status: 'success' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-bold text-white">Hotbray Admin</h1>
                            <nav className="hidden md:flex space-x-6">
                                <Link href="/admin/dashboard" className="text-white font-medium">Dashboard</Link>
                                <Link href="/admin/dealers" className="text-indigo-100 hover:text-white">Dealers</Link>
                                <Link href="/admin/imports" className="text-indigo-100 hover:text-white">Imports</Link>
                                <Link href="/admin/orders" className="text-indigo-100 hover:text-white">Orders</Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-indigo-100">{userEmail}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition"
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
                                <div className="text-3xl">{stat.icon}</div>
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
                                    <div className="text-2xl mb-2">👥</div>
                                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600">Manage Dealers</h4>
                                    <p className="text-sm text-slate-600 mt-1">Add or edit dealer accounts</p>
                                </Link>

                                <Link href="/admin/imports" className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group">
                                    <div className="text-2xl mb-2">📥</div>
                                    <h4 className="font-semibold text-slate-900 group-hover:text-green-600">Import Data</h4>
                                    <p className="text-sm text-slate-600 mt-1">Upload product & backorder files</p>
                                </Link>

                                <Link href="/admin/orders" className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group">
                                    <div className="text-2xl mb-2">📦</div>
                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600">View Orders</h4>
                                    <p className="text-sm text-slate-600 mt-1">Monitor all dealer orders</p>
                                </Link>

                                <button className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition group">
                                    <div className="text-2xl mb-2">📊</div>
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
                            View all activity →
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
