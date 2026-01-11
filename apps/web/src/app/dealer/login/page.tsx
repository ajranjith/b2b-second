'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DealerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock authentication - in production, call API
        setTimeout(() => {
            localStorage.setItem('userRole', 'dealer');
            localStorage.setItem('userEmail', email);
            router.push('/dealer/dashboard');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Hotbray Portal</h1>
                    <p className="text-slate-400">Dealer Login</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="dealer@example.com"
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-300">
                                <input type="checkbox" className="mr-2 rounded" />
                                Remember me
                            </label>
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Need an account?{' '}
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition font-medium">
                                Contact us
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>© 2024 Hotbray Ltd. All rights reserved.</p>
                    <p className="mt-1">Distributing quality spare parts since 1972</p>
                </div>
            </div>
        </div>
    );
}
