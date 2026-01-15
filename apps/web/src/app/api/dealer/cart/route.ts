import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { orderEngine } from '@/services/OrderEngine';

// GET /api/dealer/cart
export async function GET(req: NextRequest) {
    try {
        const dealerAccountId = req.headers.get('x-dealer-account-id') || 'D-001'; // Mock for now until full session middleware

        let cart = await prisma.cart.findFirst({
            where: { dealerAccountId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { dealerAccountId },
                include: { items: { include: { product: true } } }
            });
        }

        const items = cart.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            qty: item.qty,
            product: {
                productCode: item.product.productCode,
                description: item.product.description,
                partType: item.product.partType
            },
            price: 100 // Simplified
        }));

        return NextResponse.json({
            items,
            subtotal: items.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0),
            itemCount: items.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/dealer/cart/items (Consolidated for simplicity)
export async function POST(req: NextRequest) {
    try {
        const { productId, qty } = await req.json();
        const dealerAccountId = req.headers.get('x-dealer-account-id') || 'D-001';

        let cart = await prisma.cart.findFirst({ where: { dealerAccountId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { dealerAccountId } });
        }

        const item = await prisma.cartItem.upsert({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId
                }
            },
            update: { qty: { increment: qty } },
            create: {
                cartId: cart.id,
                productId,
                qty
            }
        });

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
