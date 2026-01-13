/**
 * Pricing Rules
 * Business logic for price calculation
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RuleResult, PriceCalculation } from '../types';
import { PricingError, DealerError } from '../errors';

export interface PricingContext {
    dealerAccountId: string;
    productCode: string;
    qty: number;
}

export class PricingRules {
    constructor(private prisma: PrismaClient) { }

    /**
     * Calculate price for a dealer and product
     */
    async calculateDealerPrice(ctx: PricingContext): Promise<RuleResult<PriceCalculation>> {
        try {
            // 1. Fetch Product
            const product = await this.prisma.product.findUnique({
                where: { productCode: ctx.productCode },
                include: {
                    refPrice: true,
                    bandPrices: true,
                    stock: true
                }
            });

            if (!product) {
                throw PricingError.productNotFound(ctx.productCode);
            }

            if (!product.isActive) {
                throw PricingError.productInactive(ctx.productCode);
            }

            // 2. Get dealer band assignment for this part type
            const assignment = await this.prisma.dealerBandAssignment.findFirst({
                where: {
                    dealerAccountId: ctx.dealerAccountId,
                    partType: product.partType
                }
            });

            if (!assignment) {
                throw DealerError.missingBandAssignment(ctx.dealerAccountId, product.partType);
            }

            // 3. Find price for dealer's band
            const priceBand = product.bandPrices.find(pb => pb.bandCode === assignment.bandCode);

            if (!priceBand) {
                throw PricingError.noPriceAvailable(ctx.productCode, assignment.bandCode);
            }

            // 4. Apply minimum price logic
            let finalPrice = Number(priceBand.price);
            let minPriceApplied = false;

            if (product.refPrice?.minimumPrice) {
                const minPrice = Number(product.refPrice.minimumPrice);
                if (finalPrice < minPrice) {
                    finalPrice = minPrice;
                    minPriceApplied = true;
                }
            }

            const result: PriceCalculation = {
                productId: product.id,
                productCode: product.productCode,
                description: product.description,
                partType: product.partType,
                qty: ctx.qty,
                bandCode: assignment.bandCode,
                unitPrice: finalPrice,
                totalPrice: finalPrice * ctx.qty,
                minPriceApplied,
                currency: 'GBP',
                available: true
            };

            return { success: true, data: result };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown pricing error',
                errorCode: error instanceof PricingError ? error.code : 'PRICING_ERROR'
            };
        }
    }

    /**
     * Apply minimum price rule
     */
    applyMinimumPrice(price: number, minPrice: number | null): { price: number; applied: boolean } {
        if (minPrice && price < minPrice) {
            return { price: minPrice, applied: true };
        }
        return { price, applied: false };
    }

    /**
     * Calculate volume discount (placeholder for future implementation)
     */
    applyVolumeDiscount(unitPrice: number, qty: number): { unitPrice: number; discountApplied: boolean } {
        // Future: Implement quantity break pricing
        // For now, no volume discounts
        return { unitPrice, discountApplied: false };
    }

    /**
     * Calculate line total
     */
    calculateLineTotal(unitPrice: number, qty: number): number {
        return Math.round(unitPrice * qty * 100) / 100; // Round to 2 decimal places
    }
}
