// packages/rules/src/rules/PricingRules.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { PricingContext, PricingResult } from '../types'
import { PricingRuleError, EntitlementError } from '../errors'

export class PricingRules {
    constructor(private prisma: PrismaClient) { }

    /**
     * Calculate price for a dealer-product combination
     * BUSINESS RULES:
     * 1. Dealer must have ACTIVE or SUSPENDED status (INACTIVE cannot see prices)
     * 2. Product must match dealer's entitlement
     * 3. Dealer must have band assignment for product's part type
     * 4. Product must have price for dealer's band
     * 5. If minimum price set, use max(band price, minimum price)
     */
    async calculatePrice(context: PricingContext): Promise<PricingResult> {
        // Rule 1: Check dealer status
        if (context.dealerStatus === 'INACTIVE') {
            throw new EntitlementError('Inactive dealers cannot view prices')
        }

        // Rule 2: Check entitlement
        const entitlementCheck = this.checkEntitlement(
            context.entitlement,
            context.partType
        )
        if (!entitlementCheck.allowed) {
            return {
                price: new Prisma.Decimal(0),
                bandCode: '',
                minimumPriceApplied: false,
                available: false,
                reason: entitlementCheck.reason,
            }
        }

        // Rule 3: Get dealer's band for this part type
        const bandAssignment = await this.prisma.dealerBandAssignment.findUnique({
            where: {
                dealerAccountId_partType: {
                    dealerAccountId: context.dealerAccountId,
                    partType: context.partType,
                },
            },
        })

        if (!bandAssignment) {
            throw new PricingRuleError(
                `No band assignment found for dealer ${context.dealerAccountId} and part type ${context.partType}`
            )
        }

        // Rule 4: Get price for dealer's band
        const bandPrice = await this.prisma.productPriceBand.findUnique({
            where: {
                productId_bandCode: {
                    productId: context.productId,
                    bandCode: bandAssignment.bandCode,
                },
            },
        })

        if (!bandPrice) {
            throw new PricingRuleError(
                `No price found for product ${context.productCode} band ${bandAssignment.bandCode}`
            )
        }

        // Rule 5: Apply minimum price if set
        const refPrice = await this.prisma.productPriceReference.findUnique({
            where: { productId: context.productId },
        })

        let finalPrice = bandPrice.price
        let minPriceApplied = false

        if (refPrice?.minimumPrice && bandPrice.price.lessThan(refPrice.minimumPrice)) {
            finalPrice = refPrice.minimumPrice
            minPriceApplied = true
        }

        return {
            price: finalPrice,
            bandCode: bandAssignment.bandCode,
            minimumPriceApplied: minPriceApplied,
            available: true,
        }
    }

    /**
     * Check if dealer's entitlement allows viewing this part type
     */
    private checkEntitlement(
        entitlement: string,
        partType: string
    ): { allowed: boolean; reason?: string } {
        switch (entitlement) {
            case 'SHOW_ALL':
                return { allowed: true }

            case 'GENUINE_ONLY':
                if (partType === 'GENUINE') {
                    return { allowed: true }
                }
                return {
                    allowed: false,
                    reason: 'Dealer can only view Genuine parts'
                }

            case 'AFTERMARKET_ONLY':
                if (partType === 'AFTERMARKET' || partType === 'BRANDED') {
                    return { allowed: true }
                }
                return {
                    allowed: false,
                    reason: 'Dealer can only view Aftermarket/Branded parts'
                }

            default:
                return {
                    allowed: false,
                    reason: 'Invalid entitlement'
                }
        }
    }

    /**
     * Batch price calculation for multiple products
     * More efficient than calling calculatePrice multiple times
     */
    async calculatePrices(
        dealerAccountId: string,
        productIds: string[]
    ): Promise<Map<string, PricingResult>> {
        // Get dealer info once
        const dealer = await this.prisma.dealerAccount.findUniqueOrThrow({
            where: { id: dealerAccountId },
            include: {
                bandAssignments: true,
            },
        })

        // Get all products with their prices
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                bandPrices: true,
                refPrice: true,
            },
        })

        const results = new Map<string, PricingResult>()

        for (const product of products) {
            try {
                const context: PricingContext = {
                    dealerAccountId: dealer.id,
                    dealerStatus: dealer.status,
                    entitlement: dealer.entitlement as any,
                    productId: product.id,
                    productCode: product.productCode,
                    partType: product.partType,
                    quantity: 1,
                }

                const result = await this.calculatePrice(context)
                results.set(product.id, result)
            } catch (error) {
                results.set(product.id, {
                    price: new Prisma.Decimal(0),
                    bandCode: '',
                    minimumPriceApplied: false,
                    available: false,
                    reason: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        return results
    }
}
