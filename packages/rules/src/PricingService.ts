
import { PrismaClient, PartType } from '@prisma/client';
import { z } from 'zod';

// We accept a Prisma Client instance to allow dependency injection / reuse
export class PricingService {
    constructor(private prisma: PrismaClient) { }

    async calculatePrice(dealerAccountId: string, productCode: string, qty: number = 1) {
        // 1. Fetch Product
        const product = await this.prisma.product.findUnique({
            where: { productCode },
            include: {
                refPrice: true,
                bandPrices: true
            }
        });

        if (!product) {
            throw new Error(`Product not found: ${productCode}`);
        }

        if (!product.isActive) {
            throw new Error(`Product is inactive: ${productCode}`);
        }

        // 2. Fetch Dealer Band Assignment for this PartType
        const assignment = await this.prisma.dealerBandAssignment.findFirst({
            where: {
                dealerAccountId,
                partType: product.partType
            }
        });

        if (!assignment) {
            // Fallback? Or error? Usually distinct assignment needed. 
            // If no assignment, maybe retail price? Or error?
            // Assuming error or List Price if no discount.
            // Let's default to List Price if no band assigned, to be safe, or throw.
            // Requirement says "lookup dealer band assignment".
            throw new Error(`No band assignment for dealer ${dealerAccountId} and part type ${product.partType}`);
        }

        const bandCode = assignment.bandCode;

        // 3. Lookup Price for Band
        const priceBand = product.bandPrices.find(pb => pb.bandCode === bandCode);

        // 4. Determine Base Price
        let finalPrice = 0;
        let priceSource = 'BAND';

        if (priceBand) {
            finalPrice = Number(priceBand.price);
        } else {
            // Fallback to retail/list/trade if specific band price missing?
            // Logic: usually if band price missing, check price reference columns (band1, band2...) if we had them or list.
            // For now, if explicit band missing, use List Price.
            if (product.refPrice?.listPrice) {
                finalPrice = Number(product.refPrice.listPrice);
                priceSource = 'LIST_FALLBACK';
            } else {
                throw new Error(`No price found for product ${productCode} on band ${bandCode}`);
            }
        }

        // 5. Apply Minimum Price Logic
        let minPriceApplied = false;
        if (product.refPrice?.minimumPrice) {
            const minPrice = Number(product.refPrice.minimumPrice);
            if (finalPrice < minPrice) {
                finalPrice = minPrice;
                minPriceApplied = true;
                priceSource = 'MIN_PRICE';
            }
        }

        return {
            productCode,
            description: product.description,
            qty,
            unitPrice: finalPrice,
            totalPrice: finalPrice * qty,
            currency: 'GBP', // Hardcoded for now
            bandUsed: bandCode,
            minPriceApplied,
            priceSource
        };
    }
}
