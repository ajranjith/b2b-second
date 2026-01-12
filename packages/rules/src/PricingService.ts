
import { PrismaClient, PartType, Prisma } from '@prisma/client';
import { z } from 'zod';

// Export PriceResult type as required
export interface PriceResult {
    price: Prisma.Decimal;
    bandCode: string;
    minPriceApplied: boolean;
    productId: string;
    productCode: string;
    description: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
}

// We accept a Prisma Client instance to allow dependency injection / reuse
export class PricingService {
    constructor(private prisma: PrismaClient) { }

    async calculatePrice(dealerAccountId: string, productCode: string, qty: number = 1): Promise<PriceResult> {
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
            throw new Error(`Dealer has no band assignment for this part type: ${product.partType}`);
        }

        const bandCode = assignment.bandCode;

        // 3. Lookup Price for Band
        const priceBand = product.bandPrices.find(pb => pb.bandCode === bandCode);

        if (!priceBand) {
            throw new Error(`No price available for dealer's band: ${bandCode}`);
        }

        let finalPrice = Number(priceBand.price);

        // 4. Apply Minimum Price Logic
        let minPriceApplied = false;
        if (product.refPrice?.minimumPrice) {
            const minPrice = Number(product.refPrice.minimumPrice);
            if (finalPrice < minPrice) {
                finalPrice = minPrice;
                minPriceApplied = true;
            }
        }

        return {
            price: priceBand.price,
            bandCode,
            minPriceApplied,
            productId: product.id,
            productCode: product.productCode,
            description: product.description,
            qty,
            unitPrice: finalPrice,
            totalPrice: finalPrice * qty,
            currency: 'GBP'
        };
    }
}
