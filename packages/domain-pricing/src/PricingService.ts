import { PrismaClient, PartType, Prisma, Entitlement } from '@prisma/client';

export class EntitlementError extends Error {
    constructor(message: string = "Product not available") {
        super(message);
        this.name = "EntitlementError";
    }
}

export interface PriceResult {
    price: Prisma.Decimal;
    bandCode: string;
    minimumPriceApplied: boolean;
    productId: string;
    productCode: string;
    description: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    available: boolean;
}

export class PricingService {
    constructor(private prisma: PrismaClient) { }

    async canDealerViewProduct(dealerAccountId: string, partType: PartType): Promise<boolean> {
        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            select: { entitlement: true }
        });

        if (!dealer) {
            throw new Error(`Dealer account not found: ${dealerAccountId}`);
        }

        const entitlement = dealer.entitlement;

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

        const isVisible = await this.canDealerViewProduct(dealerAccountId, product.partType);
        if (!isVisible) {
            throw new EntitlementError("Product not available");
        }

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
        const priceBand = product.bandPrices.find((pb: any) => pb.bandCode === bandCode);

        if (!priceBand) {
            throw new Error(`No price available for dealer's band: ${bandCode}`);
        }

        let finalPrice = Number(priceBand.price);
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
            minimumPriceApplied: minPriceApplied,
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
