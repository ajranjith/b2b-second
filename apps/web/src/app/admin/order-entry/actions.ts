'use client'; // This is actually an action file, but usually exported to use in client components

import { orderEngine, OrderInput } from '@/services/OrderEngine';

export async function submitOrderAction(input: OrderInput) {
    try {
        const result = await orderEngine.createOrder(input);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
