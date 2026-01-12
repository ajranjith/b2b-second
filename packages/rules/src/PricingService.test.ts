import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, PartType } from '@prisma/client';
import { PricingService } from './PricingService';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Integration Test Suite
// Assumes local DB is running and seeded/imported
describe('PricingService Integration', () => {
    let prisma: PrismaClient;
    let pricingService: PricingService;

    beforeAll(async () => {
        const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hotbray";
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
        pricingService = new PricingService(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should calculate correct price for a seeded dealer and imported part', async () => {
        // Dealer: Test Dealer Ltd (DEAL001)
        const dealer = await prisma.dealerAccount.findFirst({ where: { accountNo: 'DEAL001' } });
        if (!dealer) throw new Error('Seeded dealer DEAL001 not found');

        // Product: Find any active product
        const product = await prisma.product.findFirst({
            where: { isActive: true },
            include: { bandPrices: true }
        });
        if (!product || product.bandPrices.length === 0) {
            console.log('⚠️ No products with prices found, creating a test product...');
            // This is a backup in case imports weren't run
            const newProd = await prisma.product.create({
                data: {
                    productCode: 'TEST-PRICING-001',
                    description: 'Test Pricing Product',
                    partType: PartType.GENUINE,
                    isActive: true,
                    bandPrices: {
                        create: { bandCode: '1', price: 100.00 }
                    }
                },
                include: { bandPrices: true }
            });

            // Ensure band assignment for DEAL001 matches partType
            await prisma.dealerBandAssignment.upsert({
                where: { dealerAccountId_partType: { dealerAccountId: dealer.id, partType: PartType.GENUINE } },
                update: { bandCode: '1' },
                create: { dealerAccountId: dealer.id, partType: PartType.GENUINE, bandCode: '1' }
            });

            const result = await pricingService.calculatePrice(dealer.id, newProd.productCode, 2);
            expect(result.unitPrice).toBe(100.00);
            expect(result.totalPrice).toBe(200.00);
            return;
        }

        // Get the band assignment for this dealer and the product's part type
        const assignment = await prisma.dealerBandAssignment.findFirst({
            where: { dealerAccountId: dealer.id, partType: product.partType }
        });

        if (!assignment) {
            // Create assignment if missing
            await prisma.dealerBandAssignment.create({
                data: { dealerAccountId: dealer.id, partType: product.partType, bandCode: '1' }
            });
        }

        const bandCode = assignment?.bandCode || '1';
        const priceBand = product.bandPrices.find(bp => bp.bandCode === bandCode);

        if (!priceBand) {
            // Create price band if missing for test
            await prisma.productPriceBand.create({
                data: { productId: product.id, bandCode: bandCode, price: 50.00 }
            });
        }

        const result = await pricingService.calculatePrice(dealer.id, product.productCode, 1);

        expect(result).toBeDefined();
        expect(result.productCode).toBe(product.productCode);
        expect(result.available).toBe(true);
    });

    it('should throw error for invalid product', async () => {
        const dealer = await prisma.dealerAccount.findFirst({ where: { accountNo: 'DEAL001' } });
        if (!dealer) throw new Error('Seeded dealer DEAL001 not found');

        await expect(pricingService.calculatePrice(dealer.id, 'INVALID-CODE'))
            .rejects.toThrow('Product not found');
    });
});
