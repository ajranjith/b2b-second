'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeToken, getUser, User } from '@/lib/auth';

export default function DealerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    const handleLogout = () => {
        removeToken();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold">Dealer Portal</h1>
                    {user?.companyName && <span className="text-sm text-slate-300">{user.companyName}</span>}
                </div>
                <nav className="flex items-center space-x-6">
                    <Link href="/dealer/search" className="hover:text-amber-400 transition-colors">Search</Link>
                    <Link href="/dealer/cart" className="hover:text-amber-400 transition-colors">Cart</Link>
                    <Link href="/dealer/orders" className="hover:text-amber-400 transition-colors">Orders</Link>
                    <div className="border-l border-slate-600 h-6 mx-2"></div>
                    <button onClick={handleLogout} className="text-red-300 hover:text-red-100 transition-colors">Logout</button>
                </nav>
            </header>
            <main className="flex-1 p-8 bg-gray-50">
                {children}
            </main>
        </div>
    );
}
