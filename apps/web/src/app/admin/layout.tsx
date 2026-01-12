'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleLogout = () => {
        removeToken();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Admin Portal</h1>
                <nav className="space-x-4">
                    <Link href="/admin/dealers" className="hover:text-slate-300">Dealers</Link>
                    <Link href="/admin/imports" className="hover:text-slate-300">Imports</Link>
                    <Link href="/admin/orders" className="hover:text-slate-300">Orders</Link>
                    <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">Logout</button>
                </nav>
            </header>
            <main className="flex-1 p-8 bg-gray-100">
                {children}
            </main>
        </div>
    );
}
