import { prisma } from '../src/index';
import { UserRole, AdminRole, DealerStatus, PartType, Entitlement, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function main() {
    console.log('🚀 Starting robust idempotent seed (using shared prisma instance)...\n');
    const passwordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

    try {
        console.log('👤 Upserting 5 admins...');
        for (let i = 1; i <= 5; i++) {
            await (prisma as any).appUser.upsert({
                where: { email: `admin-${i}@hotbray.com` },
                update: { role: UserRole.ADMIN, isActive: true },
                create: {
                    email: `admin-${i}@hotbray.com`,
                    passwordHash,
                    role: UserRole.ADMIN,
                    adminRole: i === 1 ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN,
                    isActive: true
                }
            });
        }

        console.log('🏢 Upserting 55 dealers...');
        const dealers: any[] = [];
        for (let i = 1; i <= 55; i++) {
            const accountNo = `D-${i.toString().padStart(3, '0')}`;
            const erpAccountNo = `E-${i.toString().padStart(3, '0')}`;
            const email = `u-${i}@dealer.com`;

            const appUser = await (prisma as any).appUser.upsert({
                where: { email },
                update: { role: UserRole.DEALER },
                create: {
                    email,
                    passwordHash,
                    role: UserRole.DEALER,
                    isActive: true
                }
            });

            const dealer = await (prisma as any).dealerAccount.upsert({
                where: { accountNo },
                update: { companyName: `Dealer ${i}`, erpAccountNo },
                create: {
                    accountNo,
                    companyName: `Dealer ${i}`,
                    erpAccountNo,
                    status: DealerStatus.ACTIVE,
                    entitlement: Entitlement.SHOW_ALL,
                    mainEmail: email
                }
            });

            // Handle DealerUser
            await (prisma as any).dealerUser.upsert({
                where: { userId: appUser.id },
                update: { dealerAccountId: dealer.id },
                create: {
                    dealerAccountId: dealer.id,
                    userId: appUser.id,
                    firstName: 'Dealer',
                    lastName: `${i}`,
                    isPrimary: true
                }
            });

            // Handle Band Assignments
            for (const type of [PartType.GENUINE, PartType.AFTERMARKET, PartType.BRANDED]) {
                await (prisma as any).dealerBandAssignment.upsert({
                    where: {
                        dealerAccountId_partType: {
                            dealerAccountId: dealer.id,
                            partType: type
                        }
                    },
                    update: { bandCode: '1' },
                    create: {
                        dealerAccountId: dealer.id,
                        partType: type,
                        bandCode: '1'
                    }
                });
            }
            dealers.push(dealer);
            if (i % 10 === 0) console.log(`  → Processed ${i} dealers...`);
        }

        console.log('📦 Upserting 110 products...');
        const products: any[] = [];
        for (let i = 0; i < 110; i++) {
            const productCode = `P-${i.toString().padStart(4, '0')}`;
            const product = await (prisma as any).product.upsert({
                where: { productCode },
                update: { isActive: true },
                create: {
                    productCode,
                    description: `Product ${i}`,
                    partType: PartType.GENUINE,
                    stock: { create: { freeStock: 100 } },
                    refPrice: { create: { tradePrice: 100, minimumPrice: 80 } },
                    bandPrices: {
                        create: [
                            { bandCode: '1', price: 95 },
                            { bandCode: '2', price: 90 },
                            { bandCode: '3', price: 85 },
                            { bandCode: '4', price: 80 }
                        ]
                    }
                }
            });
            products.push(product);
            if (i % 30 === 0 && i > 0) console.log(`  → Processed ${i} products...`);
        }

        console.log('📋 Creating 20 orders...');
        for (let i = 0; i < 20; i++) {
            const dealer = dealers[i % dealers.length];
            const dealerUser = await (prisma as any).dealerUser.findFirst({ where: { dealerAccountId: dealer.id } });
            await (prisma as any).orderHeader.create({
                data: {
                    orderNo: `O-SEED-${Date.now()}-${i}`,
                    dealerAccountId: dealer.id,
                    dealerUserId: dealerUser!.id,
                    status: OrderStatus.PROCESSING,
                    total: 100,
                    lines: {
                        create: {
                            productId: products[i % products.length].id,
                            productCodeSnapshot: products[i % products.length].productCode,
                            descriptionSnapshot: products[i % products.length].description,
                            partTypeSnapshot: products[i % products.length].partType,
                            qty: 1,
                            unitPriceSnapshot: 100,
                            bandCodeSnapshot: '1'
                        }
                    }
                }
            });
        }

        console.log('🔄 Creating 25 supersessions...');
        for (let i = 0; i < 25; i++) {
            await (prisma as any).supersession.upsert({
                where: { id: `S-SEED-${i}` }, // Use stable pseudo-UUID for idempotency if column exists, or just create
                update: {},
                create: {
                    id: `S-SEED-${i}`,
                    originalPartCode: products[i].productCode,
                    replacementPartCode: products[i + 25].productCode,
                    note: 'Superseded'
                }
            });
        }

        console.log('\n✨ Seed finished successfully!');
    } catch (e: any) {
        console.error('\n💥 Seed failed:', e.message);
        throw e;
    }
}

main().finally(async () => {
    await prisma.$disconnect();
});
