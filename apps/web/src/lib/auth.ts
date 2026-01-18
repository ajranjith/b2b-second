export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'DEALER';
    adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'OPS';
    dealerAccountId?: string;
    dealerUserId?: string;
}

export const getAuthToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const decodeJwtPayload = (token: string): User | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
};

export const getUser = (): User | null => {
    const token = getAuthToken();
    if (!token) return null;
    return decodeJwtPayload(token);
};
