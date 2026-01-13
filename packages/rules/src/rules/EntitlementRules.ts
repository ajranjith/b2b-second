// packages/rules/src/rules/EntitlementRules.ts
import { Entitlement, PartType, PrismaClient } from '@prisma/client'
import { EntitlementCheck, EntitlementResult } from '../types'

export class EntitlementRules {
    /**
     * Check if dealer can access a product based on entitlement
     */
    static canAccessProduct(
        entitlement: Entitlement,
        partType: PartType
    ): EntitlementResult {
        switch (entitlement) {
            case 'SHOW_ALL':
                return { allowed: true }

            case 'GENUINE_ONLY':
                return {
                    allowed: partType === 'GENUINE',
                    reason: partType !== 'GENUINE'
                        ? 'Your account only has access to Genuine parts'
                        : undefined,
                }

            case 'AFTERMARKET_ONLY':
                return {
                    allowed: partType === 'AFTERMARKET' || partType === 'BRANDED',
                    reason: partType === 'GENUINE'
                        ? 'Your account only has access to Aftermarket and Branded parts'
                        : undefined,
                }

            default:
                return {
                    allowed: false,
                    reason: 'Invalid entitlement configuration',
                }
        }
    }

    /**
     * Filter product IDs based on entitlement
     */
    static async filterProductsByEntitlement(
        prisma: PrismaClient,
        entitlement: Entitlement,
        productIds: string[]
    ): Promise<string[]> {
        if (entitlement === 'SHOW_ALL') {
            return productIds
        }

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, partType: true },
        })

        return products
            .filter(p => this.canAccessProduct(entitlement, p.partType).allowed)
            .map(p => p.id)
    }

    /**
     * Get SQL filter for entitlement (for efficient queries)
     */
    static getEntitlementFilter(entitlement: Entitlement): any {
        switch (entitlement) {
            case 'SHOW_ALL':
                return {} // No filter

            case 'GENUINE_ONLY':
                return { partType: 'GENUINE' }

            case 'AFTERMARKET_ONLY':
                return { partType: { in: ['AFTERMARKET', 'BRANDED'] } }

            default:
                return { id: 'impossible' } // Block all
        }
    }
}
