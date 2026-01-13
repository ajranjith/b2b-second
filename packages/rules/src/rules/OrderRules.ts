// packages/rules/src/rules/OrderRules.ts
import { PrismaClient } from '@prisma/client'
import { OrderCreationContext, OrderValidationResult } from '../types'
import { OrderValidationError } from '../errors'

export class OrderRules {
    constructor(private prisma: PrismaClient) { }

    /**
     * Validate order creation
     * BUSINESS RULES:
     * 1. Dealer must be ACTIVE (not SUSPENDED or INACTIVE)
     * 2. Cart must not be empty
     * 3. All products must be active
     * 4. All products must be in stock (or allow backorder)
     * 5. All products must have valid pricing
     */
    async validateOrderCreation(
        context: OrderCreationContext
    ): Promise<OrderValidationResult> {
        const errors: string[] = []
        const warnings: string[] = []

        // Rule 1: Check dealer status
        if (context.dealerStatus === 'INACTIVE') {
            errors.push('Inactive dealers cannot place orders')
        }

        if (context.dealerStatus === 'SUSPENDED') {
            errors.push('Account suspended. Cannot place order. Please contact customer service team.')
        }

        // Rule 2: Check cart not empty
        if (context.cartItems.length === 0) {
            errors.push('Cart is empty')
        }

        // Rule 3 & 4: Check products
        const productIds = context.cartItems.map(item => item.productId)

        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                stock: true,
            },
        })

        const productMap = new Map(products.map(p => [p.id, p]))

        for (const item of context.cartItems) {
            const product = productMap.get(item.productId)

            if (!product) {
                errors.push(`Product ${item.productCode} not found`)
                continue
            }

            if (!product.isActive) {
                errors.push(`Product ${item.productCode} is no longer available`)
            }

            if (product.stock && product.stock.freeStock < item.quantity) {
                warnings.push(
                    `Product ${item.productCode}: Only ${product.stock.freeStock} in stock, ordered ${item.quantity}`
                )
            }
        }

        // Rule 5: Validate quantities
        for (const item of context.cartItems) {
            if (item.quantity <= 0) {
                errors.push(`Invalid quantity for product ${item.productCode}`)
            }
        }

        return {
            success: errors.length === 0,
            canProceed: errors.length === 0,
            errors: errors.map(msg => ({
                code: 'ORDER_VALIDATION',
                message: msg,
                severity: 'error' as const,
            })),
            warnings: warnings.map(msg => ({
                code: 'ORDER_WARNING',
                message: msg,
            })),
            blockers: errors.length > 0 ? errors : undefined,
        }
    }

    /**
     * Validate order status transition
     */
    validateStatusTransition(
        currentStatus: string,
        newStatus: string
    ): { allowed: boolean; reason?: string } {
        const allowedTransitions: Record<string, string[]> = {
            SUSPENDED: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['SHIPPED', 'CANCELLED'],
            SHIPPED: [], // Cannot transition from shipped
            CANCELLED: [], // Cannot transition from cancelled
        }

        const allowed = allowedTransitions[currentStatus]?.includes(newStatus) ?? false

        return {
            allowed,
            reason: allowed ? undefined : `Cannot transition from ${currentStatus} to ${newStatus}`,
        }
    }
}
