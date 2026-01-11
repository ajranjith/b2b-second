'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock authentication
        setTimeout(() => {
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('userEmail', email);
            router.push('/admin/dashboard');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-white/10 rounded-full mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
                    <p className="text-purple-300">Hotbray Management System</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                                Admin Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="admin@hotbray.co.uk"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? 'Authenticating...' : 'Admin Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-200 text-xs text-center">
                            🔒 Secure admin access only
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-purple-300 text-sm">
                    <p>© 2024 Hotbray Ltd. Admin Portal</p>
                </div>
            </div>
        </div>
    );
}
