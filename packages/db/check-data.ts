import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('Checking database tables...\n');

    const counts = {
        products: await prisma.product.count(),
        dealers: await prisma.dealerAccount.count(),
        dealerUsers: await prisma.dealerUser.count(),
        bandAssignments: await prisma.dealerBandAssignment.count(),
        priceBands: await prisma.productPriceBand.count(),
        priceReferences: await prisma.productPriceReference.count(),
        stock: await prisma.productStock.count(),
        carts: await prisma.cart.count(),
        orders: await prisma.orderHeader.count(),
    };

    console.log('Table Row Counts:');
    console.log('================');
    Object.entries(counts).forEach(([table, count]) => {
        console.log(`${table.padEnd(20)}: ${count}`);
    });

    // Sample some products
    console.log('\nSample Products (first 5):');
    console.log('==========================');
    const products = await prisma.product.findMany({
        take: 5,
        include: {
            bandPrices: true,
            stock: true
        }
    });

    products.forEach(p => {
        console.log(`${p.productCode} - ${p.description.substring(0, 50)} - ${p.partType}`);
        console.log(`  Prices: ${p.bandPrices.length}, Stock: ${p.stock?.freeStock ?? 0}`);
    });

    // Check dealers
    console.log('\nDealers:');
    console.log('========');
    const dealers = await prisma.dealerAccount.findMany({
        include: {
            bandAssignments: true,
            users: true
        }
    });

    dealers.forEach(d => {
        console.log(`${d.accountNo} - ${d.companyName} - ${d.status} - ${d.entitlement}`);
        console.log(`  Band Assignments: ${d.bandAssignments.length}, Users: ${d.users.length}`);
    });

    await prisma.$disconnect();
}

checkData().catch(console.error);
