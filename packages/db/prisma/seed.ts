import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, DealerStatus, PartType, OrderStatus } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('🌱 Seeding database with comprehensive sample data...');

    // Cleanup
    console.log('🧹 Cleaning up existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.orderLine.deleteMany();
    await prisma.orderHeader.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.backorderLine.deleteMany();
    await prisma.backorderDataset.deleteMany();
    await prisma.dealerBandAssignment.deleteMany();
    await prisma.dealerUser.deleteMany();
    await prisma.dealerAccount.deleteMany();
    await prisma.appUser.deleteMany();
    await prisma.productPriceBand.deleteMany();
    await prisma.productPriceReference.deleteMany();
    await prisma.productStock.deleteMany();
    await prisma.productAlias.deleteMany();
    await prisma.product.deleteMany();

    // 1. Admin Users
    console.log('👤 Creating admin users...');
    const admins = await Promise.all([
        prisma.appUser.create({
            data: {
                email: 'admin@hotbray.co.uk',
                passwordHash: 'hashed_password_admin',
                role: UserRole.ADMIN,
                adminRole: 'SUPER_ADMIN',
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'ops@hotbray.co.uk',
                passwordHash: 'hashed_password_ops',
                role: UserRole.ADMIN,
                adminRole: 'OPS',
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'manager@hotbray.co.uk',
                passwordHash: 'hashed_password_manager',
                role: UserRole.ADMIN,
                adminRole: 'ADMIN',
                isActive: true
            }
        })
    ]);

    // 2. Dealer Accounts
    console.log('🏢 Creating dealer accounts...');
    const dealers = await Promise.all([
        prisma.dealerAccount.create({
            data: {
                accountNo: 'DLR001',
                companyName: 'Acme Motors Ltd',
                status: DealerStatus.ACTIVE,
                mainEmail: 'info@acmemotors.com',
                phone: '+44 20 7946 0958',
                billingLine1: '123 High Street',
                billingCity: 'London',
                billingPostcode: 'SW1A 1AA',
                billingCountry: 'UK'
            }
        }),
        prisma.dealerAccount.create({
            data: {
                accountNo: 'DLR002',
                companyName: 'Premium Parts Ltd',
                status: DealerStatus.ACTIVE,
                mainEmail: 'sales@premiumparts.co.uk',
                phone: '+44 161 123 4567',
                billingLine1: '456 Market Street',
                billingCity: 'Manchester',
                billingPostcode: 'M1 1AE',
                billingCountry: 'UK'
            }
        }),
        prisma.dealerAccount.create({
            data: {
                accountNo: 'DLR003',
                companyName: 'Elite Auto Supplies',
                status: DealerStatus.ACTIVE,
                mainEmail: 'orders@eliteauto.com',
                phone: '+44 121 234 5678',
                billingLine1: '789 Birmingham Road',
                billingCity: 'Birmingham',
                billingPostcode: 'B1 1BB',
                billingCountry: 'UK'
            }
        }),
        prisma.dealerAccount.create({
            data: {
                accountNo: 'DLR004',
                companyName: 'Classic Car Components',
                status: DealerStatus.ACTIVE,
                mainEmail: 'info@classiccar.co.uk',
                phone: '+44 131 456 7890',
                billingLine1: '321 Royal Mile',
                billingCity: 'Edinburgh',
                billingPostcode: 'EH1 1RE',
                billingCountry: 'UK'
            }
        }),
        prisma.dealerAccount.create({
            data: {
                accountNo: 'DLR005',
                companyName: 'Rover Specialists UK',
                status: DealerStatus.INACTIVE,
                mainEmail: 'contact@roverspec.com',
                phone: '+44 117 987 6543',
                billingLine1: '654 Bristol Street',
                billingCity: 'Bristol',
                billingPostcode: 'BS1 3NX',
                billingCountry: 'UK'
            }
        })
    ]);

    // 3. Dealer Users
    console.log('👥 Creating dealer users...');
    const dealerUsers = await Promise.all([
        prisma.appUser.create({
            data: {
                email: 'john@acmemotors.com',
                passwordHash: 'hashed_password_dealer1',
                role: UserRole.DEALER,
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'sarah@premiumparts.co.uk',
                passwordHash: 'hashed_password_dealer2',
                role: UserRole.DEALER,
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'mike@eliteauto.com',
                passwordHash: 'hashed_password_dealer3',
                role: UserRole.DEALER,
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'emma@classiccar.co.uk',
                passwordHash: 'hashed_password_dealer4',
                role: UserRole.DEALER,
                isActive: true
            }
        }),
        prisma.appUser.create({
            data: {
                email: 'david@roverspec.com',
                passwordHash: 'hashed_password_dealer5',
                role: UserRole.DEALER,
                isActive: false
            }
        })
    ]);

    // Link dealers to accounts
    await Promise.all(dealerUsers.map((user, index) =>
        prisma.dealerUser.create({
            data: {
                dealerAccountId: dealers[index].id,
                userId: user.id,
                isPrimary: true
            }
        })
    ));

    // 4. Products
    console.log('🔧 Creating products...');
    const products = await Promise.all([
        // Genuine Parts
        prisma.product.create({
            data: {
                productCode: 'LR001234',
                description: 'Front Brake Pads - Discovery 3/4',
                partType: PartType.GENUINE,
                supplier: 'Land Rover',
                landRoverNo: 'LR001234',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                productCode: 'LR005678',
                description: 'Oil Filter - Range Rover Sport',
                partType: PartType.GENUINE,
                supplier: 'Land Rover',
                landRoverNo: 'LR005678',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                productCode: 'JAG9876',
                description: 'Air Filter - Jaguar XF',
                partType: PartType.GENUINE,
                supplier: 'Jaguar',
                jaguarNo: 'JAG9876',
                isActive: true
            }
        }),
        // Aftermarket Parts
        prisma.product.create({
            data: {
                productCode: 'AM-BP-001',
                description: 'Brake Disc Set - Front',
                partType: PartType.AFTERMARKET,
                supplier: 'Brembo',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                productCode: 'AM-OF-002',
                description: 'Premium Oil Filter',
                partType: PartType.AFTERMARKET,
                supplier: 'Mann Filter',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                productCode: 'AM-SP-003',
                description: 'Spark Plug Set (4pc)',
                partType: PartType.AFTERMARKET,
                supplier: 'NGK',
                isActive: true
            }
        }),
        // Branded Parts
        prisma.product.create({
            data: {
                productCode: 'BR-WB-001',
                description: 'Wiper Blade Set',
                partType: PartType.BRANDED,
                supplier: 'Bosch',
                isActive: true
            }
        }),
        prisma.product.create({
            data: {
                productCode: 'BR-BAT-002',
                description: 'Car Battery 12V 70Ah',
                partType: PartType.BRANDED,
                supplier: 'Varta',
                isActive: true
            }
        })
    ]);

    // 5. Product Stock
    console.log('📦 Adding stock levels...');
    await Promise.all(products.map((product, index) =>
        prisma.productStock.create({
            data: {
                productId: product.id,
                freeStock: [50, 120, 35, 80, 200, 150, 90, 25][index] || 50
            }
        })
    ));

    // 6. Product Price References
    console.log('💰 Setting price references...');
    await Promise.all(products.map((product, index) =>
        prisma.productPriceReference.create({
            data: {
                productId: product.id,
                costPrice: [25.00, 8.50, 12.00, 35.00, 6.00, 18.00, 15.00, 85.00][index],
                retailPrice: [65.00, 22.00, 28.00, 95.00, 15.00, 45.00, 35.00, 180.00][index],
                tradePrice: [45.00, 15.00, 20.00, 65.00, 10.00, 30.00, 25.00, 120.00][index],
                listPrice: [55.00, 18.00, 24.00, 75.00, 12.00, 35.00, 28.00, 150.00][index],
                minimumPrice: [40.00, 12.00, 18.00, 55.00, 9.00, 25.00, 22.00, 110.00][index]
            }
        })
    ));

    // 7. Product Price Bands (A, B, C for each product)
    console.log('🎯 Creating price bands...');
    for (const product of products) {
        const basePrice = await prisma.productPriceReference.findUnique({
            where: { productId: product.id }
        });

        if (basePrice) {
            await Promise.all([
                prisma.productPriceBand.create({
                    data: {
                        productId: product.id,
                        bandCode: 'A',
                        price: Number(basePrice.tradePrice) * 0.85 // 15% discount
                    }
                }),
                prisma.productPriceBand.create({
                    data: {
                        productId: product.id,
                        bandCode: 'B',
                        price: Number(basePrice.tradePrice) * 0.90 // 10% discount
                    }
                }),
                prisma.productPriceBand.create({
                    data: {
                        productId: product.id,
                        bandCode: 'C',
                        price: Number(basePrice.tradePrice) // No discount
                    }
                })
            ]);
        }
    }

    // 8. Dealer Band Assignments
    console.log('🏷️ Assigning dealer bands...');
    for (const dealer of dealers.slice(0, 4)) { // Active dealers only
        await Promise.all([
            prisma.dealerBandAssignment.create({
                data: {
                    dealerAccountId: dealer.id,
                    partType: PartType.GENUINE,
                    bandCode: dealer.accountNo === 'DLR001' ? 'A' : dealer.accountNo === 'DLR002' ? 'B' : 'C'
                }
            }),
            prisma.dealerBandAssignment.create({
                data: {
                    dealerAccountId: dealer.id,
                    partType: PartType.AFTERMARKET,
                    bandCode: dealer.accountNo === 'DLR001' ? 'B' : 'C'
                }
            }),
            prisma.dealerBandAssignment.create({
                data: {
                    dealerAccountId: dealer.id,
                    partType: PartType.BRANDED,
                    bandCode: 'C'
                }
            })
        ]);
    }

    // 9. Sample Orders
    console.log('📋 Creating sample orders...');
    const order1 = await prisma.orderHeader.create({
        data: {
            orderNo: 'ORD-2024-001',
            dealerAccountId: dealers[0].id,
            dealerUserId: (await prisma.dealerUser.findFirst({ where: { dealerAccountId: dealers[0].id } }))!.id,
            status: OrderStatus.PROCESSING,
            subtotal: 127.50,
            total: 127.50,
            currency: 'GBP',
            poRef: 'PO-12345'
        }
    });

    await Promise.all([
        prisma.orderLine.create({
            data: {
                orderId: order1.id,
                productId: products[0].id,
                productCodeSnapshot: products[0].productCode,
                descriptionSnapshot: products[0].description,
                partTypeSnapshot: products[0].partType,
                qty: 2,
                unitPriceSnapshot: 38.25,
                bandCodeSnapshot: 'A',
                minPriceApplied: false
            }
        }),
        prisma.orderLine.create({
            data: {
                orderId: order1.id,
                productId: products[1].id,
                productCodeSnapshot: products[1].productCode,
                descriptionSnapshot: products[1].description,
                partTypeSnapshot: products[1].partType,
                qty: 4,
                unitPriceSnapshot: 12.75,
                bandCodeSnapshot: 'A',
                minPriceApplied: false
            }
        })
    ]);

    // More orders
    const order2 = await prisma.orderHeader.create({
        data: {
            orderNo: 'ORD-2024-002',
            dealerAccountId: dealers[1].id,
            dealerUserId: (await prisma.dealerUser.findFirst({ where: { dealerAccountId: dealers[1].id } }))!.id,
            status: OrderStatus.SHIPPED,
            subtotal: 245.00,
            total: 245.00,
            currency: 'GBP'
        }
    });

    await prisma.orderLine.create({
        data: {
            orderId: order2.id,
            productId: products[3].id,
            productCodeSnapshot: products[3].productCode,
            descriptionSnapshot: products[3].description,
            partTypeSnapshot: products[3].partType,
            qty: 3,
            unitPriceSnapshot: 58.50,
            bandCodeSnapshot: 'B',
            minPriceApplied: false,
            shippedQty: 3,
            trackingNo: 'TRK123456789'
        }
    });

    // 10. Backorder Dataset
    console.log('📊 Creating backorder data...');
    const backorderDataset = await prisma.backorderDataset.create({
        data: {
            batchId: (await prisma.importBatch.create({
                data: {
                    importType: 'BACKORDERS',
                    fileName: 'backorders_seed.csv',
                    fileHash: 'seed_hash_123',
                    status: 'SUCCEEDED',
                    totalRows: 5,
                    validRows: 5,
                    invalidRows: 0,
                    completedAt: new Date()
                }
            })).id,
            status: 'SUCCEEDED',
            isActive: true
        }
    });

    await Promise.all([
        prisma.backorderLine.create({
            data: {
                datasetId: backorderDataset.id,
                accountNo: 'DLR001',
                customerName: 'Acme Motors Ltd',
                yourOrderNo: 'PO-12345',
                ourNo: 'ORD-2024-001',
                itemNo: '1',
                part: 'LR001234',
                description: 'Front Brake Pads',
                qtyOrdered: 5,
                qtyOutstanding: 3,
                inWh: 2
            }
        }),
        prisma.backorderLine.create({
            data: {
                datasetId: backorderDataset.id,
                accountNo: 'DLR002',
                customerName: 'Premium Parts Ltd',
                yourOrderNo: 'PP-789',
                ourNo: 'ORD-2024-003',
                itemNo: '2',
                part: 'JAG9876',
                description: 'Air Filter',
                qtyOrdered: 10,
                qtyOutstanding: 10,
                inWh: 0
            }
        }),
        prisma.backorderLine.create({
            data: {
                datasetId: backorderDataset.id,
                accountNo: 'DLR003',
                customerName: 'Elite Auto Supplies',
                yourOrderNo: 'EA-456',
                ourNo: 'ORD-2024-004',
                itemNo: '1',
                part: 'BR-BAT-002',
                description: 'Car Battery',
                qtyOrdered: 8,
                qtyOutstanding: 5,
                inWh: 3
            }
        })
    ]);

    console.log('✅ Seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${admins.length} admin users`);
    console.log(`   - ${dealers.length} dealer accounts`);
    console.log(`   - ${dealerUsers.length} dealer users`);
    console.log(`   - ${products.length} products`);
    console.log(`   - 2 sample orders with line items`);
    console.log(`   - 3 backorder lines`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
