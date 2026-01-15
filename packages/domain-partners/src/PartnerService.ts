import { PrismaClient, PartType, Entitlement, DealerStatus } from '@prisma/client';

export interface ProductSearchFilters {
    q?: string;
    limit?: number;
    partType?: PartType;
    inStockOnly?: boolean;
    sortBy?: 'price' | 'code' | 'stock';
}

export interface PricedProduct {
    id: string;
    productCode: string;
    description: string;
    partType: PartType;
    freeStock: number;
    yourPrice: number | null;
    bandCode: string | null;
    available: boolean;
    minimumPriceApplied: boolean;
    reason?: string;
    currency: string;
}

export class PartnerService {
    constructor(
        private prisma: PrismaClient,
        private pricingService: any // Will use PricingService from domain-pricing
    ) { }

    async getDealerInfo(dealerAccountId: string) {
        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            include: {
                bandAssignments: true
            }
        });
        if (!dealer) throw new Error('Dealer not found');
        return dealer;
    }

    async searchProducts(
        dealerAccountId: string,
        filters: ProductSearchFilters
    ): Promise<{ results: PricedProduct[]; count: number }> {
        const dealer = await this.getDealerInfo(dealerAccountId);

        if (dealer.status === DealerStatus.INACTIVE) {
            throw new Error('Account inactive');
        }

        let where: any = { isActive: true };

        if (filters.q) {
            where.OR = [
                { productCode: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
            ];
        }

        if (filters.partType) {
            where.partType = filters.partType;
        }

        if (filters.inStockOnly) {
            where.stock = { freeStock: { gt: 0 } };
        }

        const products = await this.prisma.product.findMany({
            where,
            include: {
                stock: true,
            },
            take: filters.limit || 20,
        });

        const results = await Promise.all(products.map(async (product: any) => {
            try {
                const pricing = await this.pricingService.calculatePrice(dealerAccountId, product.productCode);
                return {
                    id: product.id,
                    productCode: product.productCode,
                    description: product.description,
                    partType: product.partType,
                    freeStock: product.stock?.freeStock ?? 0,
                    yourPrice: pricing.available ? Number(pricing.price) : null,
                    bandCode: pricing.bandCode,
                    available: pricing.available,
                    minimumPriceApplied: pricing.minimumPriceApplied,
                    currency: 'GBP'
                };
            } catch (e) {
                return {
                    id: product.id,
                    productCode: product.productCode,
                    description: product.description,
                    partType: product.partType,
                    freeStock: product.stock?.freeStock ?? 0,
                    yourPrice: null,
                    bandCode: null,
                    available: false,
                    minimumPriceApplied: false,
                    currency: 'GBP',
                    reason: e instanceof Error ? e.message : 'Pricing error'
                };
            }
        }));

        return {
            results,
            count: results.length
        };
    }

    async getBackorders(dealerAccountId: string): Promise<any[]> {
        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            select: { accountNo: true }
        });

        if (!dealer) throw new Error('Dealer not found');

        const activeDataset = await this.prisma.backorderDataset.findFirst({
            where: { isActive: true },
            include: {
                lines: {
                    where: { accountNo: dealer.accountNo }
                }
            }
        });

        return activeDataset?.lines || [];
    }
}
