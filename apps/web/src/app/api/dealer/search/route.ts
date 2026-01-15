import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const partType = searchParams.get('partType') || undefined;

        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { productCode: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ],
                ...(partType ? { partType: partType as any } : {})
            },
            include: {
                stock: true,
                refPrice: true,
                bandPrices: true
            },
            take: 50
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('💥 [Search API] Search failed:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
