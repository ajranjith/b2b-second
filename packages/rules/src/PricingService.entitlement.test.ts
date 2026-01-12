import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, PartType, Entitlement } from '@prisma/client';
import { PricingService, EntitlementError } from './PricingService';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

describe('PricingService Entitlement Tests', () => {
    let prisma: PrismaClient;
    let pricingService: PricingService;
    let testDealerId: string;
    let genuineProductCode: string;
    let aftermarketProductCode: string;

    beforeAll(async () => {
        const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hotbray";
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
        pricingService = new PricingService(prisma);

        // Setup test data
        const dealer = await prisma.dealerAccount.upsert({
            where: { accountNo: 'ENT-TEST-DLR' },
            update: { entitlement: Entitlement.SHOW_ALL },
            create: {
                accountNo: 'ENT-TEST-DLR',
                companyName: 'Entitlement Test Dealer',
                entitlement: Entitlement.SHOW_ALL
            }
        });
        testDealerId = dealer.id;

        // Ensure we have at least one genuine and one aftermarket product
        // We'll search for existing ones or create if none found
        const genProd = await prisma.product.findFirst({ where: { partType: PartType.GENUINE, isActive: true } });
        genuineProductCode = genProd?.productCode || 'TEST-GEN-001';
        if (!genProd) {
            await prisma.product.create({
                data: {
                    productCode: genuineProductCode,
                    description: 'Test Genuine Product',
                    partType: PartType.GENUINE,
                    isActive: true
                }
            });
        }

        const aftProd = await prisma.product.findFirst({ where: { partType: PartType.AFTERMARKET, isActive: true } });
        aftermarketProductCode = aftProd?.productCode || 'TEST-AFT-001';
        if (!aftProd) {
            await prisma.product.create({
                data: {
                    productCode: aftermarketProductCode,
                    description: 'Test Aftermarket Product',
                    partType: PartType.AFTERMARKET,
                    isActive: true
                }
            });
        }

        // Ensure band assignments exist for the test dealer
        const currentGenAssignment = await prisma.dealerBandAssignment.findFirst({
            where: { dealerAccountId: testDealerId, partType: PartType.GENUINE }
        });
        if (currentGenAssignment) {
            await prisma.dealerBandAssignment.update({ where: { id: currentGenAssignment.id }, data: { bandCode: '1' } });
        } else {
            await prisma.dealerBandAssignment.create({ data: { dealerAccountId: testDealerId, partType: PartType.GENUINE, bandCode: '1' } });
        }

        const currentAftAssignment = await prisma.dealerBandAssignment.findFirst({
            where: { dealerAccountId: testDealerId, partType: PartType.AFTERMARKET }
        });
        if (currentAftAssignment) {
            await prisma.dealerBandAssignment.update({ where: { id: currentAftAssignment.id }, data: { bandCode: '1' } });
        } else {
            await prisma.dealerBandAssignment.create({ data: { dealerAccountId: testDealerId, partType: PartType.AFTERMARKET, bandCode: '1' } });
        }

        // Ensure prices exist
        const genP = await prisma.product.findUnique({ where: { productCode: genuineProductCode } });
        const aftP = await prisma.product.findUnique({ where: { productCode: aftermarketProductCode } });

        await prisma.productPriceBand.upsert({
            where: { productId_bandCode: { productId: genP!.id, bandCode: '1' } },
            update: { price: 10.00 },
            create: { productId: genP!.id, bandCode: '1', price: 10.00 }
        });
        await prisma.productPriceBand.upsert({
            where: { productId_bandCode: { productId: aftP!.id, bandCode: '1' } },
            update: { price: 15.00 },
            create: { productId: aftP!.id, bandCode: '1', price: 15.00 }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('canDealerViewProduct should work correctly', async () => {
        // GENUINE_ONLY
        await prisma.dealerAccount.update({ where: { id: testDealerId }, data: { entitlement: Entitlement.GENUINE_ONLY } });
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.GENUINE)).toBe(true);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.AFTERMARKET)).toBe(false);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.BRANDED)).toBe(false);

        // AFTERMARKET_ONLY
        await prisma.dealerAccount.update({ where: { id: testDealerId }, data: { entitlement: Entitlement.AFTERMARKET_ONLY } });
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.GENUINE)).toBe(false);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.AFTERMARKET)).toBe(true);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.BRANDED)).toBe(true);

        // SHOW_ALL
        await prisma.dealerAccount.update({ where: { id: testDealerId }, data: { entitlement: Entitlement.SHOW_ALL } });
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.GENUINE)).toBe(true);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.AFTERMARKET)).toBe(true);
        expect(await pricingService.canDealerViewProduct(testDealerId, PartType.BRANDED)).toBe(true);
    });

    it('calculatePrice should enforce entitlements', async () => {
        // Genuine Only dealer accessing Aftermarket
        await prisma.dealerAccount.update({ where: { id: testDealerId }, data: { entitlement: Entitlement.GENUINE_ONLY } });
        await expect(pricingService.calculatePrice(testDealerId, aftermarketProductCode))
            .rejects.toThrow('Product not available');

        // Genuine Only dealer accessing Genuine
        const genResult = await pricingService.calculatePrice(testDealerId, genuineProductCode);
        expect(genResult.available).toBe(true);

        // Aftermarket Only dealer accessing Genuine
        await prisma.dealerAccount.update({ where: { id: testDealerId }, data: { entitlement: Entitlement.AFTERMARKET_ONLY } });
        await expect(pricingService.calculatePrice(testDealerId, genuineProductCode))
            .rejects.toThrow('Product not available');

        // Aftermarket Only dealer accessing Aftermarket
        const aftResult = await pricingService.calculatePrice(testDealerId, aftermarketProductCode);
        expect(aftResult.available).toBe(true);
    });
});
