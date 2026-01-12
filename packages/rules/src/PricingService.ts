import { PrismaClient, PartType, Prisma, Entitlement } from '@prisma/client';

// Export EntitlementError as requested
export class EntitlementError extends Error {
    constructor(message: string = "Product not available") {
        super(message);
        this.name = "EntitlementError";
    }
}

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
    available: boolean; // NEW: based on entitlement check
}

// We accept a Prisma Client instance to allow dependency injection / reuse
export class PricingService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Checks if a dealer is entitled to view a product based on its part type.
     */
    async canDealerViewProduct(dealerAccountId: string, partType: PartType): Promise<boolean> {
        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            select: { entitlement: true }
        });

        if (!dealer) {
            throw new Error(`Dealer account not found: ${dealerAccountId}`);
        }

        const entitlement = dealer.entitlement;

        // Entitlement Logic:
        // GENUINE_ONLY: can only see GENUINE
        // AFTERMARKET_ONLY: can see anything except GENUINE (AFTERMARKET, BRANDED)
        // SHOW_ALL: can see everything

        if (entitlement === Entitlement.GENUINE_ONLY) {
            return partType === PartType.GENUINE;
        }

        if (entitlement === Entitlement.AFTERMARKET_ONLY) {
            return partType !== PartType.GENUINE;
        }

        if (entitlement === Entitlement.SHOW_ALL) {
            return true;
        }

        return false;
    }

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

        // 2. CHECK ENTITLEMENT FILTER
        const isVisible = await this.canDealerViewProduct(dealerAccountId, product.partType);
        if (!isVisible) {
            throw new EntitlementError("Product not available");
        }

        // 3. Fetch Dealer Band Assignment for this PartType
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

        // 4. Lookup Price for Band
        const priceBand = product.bandPrices.find(pb => pb.bandCode === bandCode);

        if (!priceBand) {
            throw new Error(`No price available for dealer's band: ${bandCode}`);
        }

        let finalPrice = Number(priceBand.price);

        // 5. Apply Minimum Price Logic
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
            currency: 'GBP',
            available: true
        };
    }
}
