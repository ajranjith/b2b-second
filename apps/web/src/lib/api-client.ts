const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Product {
    productCode: string;
    description: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    bandUsed: string;
    minPriceApplied: boolean;
    priceSource: string;
}

export interface CartItem {
    id: string;
    productId: string;
    qty: number;
    product: {
        productCode: string;
        description: string;
    };
}

export interface Cart {
    id: string;
    items: CartItem[];
    totals?: {
        subtotal: number;
        currency: string;
        items: Product[];
    };
}

export interface Order {
    id: string;
    orderNo: string;
    status: string;
    subtotal: number;
    total: number;
    currency: string;
    createdAt: string;
    lines: OrderLine[];
}

export interface OrderLine {
    id: string;
    productCodeSnapshot: string;
    descriptionSnapshot: string;
    qty: number;
    unitPriceSnapshot: number;
}

export interface BackorderLine {
    id: string;
    accountNo: string;
    customerName: string;
    part: string;
    description: string;
    qtyOrdered: number;
    qtyOutstanding: number;
    inWh: number;
}

export interface Dealer {
    id: string;
    accountNo: string;
    companyName: string;
    status: string;
    mainEmail: string;
    phone?: string;
    bandAssignments?: DealerBandAssignment[];
}

export interface DealerBandAssignment {
    id: string;
    partType: string;
    bandCode: string;
}

class ApiClient {
    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Dealer endpoints
    async searchProducts(dealerAccountId: string, query: string): Promise<Product[]> {
        return this.fetch(`/dealer/search?dealerAccountId=${dealerAccountId}&q=${query}`);
    }

    async getCart(dealerUserId: string): Promise<Cart> {
        return this.fetch(`/dealer/cart?dealerUserId=${dealerUserId}`);
    }

    async addToCart(dealerUserId: string, productCode: string, qty: number): Promise<void> {
        await this.fetch('/dealer/cart/items', {
            method: 'POST',
            body: JSON.stringify({ dealerUserId, productCode, qty }),
        });
    }

    async updateCartItem(itemId: string, qty: number): Promise<void> {
        await this.fetch(`/dealer/cart/items/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ qty }),
        });
    }

    async removeCartItem(itemId: string): Promise<void> {
        await this.fetch(`/dealer/cart/items/${itemId}`, {
// withAudit(
            method: 'DELETE',
        });
    }

    async checkout(dealerUserId: string): Promise<Order> {
        return this.fetch('/dealer/checkout', {
            method: 'POST',
            body: JSON.stringify({ dealerUserId }),
        });
    }

    async getOrders(dealerAccountId: string): Promise<Order[]> {
        return this.fetch(`/dealer/orders?dealerAccountId=${dealerAccountId}`);
    }

    async getBackorders(accountNo: string): Promise<BackorderLine[]> {
        return this.fetch(`/dealer/backorders?accountNo=${accountNo}`);
    }

    // Admin endpoints
    async getDealers(): Promise<Dealer[]> {
        return this.fetch('/admin/dealers');
    }

    async createDealer(data: Partial<Dealer>): Promise<Dealer> {
        return this.fetch('/admin/dealers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateDealerBands(dealerId: string, bands: DealerBandAssignment[]): Promise<void> {
        await this.fetch(`/admin/dealers/${dealerId}/bands`, {
            method: 'PATCH',
            body: JSON.stringify({ bands }),
        });
    }

    async getAllOrders(): Promise<Order[]> {
        return this.fetch('/admin/orders');
    }

    async getImports(): Promise<any[]> {
        return this.fetch('/admin/imports');
    }
}

export const apiClient = new ApiClient();
