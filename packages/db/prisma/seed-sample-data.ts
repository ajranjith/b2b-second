import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, AdminRole, DealerStatus, PartType, Entitlement, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const SALT_ROUNDS = 10;

async function main() {
    console.log('🌱 Starting comprehensive sample data seed...\n');

    try {
        // 1. Create Admin Users (20)
        console.log('👤 Creating admin users...');
        const adminUsers = [];
        for (let i = 1; i <= 20; i++) {
            const passwordHash = await bcrypt.hash(`Admin${i}23!`, SALT_ROUNDS);
            const admin = await prisma.appUser.upsert({
                where: { email: `admin${i}@hotbray.com` },
                update: { passwordHash, role: UserRole.ADMIN, adminRole: i === 1 ? AdminRole.SUPER_ADMIN : AdminRole.MANAGER, isActive: true },
                create: { email: `admin${i}@hotbray.com`, passwordHash, role: UserRole.ADMIN, adminRole: i === 1 ? AdminRole.SUPER_ADMIN : AdminRole.MANAGER, isActive: true }
            });
            adminUsers.push(admin);
        }
        console.log(`✅ Created ${adminUsers.length} admin users`);

        // 2. Create Dealer Accounts (20)
        console.log('\n🏢 Creating dealer accounts...');
        const dealerAccounts = [];
        const entitlements = [Entitlement.SHOW_ALL, Entitlement.GENUINE_ONLY, Entitlement.AFTERMARKET_ONLY];
        const statuses = [DealerStatus.ACTIVE, DealerStatus.SUSPENDED, DealerStatus.INACTIVE];

        for (let i = 1; i <= 20; i++) {
            const dealer = await prisma.dealerAccount.upsert({
                where: { accountNo: `DEAL${String(i).padStart(3, '0')}` },
                update: {
                    companyName: `Dealer Company ${i} Ltd`,
                    status: statuses[i % 3],
                    entitlement: entitlements[i % 3],
                    erpAccountNo: `ERP${String(i).padStart(3, '0')}`,
                    contactFirstName: `Contact${i}`,
                    contactLastName: `Person${i}`,
                    mainEmail: `dealer${i}@test.com`
                },
                create: {
                    accountNo: `DEAL${String(i).padStart(3, '0')}`,
                    companyName: `Dealer Company ${i} Ltd`,
                    status: statuses[i % 3],
                    entitlement: entitlements[i % 3],
                    erpAccountNo: `ERP${String(i).padStart(3, '0')}`,
                    contactFirstName: `Contact${i}`,
                    contactLastName: `Person${i}`,
                    mainEmail: `dealer${i}@test.com`
                }
            });
            dealerAccounts.push(dealer);
        }
        console.log(`✅ Created ${dealerAccounts.length} dealer accounts`);

        // 3. Create Dealer Users (40 - 2 per account)
        console.log('\n👥 Creating dealer users...');
        const dealerUsers = [];
        for (let i = 0; i < dealerAccounts.length; i++) {
            for (let j = 1; j <= 2; j++) {
                const email = `dealer${i + 1}user${j}@test.com`;
                const passwordHash = await bcrypt.hash(`Dealer${i + 1}${j}!`, SALT_ROUNDS);

                const appUser = await prisma.appUser.upsert({
                    where: { email },
                    update: { passwordHash, role: UserRole.DEALER, isActive: true },
                    create: { email, passwordHash, role: UserRole.DEALER, isActive: true }
                });

                const existingDealerUser = await prisma.dealerUser.findUnique({
                    where: { userId: appUser.id }
                });

                if (!existingDealerUser) {
                    const dealerUser = await prisma.dealerUser.create({
                        data: {
                            dealerAccountId: dealerAccounts[i].id,
                            userId: appUser.id,
                            isPrimary: j === 1,
                            firstName: `User${j}`,
                            lastName: `Dealer${i + 1}`
                        }
                    });
                    dealerUsers.push(dealerUser);
                }
            }
        }
        console.log(`✅ Created ${dealerUsers.length} dealer users`);

        // 4. Create Band Assignments (60 - 3 per dealer)
        console.log('\n🏷️  Creating band assignments...');
        let bandAssignmentCount = 0;
        for (const dealer of dealerAccounts) {
            const assignments = [
                { partType: PartType.GENUINE, bandCode: String((dealer.accountNo.charCodeAt(4) % 4) + 1) },
                { partType: PartType.AFTERMARKET, bandCode: String((dealer.accountNo.charCodeAt(5) % 4) + 1) },
                { partType: PartType.BRANDED, bandCode: String((dealer.accountNo.charCodeAt(6) % 4) + 1) }
            ];

            for (const assignment of assignments) {
                const existing = await prisma.dealerBandAssignment.findFirst({
                    where: { dealerAccountId: dealer.id, partType: assignment.partType }
                });

                if (!existing) {
                    await prisma.dealerBandAssignment.create({
                        data: {
                            dealerAccountId: dealer.id,
                            partType: assignment.partType,
                            bandCode: assignment.bandCode
                        }
                    });
                    bandAssignmentCount++;
                }
            }
        }
        console.log(`✅ Created ${bandAssignmentCount} band assignments`);

        // 5. Create Products (100 - mix of all types)
        console.log('\n📦 Creating products...');
        const products = [];
        const partTypes = [PartType.GENUINE, PartType.AFTERMARKET, PartType.BRANDED];
        const suppliers = ['LR', 'JAG', 'BOSCH', 'MANN', 'HELLA', 'DELPHI', 'LUCAS', 'VALEO'];

        for (let i = 1; i <= 100; i++) {
            const partType = partTypes[i % 3];
            const supplier = suppliers[i % suppliers.length];
            const basePrice = Math.random() * 1000 + 10;

            const product = await prisma.product.create({
                data: {
                    productCode: `${supplier}${String(i).padStart(6, '0')}`,
                    supplier: `${supplier}${String(i).padStart(4, '0')}`,
                    description: `${partType} Part - ${['Filter', 'Gasket', 'Sensor', 'Bearing', 'Belt', 'Hose', 'Pump', 'Valve'][i % 8]} ${i}`,
                    partType,
                    isActive: i % 10 !== 0, // 90% active
                    stock: {
                        create: {
                            freeStock: Math.floor(Math.random() * 500)
                        }
                    },
                    refPrice: {
                        create: {
                            tradePrice: basePrice,
                            minimumPrice: basePrice * 0.85
                        }
                    },
                    bandPrices: {
                        create: [
                            { bandCode: '1', price: basePrice * 0.95 },
                            { bandCode: '2', price: basePrice * 0.90 },
                            { bandCode: '3', price: basePrice * 0.85 },
                            { bandCode: '4', price: basePrice * 0.80 }
                        ]
                    }
                }
            });
            products.push(product);
        }
        console.log(`✅ Created ${products.length} products`);

        // 6. Create Carts (20 - one per dealer)
        console.log('\n🛒 Creating carts...');
        const carts = [];
        for (let i = 0; i < Math.min(20, dealerUsers.length); i++) {
            const dealerUser = dealerUsers[i];
            const cart = await prisma.cart.create({
                data: {
                    dealerUserId: dealerUser.userId,
                    dealerAccountId: dealerUser.dealerAccountId
                }
            });
            carts.push(cart);
        }
        console.log(`✅ Created ${carts.length} carts`);

        // 7. Create Cart Items (60 - 3 per cart)
        console.log('\n🛍️  Creating cart items...');
        let cartItemCount = 0;
        for (const cart of carts) {
            for (let j = 0; j < 3; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: product.id,
                        qty: Math.floor(Math.random() * 10) + 1
                    }
                });
                cartItemCount++;
            }
        }
        console.log(`✅ Created ${cartItemCount} cart items`);

        // 8. Create Orders (30)
        console.log('\n📋 Creating orders...');
        const orders = [];
        const orderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

        for (let i = 0; i < 30; i++) {
            const dealerUser = dealerUsers[i % dealerUsers.length];
            const order = await prisma.orderHeader.create({
                data: {
                    orderNo: `ORD${String(i + 1).padStart(6, '0')}`,
                    dealerAccountId: dealerUser.dealerAccountId,
                    dealerUserId: dealerUser.userId,
                    status: orderStatuses[i % orderStatuses.length],
                    totalAmount: 0, // Will update after adding lines
                    notes: i % 5 === 0 ? `Urgent order ${i + 1}` : null
                }
            });
            orders.push(order);
        }
        console.log(`✅ Created ${orders.length} orders`);

        // 9. Create Order Lines (90 - 3 per order)
        console.log('\n📝 Creating order lines...');
        let orderLineCount = 0;
        for (const order of orders) {
            let orderTotal = 0;
            for (let j = 0; j < 3; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 10) + 1;
                const unitPrice = 100 + Math.random() * 900;
                const lineTotal = qty * unitPrice;
                orderTotal += lineTotal;

                await prisma.orderLine.create({
                    data: {
                        orderHeaderId: order.id,
                        productId: product.id,
                        productCodeSnapshot: product.productCode,
                        descriptionSnapshot: product.description,
                        partTypeSnapshot: product.partType,
                        bandCodeSnapshot: String((j % 4) + 1),
                        qty,
                        unitPriceSnapshot: unitPrice,
                        lineTotal,
                        minPriceApplied: Math.random() > 0.8
                    }
                });
                orderLineCount++;
            }

            // Update order total
            await prisma.orderHeader.update({
                where: { id: order.id },
                data: { totalAmount: orderTotal }
            });
        }
        console.log(`✅ Created ${orderLineCount} order lines`);

        // 10. Create System Settings (20)
        console.log('\n⚙️  Creating system settings...');
        const settings = [
            { key: 'MINIMUM_ORDER_VALUE', value: '100', description: 'Minimum order value in GBP' },
            { key: 'DEFAULT_CURRENCY', value: 'GBP', description: 'Default currency code' },
            { key: 'TAX_RATE', value: '0.20', description: 'VAT rate (20%)' },
            { key: 'FREE_SHIPPING_THRESHOLD', value: '500', description: 'Free shipping above this amount' },
            { key: 'MAX_CART_ITEMS', value: '100', description: 'Maximum items in cart' },
            { key: 'SESSION_TIMEOUT_MINUTES', value: '30', description: 'Session timeout in minutes' },
            { key: 'PRICE_DECIMAL_PLACES', value: '2', description: 'Decimal places for prices' },
            { key: 'STOCK_WARNING_THRESHOLD', value: '10', description: 'Low stock warning threshold' },
            { key: 'ORDER_PREFIX', value: 'ORD', description: 'Order number prefix' },
            { key: 'ENABLE_BACKORDERS', value: 'true', description: 'Allow backorders' },
            { key: 'MAX_BACKORDER_QTY', value: '50', description: 'Maximum backorder quantity' },
            { key: 'PRICE_UPDATE_FREQUENCY', value: 'DAILY', description: 'Price update frequency' },
            { key: 'STOCK_UPDATE_FREQUENCY', value: 'HOURLY', description: 'Stock update frequency' },
            { key: 'EMAIL_NOTIFICATIONS', value: 'true', description: 'Enable email notifications' },
            { key: 'SMS_NOTIFICATIONS', value: 'false', description: 'Enable SMS notifications' },
            { key: 'SUPPORT_EMAIL', value: 'support@hotbray.com', description: 'Support email address' },
            { key: 'SUPPORT_PHONE', value: '+44 1234 567890', description: 'Support phone number' },
            { key: 'BUSINESS_HOURS', value: '09:00-17:00', description: 'Business hours' },
            { key: 'WAREHOUSE_LOCATION', value: 'UK', description: 'Primary warehouse location' },
            { key: 'API_VERSION', value: 'v1', description: 'Current API version' }
        ];

        for (const setting of settings) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value, description: setting.description },
                create: setting
            });
        }
        console.log(`✅ Created ${settings.length} system settings`);

        // 11. Create Upload Templates (5)
        console.log('\n📄 Creating upload templates...');
        const templates = [
            {
                templateName: 'GENUINE_PARTS',
                fileName: 'Genuine_parts_template.xlsx',
                blobPath: 'samples/Genuine_parts_template.xlsx',
                description: 'Template for uploading genuine parts pricing and stock data',
                importType: 'PRODUCTS',
                fileType: 'XLSX',
                hasHeader: true,
                mappingJson: null,
                validationJson: null
            },
            {
                templateName: 'AFTERMARKET_PARTS',
                fileName: 'Aftermarket_parts_template.xlsx',
                blobPath: 'samples/Aftermarket_parts_template.xlsx',
                description: 'Template for uploading aftermarket parts pricing and stock data',
                importType: 'PRODUCTS',
                fileType: 'XLSX',
                hasHeader: true,
                mappingJson: null,
                validationJson: null
            },
            {
                templateName: 'BRANDED_PARTS',
                fileName: 'Branded_parts_template.xlsx',
                blobPath: 'samples/Branded_parts_template.xlsx',
                description: 'Template for uploading branded parts pricing and stock data',
                importType: 'PRODUCTS',
                fileType: 'XLSX',
                hasHeader: true,
                mappingJson: null,
                validationJson: null
            },
            {
                templateName: 'BACKORDERS',
                fileName: 'Backorders_template.csv',
                blobPath: 'samples/Backorders_template.csv',
                description: 'Template for uploading backorder information',
                importType: 'BACKORDERS',
                fileType: 'CSV',
                delimiter: ',',
                hasHeader: true,
                mappingJson: null,
                validationJson: null
            },
            {
                templateName: 'STOCK_UPDATE',
                fileName: 'Stock_update_template.csv',
                blobPath: 'samples/Stock_update_template.csv',
                description: 'Template for bulk stock updates',
                importType: 'STOCK',
                fileType: 'CSV',
                delimiter: ',',
                hasHeader: true,
                mappingJson: null,
                validationJson: null
            }
        ];

        for (const template of templates) {
            await prisma.uploadTemplate.upsert({
                where: { templateName: template.templateName },
                update: template,
                create: template
            });
        }
        console.log(`✅ Created ${templates.length} upload templates`);

        // 12. Create Import Batches (20)
        console.log('\n📥 Creating import batches...');
        const importBatches = [];
        for (let i = 1; i <= 20; i++) {
            const batch = await prisma.importBatch.create({
                data: {
                    fileName: `import_batch_${i}.xlsx`,
                    importType: ['PRODUCTS', 'BACKORDERS', 'STOCK'][i % 3],
                    status: ['COMPLETED', 'FAILED', 'PROCESSING'][i % 3],
                    totalRows: Math.floor(Math.random() * 1000) + 100,
                    successRows: Math.floor(Math.random() * 900) + 50,
                    errorRows: Math.floor(Math.random() * 50),
                    uploadedBy: adminUsers[i % adminUsers.length].id
                }
            });
            importBatches.push(batch);
        }
        console.log(`✅ Created ${importBatches.length} import batches`);

        // 13. Create Backorder Datasets (5)
        console.log('\n📊 Creating backorder datasets...');
        const backorderDatasets = [];
        for (let i = 1; i <= 5; i++) {
            const dataset = await prisma.backorderDataset.create({
                data: {
                    datasetName: `Backorder Dataset ${i}`,
                    importBatchId: importBatches[i - 1].id,
                    isActive: i === 1 // Only first one active
                }
            });
            backorderDatasets.push(dataset);
        }
        console.log(`✅ Created ${backorderDatasets.length} backorder datasets`);

        // 14. Create Backorder Items (50)
        console.log('\n📦 Creating backorder items...');
        let backorderItemCount = 0;
        for (let i = 0; i < 50; i++) {
            const product = products[i % products.length];
            const dealer = dealerAccounts[i % dealerAccounts.length];
            await prisma.backorderItem.create({
                data: {
                    datasetId: backorderDatasets[0].id, // Active dataset
                    productId: product.id,
                    dealerAccountId: dealer.id,
                    qtyBackordered: Math.floor(Math.random() * 50) + 1,
                    estimatedDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within 30 days
                }
            });
            backorderItemCount++;
        }
        console.log(`✅ Created ${backorderItemCount} backorder items`);

        console.log('\n✅ Comprehensive sample data seed completed successfully!');
        console.log('\n📊 Final Summary:');
        console.log(`   - Admin users: ${adminUsers.length}`);
        console.log(`   - Dealer accounts: ${dealerAccounts.length}`);
        console.log(`   - Dealer users: ${dealerUsers.length}`);
        console.log(`   - Band assignments: ${bandAssignmentCount}`);
        console.log(`   - Products: ${products.length}`);
        console.log(`   - Carts: ${carts.length}`);
        console.log(`   - Cart items: ${cartItemCount}`);
        console.log(`   - Orders: ${orders.length}`);
        console.log(`   - Order lines: ${orderLineCount}`);
        console.log(`   - System settings: ${settings.length}`);
        console.log(`   - Upload templates: ${templates.length}`);
        console.log(`   - Import batches: ${importBatches.length}`);
        console.log(`   - Backorder datasets: ${backorderDatasets.length}`);
        console.log(`   - Backorder items: ${backorderItemCount}`);
        console.log('\n💡 Database is now fully populated with sample data for testing!');

    } catch (error) {
        console.error('\n❌ Sample data seed failed:', error);
        throw error;
    }
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
