import { PrismaClient, OrderStatus } from '@prisma/client';

export interface CartItemInput {
    productId: string;
    qty: number;
}

export class OrderService {
    constructor(
        private prisma: PrismaClient,
        private pricingService: any
    ) { }

    async getOrCreateCart(dealerUserId: string, dealerAccountId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { dealerUserId },
            include: { items: { include: { product: true } } }
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { dealerAccountId, dealerUserId },
                include: { items: { include: { product: true } } }
            });
        }
        return cart;
    }

    async addToCart(dealerUserId: string, dealerAccountId: string, input: CartItemInput) {
        const cart = await this.getOrCreateCart(dealerUserId, dealerAccountId);

        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: input.productId
                }
            }
        });

        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { qty: existingItem.qty + input.qty }
            });
        }

        return this.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: input.productId,
                qty: input.qty
            }
        });
    }

    async placeOrder(dealerUserId: string, dealerAccountId: string, poRef?: string, notes?: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { dealerUserId },
            include: { items: { include: { product: true } } }
        });

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        const orderLinesData = await Promise.all(cart.items.map(async (item: any) => {
            const pricing = await this.pricingService.calculatePrice(dealerAccountId, item.product.productCode, item.qty);
            return {
                productId: item.productId,
                productCodeSnapshot: item.product.productCode,
                descriptionSnapshot: item.product.description,
                partTypeSnapshot: item.product.partType,
                qty: item.qty,
                unitPriceSnapshot: pricing.unitPrice,
                bandCodeSnapshot: pricing.bandCode,
                minPriceApplied: pricing.minimumPriceApplied
            };
        }));

        const subtotal = orderLinesData.reduce((acc: number, line: any) => acc + (line.unitPriceSnapshot * line.qty), 0);

        const order = await this.prisma.$transaction(async (tx: any) => {
            const newOrder = await tx.orderHeader.create({
                data: {
                    orderNo: `ORD-${Date.now()}`,
                    dealerAccountId,
                    dealerUserId,
                    status: OrderStatus.SUSPENDED,
                    poRef,
                    notes,
                    subtotal,
                    total: subtotal,
                    lines: {
                        create: orderLinesData
                    }
                }
            });

            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return newOrder;
        });

        return order;
    }

    async getOrders(dealerAccountId: string) {
        return this.prisma.orderHeader.findMany({
            where: { dealerAccountId },
            include: { lines: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
