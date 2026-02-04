import { apiClient } from '../lib/api-client';

export interface OrderInput {
    dealerAccountId: string;
    dealerUserId: string;
    source: 'WEB' | 'ADMIN' | 'EDI';
    items: Array<{
        productCode: string;
        qty: number;
    }>;
}

export class OrderEngine {
    async createOrder(input: OrderInput) {
        console.log(`📦 [Order Engine] Submitting order from ${input.source} for dealer ${input.dealerAccountId}`);
        return apiClient.checkout(input.dealerUserId);
    }
}

export const orderEngine = new OrderEngine();
