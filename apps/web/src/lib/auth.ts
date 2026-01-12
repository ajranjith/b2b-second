export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'DEALER';
    adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'OPS';
    dealerAccountId?: string;
}

export const getAuthToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getUser = (): User | null => {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
};
