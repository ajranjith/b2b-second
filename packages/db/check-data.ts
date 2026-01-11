import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'hotbray',
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function checkData() {
    console.log('📊 Checking database data...\n');

    try {
        // Get dealers
        const dealers = await prisma.dealerAccount.findMany({
            include: {
                bandAssignments: true,
                users: { include: { user: true } }
            },
            take: 3
        });

        console.log(`✅ Found ${dealers.length} dealers:`);
        dealers.forEach((d: any) => {
            console.log(`  - ${d.accountNo}: ${d.companyName} (ID: ${d.id})`);
            console.log(`    Bands: ${d.bandAssignments.map((b: any) => `${b.partType}=${b.bandCode}`).join(', ')}`);
            if (d.users[0]) {
                console.log(`    User: ${d.users[0].user.email} (DealerUserID: ${d.users[0].id})`);
            }
        });

        // Get products
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                stock: true,
                refPrice: true,
                bandPrices: true
            },
            take: 3
        });

        console.log(`\n✅ Found ${products.length} products:`);
        products.forEach((p: any) => {
            console.log(`  - ${p.productCode}: ${p.description}`);
            console.log(`    Stock: ${p.stock?.freeStock || 0}`);
            console.log(`    Bands: ${p.bandPrices.map((b: any) => `${b.bandCode}=£${b.price}`).join(', ')}`);
        });

        // Get orders
        const orders = await prisma.orderHeader.findMany({
            include: { lines: true },
            take: 2
        });

        console.log(`\n✅ Found ${orders.length} orders:`);
        orders.forEach((o: any) => {
            console.log(`  - ${o.orderNo}: ${o.status} - £${o.total} (${o.lines.length} items)`);
        });

        // Get backorders
        const backorders = await prisma.backorderLine.findMany({ take: 3 });
        console.log(`\n✅ Found ${backorders.length} backorder lines`);

        console.log('\n🎯 Test API with these IDs:');
        if (dealers[0]) {
            console.log(`   Dealer Account ID: ${dealers[0].id}`);
            if (dealers[0].users[0]) {
                console.log(`   Dealer User ID: ${dealers[0].users[0].id}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkData();
