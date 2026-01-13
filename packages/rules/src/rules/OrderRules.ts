/**
 * Order Rules
 * Order creation and modification business rules
 */

import { PrismaClient } from '@prisma/client';
import { RuleResult, OrderContext, OrderLineContext } from '../types';
import { OrderError, DealerError } from '../errors';

export interface OrderTotals {
    subtotal: number;
    total: number;
    currency: string;
    lineCount: number;
}

export class OrderRules {
    constructor(private prisma: PrismaClient) { }

    /**
     * Check if dealer can create orders
     */
    async canCreateOrder(dealerAccountId: string): Promise<RuleResult<boolean>> {
        try {
            const dealer = await this.prisma.dealerAccount.findUnique({
                where: { id: dealerAccountId },
                select: { status: true }
            });

            if (!dealer) {
                throw DealerError.notFound(dealerAccountId);
            }

            if (dealer.status !== 'ACTIVE') {
                return {
                    success: false,
                    data: false,
                    error: `Dealer account is ${dealer.status}`,
                    errorCode: 'DEALER_INACTIVE'
                };
            }

            return { success: true, data: true };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Order creation check failed',
                errorCode: 'ORDER_ERROR'
            };
        }
    }

    /**
     * Check if order can be modified
     */
    async canModifyOrder(orderId: string): Promise<RuleResult<boolean>> {
        try {
            const order = await this.prisma.orderHeader.findUnique({
                where: { id: orderId },
                select: { status: true }
            });

            if (!order) {
                throw OrderError.notFound(orderId);
            }

            const immutableStatuses = ['SHIPPED', 'CANCELLED'];
            if (immutableStatuses.includes(order.status)) {
                return {
                    success: false,
                    data: false,
                    error: `Cannot modify order in ${order.status} status`,
                    errorCode: 'ORDER_IMMUTABLE'
                };
            }

            return { success: true, data: true };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Order modification check failed',
                errorCode: 'ORDER_ERROR'
            };
        }
    }

    /**
     * Calculate order totals from line prices
     */
    calculateOrderTotal(lines: Array<{ unitPrice: number; qty: number }>): OrderTotals {
        const subtotal = lines.reduce((sum, line) => {
            return sum + (line.unitPrice * line.qty);
        }, 0);

        // Round to 2 decimal places
        const roundedSubtotal = Math.round(subtotal * 100) / 100;

        return {
            subtotal: roundedSubtotal,
            total: roundedSubtotal, // Future: add tax calculation
            currency: 'GBP',
            lineCount: lines.length
        };
    }

    /**
     * Validate status transition is allowed
     */
    isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
        const validTransitions: Record<string, string[]> = {
            'SUSPENDED': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': [],
            'CANCELLED': []
        };

        return validTransitions[currentStatus]?.includes(newStatus) ?? false;
    }

    /**
     * Generate next order number
     */
    async generateOrderNumber(): Promise<string> {
        const today = new Date();
        const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Get count of orders created today
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const count = await this.prisma.orderHeader.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `ORD-${datePrefix}-${sequence}`;
    }
}
