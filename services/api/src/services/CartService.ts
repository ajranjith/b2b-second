import { PrismaClient } from 'db';
import { PricingRules } from 'rules';

export interface CartItemInput {
    productId: string;
    qty: number;
}

export interface CartWithItems {
    id: string;
    dealerAccountId: string;
    dealerUserId: string;
    items: Array<{
        id: string;
        productId: string;
        qty: number;
        product: {
            productCode: string;
            description: string;
            partType: string;
        };
        yourPrice: number | null;
        bandCode: string | null;
        available: boolean;
        lineTotal: number | null;
    }>;
    subtotal: number;
}

export class CartService {
    constructor(
        private prisma: PrismaClient,
        private pricingRules: PricingRules
    ) { }

    async getOrCreateCart(dealerUserId: string, dealerAccountId: string): Promise<CartWithItems> {
        // 1. Try to find existing cart
        let cart = await this.prisma.cart.findUnique({
            where: { dealerUserId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                productCode: true,
                                description: true,
                                partType: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Create if doesn't exist
        if (!cart) {
// withAudit(
            cart = await this.prisma.cart.create({
                data: {
                    dealerAccountId,
                    dealerUserId
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    productCode: true,
                                    description: true,
                                    partType: true
                                }
                            }
                        }
                    }
                }
            });
        }

        // 3. Calculate pricing for all items
        return this.enrichCartWithPricing(cart, dealerAccountId);
    }

    async addItem(dealerUserId: string, dealerAccountId: string, input: CartItemInput): Promise<CartWithItems> {
        // 1. Verify product exists
        const product = await this.prisma.product.findUnique({
            where: { id: input.productId }
        });

        if (!product) {
            throw new Error('Product not found');
        }

        // 2. Get or create cart
        const cart = await this.getOrCreateCart(dealerUserId, dealerAccountId);

        // 3. Check if item already exists
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: input.productId
                }
            }
        });

        if (existingItem) {
// withAudit(
            // Update quantity
// withAudit(
            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { qty: existingItem.qty + input.qty }
            });
        } else {
            // Create new item
// withAudit(
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: input.productId,
                    qty: input.qty
                }
            });
        }

        // 4. Return updated cart with pricing
        return this.getOrCreateCart(dealerUserId, dealerAccountId);
    }

    async updateItem(cartItemId: string, dealerUserId: string, dealerAccountId: string, qty: number): Promise<CartWithItems> {
        // 1. Verify item belongs to user's cart
        const item = await this.prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: { cart: true }
        });

        if (!item || item.cart.dealerUserId !== dealerUserId) {
            throw new Error('Cart item not found');
        }

// withAudit(
        // 2. Update quantity
// withAudit(
        await this.prisma.cartItem.update({
            where: { id: cartItemId },
            data: { qty }
        });

        // 3. Return updated cart
        return this.getOrCreateCart(dealerUserId, dealerAccountId);
    }

    async removeItem(cartItemId: string, dealerUserId: string, dealerAccountId: string): Promise<CartWithItems> {
        // 1. Verify item belongs to user's cart
        const item = await this.prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: { cart: true }
        });

        if (!item || item.cart.dealerUserId !== dealerUserId) {
            throw new Error('Cart item not found');
        }

// withAudit(
        // 2. Delete item
// withAudit(
        await this.prisma.cartItem.delete({
            where: { id: cartItemId }
        });

        // 3. Return updated cart
        return this.getOrCreateCart(dealerUserId, dealerAccountId);
    }

    async clearCart(dealerUserId: string, dealerAccountId: string): Promise<CartWithItems> {
        const cart = await this.prisma.cart.findUnique({
            where: { dealerUserId }
        });

        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
        }

        return this.getOrCreateCart(dealerUserId, dealerAccountId);
    }

    private async enrichCartWithPricing(cart: any, dealerAccountId: string): Promise<CartWithItems> {
        if (cart.items.length === 0) {
            return {
                ...cart,
                items: [],
                subtotal: 0
            };
        }

        // Calculate pricing for all items
        const priceMap = await this.pricingRules.calculatePrices(
            dealerAccountId,
            cart.items.map((item: any) => item.productId)
        );

        let subtotal = 0;
        const enrichedItems = cart.items.map((item: any) => {
            const pricing = priceMap.get(item.productId);
            const lineTotal = pricing?.available ? Number(pricing.price) * item.qty : null;

            if (lineTotal !== null) {
                subtotal += lineTotal;
            }

            return {
                id: item.id,
                productId: item.productId,
                qty: item.qty,
                product: item.product,
                yourPrice: pricing?.available ? pricing.price : null,
                bandCode: pricing?.bandCode ?? null,
                available: pricing?.available ?? false,
                lineTotal
            };
        });

        return {
            id: cart.id,
            dealerAccountId: cart.dealerAccountId,
            dealerUserId: cart.dealerUserId,
            items: enrichedItems,
            subtotal
        };
    }
}
