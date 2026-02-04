import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../packages/db/.env') });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('📊 Verifying Import Data\n');

    // Product count
    const productCount = await prisma.product.count();
    console.log(`✅ Products: ${productCount}`);

    // ProductPriceBand count
    const priceBandCount = await prisma.productPriceBand.count();
    console.log(`✅ Product Price Bands: ${priceBandCount}`);

    // BackorderLine count
    const backorderCount = await prisma.backorderLine.count();
    console.log(`✅ Backorder Lines: ${backorderCount}`);

    // ImportBatch statuses
    console.log('\n📋 Import Batch Statuses:');
    const batches = await prisma.importBatch.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10
    });

    for (const batch of batches) {
        console.log(`  - ${batch.importType}: ${batch.status} (${batch.validRows}/${batch.totalRows} valid)`);
    }

    // Product breakdown by type
    console.log('\n🔧 Products by Type:');
    const genuineCount = await prisma.product.count({ where: { partType: 'GENUINE' } });
    const aftermarketCount = await prisma.product.count({ where: { partType: 'AFTERMARKET' } });
    const brandedCount = await prisma.product.count({ where: { partType: 'BRANDED' } });

    console.log(`  - GENUINE: ${genuineCount}`);
    console.log(`  - AFTERMARKET: ${aftermarketCount}`);
    console.log(`  - BRANDED: ${brandedCount}`);
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
