/**
 * Order Validator
 * Business rules for order creation and modification
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, RuleError } from '../types';

export interface OrderInput {
    dealerAccountId: string;
    dealerUserId: string;
    lines: Array<{ productCode: string; qty: number }>;
}

export class OrderValidator {
    constructor(private prisma: PrismaClient) { }

    validateOrderCreate(order: OrderInput): ValidationResult {
        const errors: RuleError[] = [];

        if (!order.dealerAccountId) {
            errors.push({ field: 'dealerAccountId', message: 'Dealer account ID is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!order.dealerUserId) {
            errors.push({ field: 'dealerUserId', message: 'Dealer user ID is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!order.lines || order.lines.length === 0) {
            errors.push({ field: 'lines', message: 'Order must have at least one line', code: 'REQUIRED', severity: 'error' });
        }

        if (order.lines) {
            order.lines.forEach((line, index) => {
                const lineErrors = this.validateOrderLine(line, index);
                errors.push(...lineErrors);
            });
        }

        return { valid: errors.length === 0, errors };
    }

    private validateOrderLine(line: { productCode: string; qty: number }, index: number): RuleError[] {
        const errors: RuleError[] = [];
        const prefix = `lines[${index}]`;

        if (!line.productCode) {
            errors.push({ field: `${prefix}.productCode`, message: 'Product code is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!line.qty || line.qty <= 0) {
            errors.push({ field: `${prefix}.qty`, message: 'Quantity must be greater than 0', code: 'INVALID_VALUE', severity: 'error' });
        }

        if (!Number.isInteger(line.qty)) {
            errors.push({ field: `${prefix}.qty`, message: 'Quantity must be a whole number', code: 'INVALID_VALUE', severity: 'error' });
        }

        return errors;
    }

    async validateOrderUpdate(orderId: string): Promise<ValidationResult> {
        const errors: RuleError[] = [];

        const order = await this.prisma.orderHeader.findUnique({
            where: { id: orderId },
            select: { id: true, status: true }
        });

        if (!order) {
            errors.push({
                field: 'orderId',
                message: `Order not found: ${orderId}`,
                code: 'NOT_FOUND',
                severity: 'critical'
            });
            return { valid: false, errors };
        }

        const immutableStatuses = ['SHIPPED', 'CANCELLED'];
        if (immutableStatuses.includes(order.status)) {
            errors.push({
                field: 'status',
                message: `Cannot modify order in ${order.status} status`,
                code: 'IMMUTABLE',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    validateStatusTransition(currentStatus: string, newStatus: string): ValidationResult {
        const errors: RuleError[] = [];

        const validTransitions: Record<string, string[]> = {
            'SUSPENDED': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': [],
            'CANCELLED': []
        };

        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            errors.push({
                field: 'status',
                message: `Cannot transition from ${currentStatus} to ${newStatus}`,
                code: 'INVALID_TRANSITION',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }
}
