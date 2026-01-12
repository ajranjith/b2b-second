
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, PartType } from '@prisma/client';
import { PricingService } from './PricingService';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Integration Test Suite
// Assumes local DB is running and seeded
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

    it('should calculate correct price for Genuine part (Band A)', async () => {
        // Known Seed Data:
        // Dealer: Acme Motors (DLR001) -> Genuine = Band A
        // Product: BP-1001 (Genuine)
        // Price Band A: 45.00

        // Use findFirst to get dynamic IDs if needed, or rely on Seeded codes
        const dealer = await prisma.dealerAccount.findFirst({ where: { accountNo: 'DLR001' } });
        if (!dealer) throw new Error('Seeded dealer DLR001 not found');

        const result = await pricingService.calculatePrice(dealer.id, 'BP-1001', 2);

        expect(result).toBeDefined();
        expect(result.productCode).toBe('BP-1001');
        expect(result.bandCode).toBe('A');
        expect(result.unitPrice).toBe(45.00);
        expect(result.totalPrice).toBe(90.00);
    });

    it('should throw error for invalid product', async () => {
        const dealer = await prisma.dealerAccount.findFirst({ where: { accountNo: 'DLR001' } });
        if (!dealer) throw new Error('Seeded dealer DLR001 not found');

        await expect(pricingService.calculatePrice(dealer.id, 'INVALID-CODE'))
            .rejects.toThrow('Product not found');
    });

    // Add more cases: Min Price, different bands, etc.
});
