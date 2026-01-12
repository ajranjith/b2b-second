'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, getErrorMessage } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await auth.login(email, password);
            setToken(data.token);
            setUser(data.user);

            if (data.user.role === 'DEALER') {
                router.push('/dealer/search');
            } else if (data.user.role === 'ADMIN') {
                router.push('/admin/dealers');
            } else {
                // System or other
                router.push('/');
            }
        } catch (err: any) {
            setError(getErrorMessage(err) || 'Login failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-4 bg-white rounded shadow">
                <h1 className="text-2xl font-bold">Login</h1>
                {error && <div className="text-red-500">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
