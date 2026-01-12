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

async function checkBandsAndPricing() {
    try {
        console.log('📊 Checking Dealer Band Assignments:\n');

        const dealers = await prisma.dealerAccount.findMany({
            include: {
                bandAssignments: true
            },
            orderBy: { accountNo: 'asc' }
        });

        dealers.forEach(d => {
            console.log(`${d.accountNo} (${d.companyName}):`);
            if (d.bandAssignments.length === 0) {
                console.log('  ❌ NO BAND ASSIGNMENTS!');
            } else {
                d.bandAssignments.forEach((b: any) => {
                    console.log(`  ✅ ${b.partType} = Band ${b.bandCode}`);
                });
            }
            console.log('');
        });

        console.log('\n📊 Checking Product Price Bands:\n');

        const products = await prisma.product.findMany({
            include: {
                bandPrices: true
            },
            orderBy: { productCode: 'asc' }
        });

        products.forEach(p => {
            console.log(`${p.productCode} (${p.partType}):`);
            if (p.bandPrices.length === 0) {
                console.log('  ❌ NO PRICE BANDS!');
            } else {
                p.bandPrices.forEach((b: any) => {
                    console.log(`  ✅ Band ${b.bandCode} = £${b.price}`);
                });
            }
            console.log('');
        });

        console.log('\n📊 Summary:');
        const dealersWithoutBands = dealers.filter(d => d.bandAssignments.length === 0);
        const productsWithoutBands = products.filter(p => p.bandPrices.length === 0);

        console.log(`Dealers without band assignments: ${dealersWithoutBands.length}`);
        console.log(`Products without price bands: ${productsWithoutBands.length}`);

        if (dealersWithoutBands.length === 0 && productsWithoutBands.length === 0) {
            console.log('\n✅ All data is properly configured!');
        } else {
            console.log('\n❌ Some data is missing - this will cause pricing failures!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkBandsAndPricing();
