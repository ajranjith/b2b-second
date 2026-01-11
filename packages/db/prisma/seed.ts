import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, DealerStatus, PartType } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('Seeding database...');

    // Cleanup
    await prisma.auditLog.deleteMany();
    await prisma.orderLine.deleteMany();
    await prisma.orderHeader.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.dealerBandAssignment.deleteMany();
    await prisma.dealerUser.deleteMany();
    await prisma.dealerAccount.deleteMany();
    await prisma.appUser.deleteMany();
    await prisma.productPriceBand.deleteMany();
    await prisma.productStock.deleteMany();
    await prisma.product.deleteMany();

    // 1. App Users (Admin & Dealer User)
    const adminUser = await prisma.appUser.create({
        data: {
            email: 'admin@hotbray.com',
            passwordHash: 'hashed_password_123', // In real app, hash this
            role: UserRole.ADMIN,
            adminRole: 'SUPER_ADMIN'
        }
    });

    const dealerAppUser = await prisma.appUser.create({
        data: {
            email: 'dealer@acme.com',
            passwordHash: 'hashed_password_456',
            role: UserRole.DEALER
        }
    });

    // 2. Dealer Account
    const dealerAccount = await prisma.dealerAccount.create({
        data: {
            accountNo: 'DLR001',
            companyName: 'Acme Motors Ltd',
            status: DealerStatus.ACTIVE,
            mainEmail: 'info@acmemotors.com'
        }
    });

    // 3. Dealer User Link
    await prisma.dealerUser.create({
        data: {
            dealerAccountId: dealerAccount.id,
            userId: dealerAppUser.id,
            isPrimary: true
        }
    });

    // 4. Products
    const brakePad = await prisma.product.create({
        data: {
            productCode: 'BP-1001',
            description: 'Front Brake Pads',
            partType: PartType.GENUINE,
            supplier: 'Brembo',
            isActive: true
        }
    });

    const oilFilter = await prisma.product.create({
        data: {
            productCode: 'OF-500',
            description: 'Oil Filter',
            partType: PartType.AFTERMARKET,
            supplier: 'Mann',
            isActive: true
        }
    });

    // 5. Product Stock & Prices
    await prisma.productStock.create({
        data: {
            productId: brakePad.id,
            freeStock: 50
        }
    });

    await prisma.productPriceBand.create({
        data: {
            productId: brakePad.id,
            bandCode: 'A',
            price: 45.00
        }
    });

    // 6. Band Assignments (Genuine, Aftermarket, Branded)
    await prisma.dealerBandAssignment.create({
        data: {
            dealerAccountId: dealerAccount.id,
            partType: PartType.GENUINE,
            bandCode: 'A'
        }
    });

    await prisma.dealerBandAssignment.create({
        data: {
            dealerAccountId: dealerAccount.id,
            partType: PartType.AFTERMARKET,
            bandCode: 'B'
        }
    });

    await prisma.dealerBandAssignment.create({
        data: {
            dealerAccountId: dealerAccount.id,
            partType: PartType.BRANDED,
            bandCode: 'C'
        }
    });

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
