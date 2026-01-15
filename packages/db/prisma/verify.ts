import { prisma } from '../src/index';

async function main() {
    console.log('📊 Verifying database population (using local db adapter)...\n');

    const tables = [
        'appUser',
        'dealerAccount',
        'dealerUser',
        'dealerBandAssignment',
        'product',
        'productStock',
        'productPriceReference',
        'productPriceBand',
        'supersession',
        'orderHeader',
        'orderLine',
        'cart',
        'cartItem',
        'uploadTemplate',
        'newsPost',
        'exclusiveDoc',
        'externalLink',
        'importBatch',
        'importError',
        'stgProductPriceRow',
        'stgBackorderRow',
        'backorderDataset',
        'backorderLine'
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
        try {
            const count = await (prisma as any)[table].count();
            results[table] = count;
        } catch (e: any) {
            results[table] = `ERROR: ${e.message.split('\n')[0]}`;
        }
    }

    console.table(
        Object.entries(results).map(([table, count]) => ({
            Table: table,
            Count: count
        }))
    );

    const totalRecords = Object.values(results).reduce((acc, curr) => acc + (typeof curr === 'number' && curr > 0 ? curr : 0), 0);
    console.log(`\n📈 Total records found: ${totalRecords}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
