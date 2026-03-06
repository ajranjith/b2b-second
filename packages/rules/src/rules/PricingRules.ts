// packages/rules/src/rules/PricingRules.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { PricingContext, PricingResult } from '../types'
import { PricingRuleError, EntitlementError } from '../errors'

export class PricingRules {
    constructor(private prisma: PrismaClient) { }

    private getNetPriceForTier(
        catalog: {
            net1Price: Prisma.Decimal;
            net2Price: Prisma.Decimal;
            net3Price: Prisma.Decimal;
            net4Price: Prisma.Decimal;
            net5Price: Prisma.Decimal;
            net6Price: Prisma.Decimal;
            net7Price: Prisma.Decimal;
        },
        tierCode: string
    ): Prisma.Decimal | null {
        const normalized = tierCode.trim().toLowerCase();
        switch (normalized) {
            case 'net1':
                return catalog.net1Price;
            case 'net2':
                return catalog.net2Price;
            case 'net3':
                return catalog.net3Price;
            case 'net4':
                return catalog.net4Price;
            case 'net5':
                return catalog.net5Price;
            case 'net6':
                return catalog.net6Price;
            case 'net7':
                return catalog.net7Price;
            default:
                return null;
        }
    }

    /**
     * Calculate price for a dealer-product combination
     * BUSINESS RULES:
     * 1. Dealer must have ACTIVE or SUSPENDED status (INACTIVE cannot see prices)
     * 2. Product must match dealer's entitlement
     * 3. Determine product category from ProductCatalog.discountCode (gn/es/br)
     * 4. Special price (active window) overrides tier pricing
     * 5. Dealer must have tier assignment for category (Net1..Net7)
     * 6. Use ProductCatalog Net{tier} as price
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

        const product = await this.prisma.product.findUnique({
            where: { id: context.productId },
            select: { productCode: true }
        });

        if (!product) {
            throw new PricingRuleError(`Product ${context.productId} not found`);
        }

        const catalog = await this.prisma.productCatalog.findUnique({
            where: { productCode: product.productCode.toUpperCase() }
        });

        if (!catalog) {
            return {
                price: new Prisma.Decimal(0),
                bandCode: '',
                minimumPriceApplied: false,
                available: false,
                reason: 'Catalog record missing'
            };
        }

        const now = new Date();
        const special = await this.prisma.specialPrice.findFirst({
            where: {
                productCode: catalog.productCode,
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gte: now }
            },
            orderBy: { startsAt: 'desc' }
        });

        if (special) {
            return {
                price: special.discountPrice,
                bandCode: 'SPECIAL_PRICE',
                minimumPriceApplied: false,
                available: true
            };
        }

        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: context.dealerAccountId },
            select: { accountNo: true }
        });

        if (!dealer) {
            throw new PricingRuleError('Dealer account not found');
        }

        const categoryCode = catalog.discountCode.toLowerCase();
        const assignment = await this.prisma.dealerPriceTierAssignment.findFirst({
            where: {
                accountNo: dealer.accountNo,
                categoryCode
            }
        });

        if (!assignment) {
            return {
                price: new Prisma.Decimal(0),
                bandCode: '',
                minimumPriceApplied: false,
                available: false,
                reason: 'Tier assignment missing'
            };
        }

        const netPrice = this.getNetPriceForTier(catalog, assignment.netTier);

        if (!netPrice) {
            return {
                price: new Prisma.Decimal(0),
                bandCode: assignment.netTier,
                minimumPriceApplied: false,
                available: false,
                reason: 'Tier price missing'
            };
        }

        return {
            price: netPrice,
            bandCode: assignment.netTier,
            minimumPriceApplied: false,
            available: true
        };
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
        const dealer = await this.prisma.dealerAccount.findUniqueOrThrow({
            where: { id: dealerAccountId },
            select: { id: true, status: true, entitlement: true, accountNo: true }
        });

        if (dealer.status === 'INACTIVE') {
            throw new EntitlementError('Inactive dealers cannot view prices');
        }

        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, productCode: true, partType: true }
        });

        const productCodes = products.map((product) => product.productCode.toUpperCase());
        const catalogs = await this.prisma.productCatalog.findMany({
            where: { productCode: { in: productCodes } }
        });
        const catalogMap = new Map(catalogs.map((catalog) => [catalog.productCode.toUpperCase(), catalog]));

        const now = new Date();
        const specials = await this.prisma.specialPrice.findMany({
            where: {
                productCode: { in: productCodes },
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gte: now }
            },
            orderBy: { startsAt: 'desc' }
        });
        const specialMap = new Map<string, typeof specials[number]>();
        for (const special of specials) {
            const key = special.productCode.toUpperCase();
            if (!specialMap.has(key)) {
                specialMap.set(key, special);
            }
        }

        const assignments = await this.prisma.dealerPriceTierAssignment.findMany({
            where: {
                accountNo: dealer.accountNo,
                categoryCode: { in: ['gn', 'es', 'br'] }
            }
        });
        const assignmentMap = new Map(assignments.map((assignment) => [
            assignment.categoryCode.toLowerCase(),
            assignment.netTier
        ]));

        const results = new Map<string, PricingResult>();

        for (const product of products) {
            try {
                const entitlementCheck = this.checkEntitlement(
                    dealer.entitlement as any,
                    product.partType
                );
                if (!entitlementCheck.allowed) {
                    results.set(product.id, {
                        price: new Prisma.Decimal(0),
                        bandCode: '',
                        minimumPriceApplied: false,
                        available: false,
                        reason: entitlementCheck.reason
                    });
                    continue;
                }

                const catalog = catalogMap.get(product.productCode.toUpperCase());
                if (!catalog) {
                    results.set(product.id, {
                        price: new Prisma.Decimal(0),
                        bandCode: '',
                        minimumPriceApplied: false,
                        available: false,
                        reason: 'Catalog record missing'
                    });
                    continue;
                }

                const special = specialMap.get(product.productCode.toUpperCase());
                if (special) {
                    results.set(product.id, {
                        price: special.discountPrice,
                        bandCode: 'SPECIAL_PRICE',
                        minimumPriceApplied: false,
                        available: true
                    });
                    continue;
                }

                const categoryCode = catalog.discountCode.toLowerCase();
                const netTier = assignmentMap.get(categoryCode);
                if (!netTier) {
                    results.set(product.id, {
                        price: new Prisma.Decimal(0),
                        bandCode: '',
                        minimumPriceApplied: false,
                        available: false,
                        reason: 'Tier assignment missing'
                    });
                    continue;
                }

                const netPrice = this.getNetPriceForTier(catalog, netTier);
                if (!netPrice) {
                    results.set(product.id, {
                        price: new Prisma.Decimal(0),
                        bandCode: netTier,
                        minimumPriceApplied: false,
                        available: false,
                        reason: 'Tier price missing'
                    });
                    continue;
                }

                results.set(product.id, {
                    price: netPrice,
                    bandCode: netTier,
                    minimumPriceApplied: false,
                    available: true
                });
            } catch (error) {
                results.set(product.id, {
                    price: new Prisma.Decimal(0),
                    bandCode: '',
                    minimumPriceApplied: false,
                    available: false,
                    reason: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    }
}
