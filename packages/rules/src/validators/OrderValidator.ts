/**
 * Order Validator
 * Business rules for order creation and modification
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, FieldValidationError, OrderContext, OrderLineContext } from '../types';

export class OrderValidator {
    constructor(private prisma: PrismaClient) { }

    /**
     * Validate order creation input
     */
    validateOrderCreate(order: OrderContext): ValidationResult {
        const errors: FieldValidationError[] = [];

        // Dealer account required
        if (!order.dealerAccountId) {
            errors.push({ field: 'dealerAccountId', message: 'Dealer account ID is required', code: 'REQUIRED' });
        }

        // Dealer user required
        if (!order.dealerUserId) {
            errors.push({ field: 'dealerUserId', message: 'Dealer user ID is required', code: 'REQUIRED' });
        }

        // Must have at least one line
        if (!order.lines || order.lines.length === 0) {
            errors.push({ field: 'lines', message: 'Order must have at least one line', code: 'REQUIRED' });
        }

        // Validate each line
        if (order.lines) {
            order.lines.forEach((line, index) => {
                const lineErrors = this.validateOrderLine(line, index);
                errors.push(...lineErrors);
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate a single order line
     */
    private validateOrderLine(line: OrderLineContext, index: number): FieldValidationError[] {
        const errors: FieldValidationError[] = [];
        const prefix = `lines[${index}]`;

        if (!line.productCode) {
            errors.push({ field: `${prefix}.productCode`, message: 'Product code is required', code: 'REQUIRED' });
        }

        if (!line.qty || line.qty <= 0) {
            errors.push({ field: `${prefix}.qty`, message: 'Quantity must be greater than 0', code: 'INVALID_VALUE' });
        }

        if (!Number.isInteger(line.qty)) {
            errors.push({ field: `${prefix}.qty`, message: 'Quantity must be a whole number', code: 'INVALID_VALUE' });
        }

        return errors;
    }

    /**
     * Validate order can be modified (status-based)
     */
    async validateOrderUpdate(orderId: string): Promise<ValidationResult> {
        const errors: FieldValidationError[] = [];

        const order = await this.prisma.orderHeader.findUnique({
            where: { id: orderId },
            select: { id: true, status: true }
        });

        if (!order) {
            errors.push({
                field: 'orderId',
                message: `Order not found: ${orderId}`,
                code: 'NOT_FOUND'
            });
            return { valid: false, errors };
        }

        // Cannot modify shipped or cancelled orders
        const immutableStatuses = ['SHIPPED', 'CANCELLED'];
        if (immutableStatuses.includes(order.status)) {
            errors.push({
                field: 'status',
                message: `Cannot modify order in ${order.status} status`,
                code: 'IMMUTABLE'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate order status transition
     */
    validateStatusTransition(currentStatus: string, newStatus: string): ValidationResult {
        const errors: FieldValidationError[] = [];

        const validTransitions: Record<string, string[]> = {
            'SUSPENDED': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': [], // Cannot transition from shipped
            'CANCELLED': [] // Cannot transition from cancelled
        };

        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            errors.push({
                field: 'status',
                message: `Cannot transition from ${currentStatus} to ${newStatus}`,
                code: 'INVALID_TRANSITION'
            });
        }

        return { valid: errors.length === 0, errors };
    }
}
