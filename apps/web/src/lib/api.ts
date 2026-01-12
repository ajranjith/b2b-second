import axios, { AxiosError } from 'axios';
import { getToken, removeToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// --- Types ---

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'DEALER' | 'SYSTEM';
    dealerAccountId?: string;
    companyName?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Product {
    id: string;
    productCode: string;
    description: string;
    partType: string;
    supplier: string;
    freeStock: number;
    yourPrice: number | null;
    bandCode: string | null;
    minPriceApplied: boolean;
    currency: string;
    priceError?: string;
    aliases?: string[];
}

export interface SearchResponse {
    results: Product[];
    count: number;
    query: string | null;
}

export interface CartItem {
    id: string;
    productCode: string;
    description: string;
    partType: string;
    qty: number;
    unitPrice: number | null;
    lineTotal: number | null;
    bandCode: string | null;
    minPriceApplied: boolean;
    freeStock?: number;
    priceError?: string;
}

export interface Cart {
    cartId: string;
    items: CartItem[];
    itemCount: number;
    total: number;
    currency: string;
}

export interface OrderLine {
    id: string;
    productId: string;
    productCodeSnapshot: string;
    descriptionSnapshot: string;
    partTypeSnapshot: string;
    qty: number;
    unitPriceSnapshot: number;
    bandCodeSnapshot: string;
    lineTotal: number;
}

export interface Order {
    id: string;
    orderNo: string;
    status: string;
    subtotal: number;
    total: number;
    currency: string;
    poRef?: string;
    notes?: string;
    createdAt: string;
    lines: OrderLine[];
}

export interface CheckoutData {
    dispatchMethod?: string;
    poRef?: string;
    notes?: string;
}

export interface CheckoutResponse {
    message: string;
    order: Order;
}

// --- Axios Instance ---

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeToken();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- API Methods ---

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message;
    }
    return error instanceof Error ? error.message : 'An unknown error occurred';
};

export const auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        return data;
    },
    me: async (): Promise<User> => {
        const { data } = await api.get<User>('/auth/me');
        return data;
    }
};

export const dealer = {
    search: async (query: string, limit: number = 20): Promise<SearchResponse> => {
        const { data } = await api.get<SearchResponse>('/dealer/search', {
            params: { q: query, limit }
        });
        return data;
    },

    getProduct: async (productCode: string): Promise<Product> => {
        const { data } = await api.get<Product>(`/dealer/product/${productCode}`);
        return data;
    },

    getCart: async (): Promise<Cart> => {
        const { data } = await api.get<Cart>('/dealer/cart');
        return data;
    },

    addToCart: async (productId: string, qty: number): Promise<Cart> => {
        const { data } = await api.post<Cart>('/dealer/cart/items', { productId, qty });
        return data;
    },

    updateCartItem: async (id: string, qty: number): Promise<Cart> => {
        const { data } = await api.patch<Cart>(`/dealer/cart/items/${id}`, { qty });
        return data;
    },

    removeFromCart: async (id: string): Promise<Cart> => {
        const { data } = await api.delete<Cart>(`/dealer/cart/items/${id}`);
        return data;
    },

    checkout: async (checkoutData: CheckoutData): Promise<CheckoutResponse> => {
        const { data } = await api.post<CheckoutResponse>('/dealer/checkout', checkoutData);
        return data;
    },

    getOrders: async (): Promise<Order[]> => {
        const { data } = await api.get<Order[]>('/dealer/orders');
        return data;
    }
};
