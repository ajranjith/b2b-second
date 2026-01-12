import { z } from 'zod';

const TOKEN_KEY = 'hotbray_token';
const USER_KEY = 'hotbray_user';

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'DEALER', 'SYSTEM']),
    dealerAccountId: z.string().optional(),
    companyName: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export function setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function setUser(user: User) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

export function isAuthenticated(): boolean {
    return !!getToken();
}
