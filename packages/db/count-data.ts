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

async function checkAllData() {
    try {
        const productCount = await prisma.product.count();
        const dealerCount = await prisma.dealerAccount.count();
        const orderCount = await prisma.orderHeader.count();
        const backorderCount = await prisma.backorderLine.count();

        console.log('📊 Database Counts:');
        console.log(`   Products: ${productCount}`);
        console.log(`   Dealers: ${dealerCount}`);
        console.log(`   Orders: ${orderCount}`);
        console.log(`   Backorders: ${backorderCount}`);

        if (productCount === 0) {
            console.log('\n❌ NO PRODUCTS FOUND! Need to run seed script.');
        } else {
            console.log('\n✅ Database has data!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkAllData();
