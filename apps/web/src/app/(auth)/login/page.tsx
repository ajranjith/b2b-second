'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import api from '@/lib/api';
import { setAuthToken } from '@/lib/auth';

const loginSchema = z.object({
    emailOrAccount: z.string().min(1, 'Email or Account Number is required'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: data.emailOrAccount,
                password: data.password,
            });

            const { token } = response.data;

            // Save token
            setAuthToken(token);

            // Decode token to get role
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role;

            toast.success('Login successful!');

            // Redirect based on role
            if (role === 'ADMIN') {
                router.push('/admin');
            } else if (role === 'DEALER') {
                router.push('/dealer/search');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Invalid credentials. Please try again.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        H
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Hotbray</CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                            Sign in to access your account
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email or Account Number */}
                        <div className="space-y-2">
                            <Label htmlFor="emailOrAccount">Email or Account Number</Label>
                            <Input
                                id="emailOrAccount"
                                type="text"
                                placeholder="Enter your email or account number"
                                {...register('emailOrAccount')}
                                className={errors.emailOrAccount ? 'border-red-500' : ''}
                                disabled={isLoading}
                            />
                            {errors.emailOrAccount && (
                                <p className="text-sm text-red-500">{errors.emailOrAccount.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a
                                    href="#"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toast.info('Please contact your administrator to reset your password.');
                                    }}
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    {...register('password')}
                                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center space-x-2">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                {...register('rememberMe')}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                                Remember me
                            </Label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <p>© 2024 Hotbray Ltd. All rights reserved.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
