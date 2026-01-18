import { PrismaClient } from 'db';
import { PricingService } from '@packages/shared/src/services/PricingService';

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
        priceSource: string | null;
        tierCode: string | null;
        lineTotal: number | null;
    }>;
    subtotal: number;
}

/**
 * Cart Service V2 - Uses centralized PricingService
 *
 * Key Features:
 * - Prices refresh automatically when cart is loaded (getOrCreateCart)
 * - Uses centralized pricing algorithm (special price → net tier → fallback band)
 * - Cart items always show current prices (not stale)
 */
export class CartServiceV2 {
    private pricingService: PricingService;

    constructor(private prisma: PrismaClient) {
        this.pricingService = new PricingService(prisma);
    }

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

        // 3. IMPORTANT: Refresh pricing for all items using current prices
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
        const cart = await this.prisma.cart.findUnique({
            where: { dealerUserId }
        });

        const cartId = cart?.id || (await this.prisma.cart.create({
            data: { dealerAccountId, dealerUserId }
        })).id;

        // 3. Check if item already exists
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId,
                    productId: input.productId
                }
            }
        });

        if (existingItem) {
            // Update quantity
            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { qty: existingItem.qty + input.qty }
            });
        } else {
            // Create new item
            await this.prisma.cartItem.create({
                data: {
                    cartId,
                    productId: input.productId,
                    qty: input.qty
                }
            });
        }

        // 4. Return updated cart with current pricing
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

        // 2. Update quantity
        await this.prisma.cartItem.update({
            where: { id: cartItemId },
            data: { qty }
        });

        // 3. Return updated cart with refreshed pricing
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

        // 2. Delete item
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

    /**
     * Enrich cart with current pricing using centralized PricingService
     * IMPORTANT: This always fetches CURRENT prices (never stale)
     */
    private async enrichCartWithPricing(cart: any, dealerAccountId: string): Promise<CartWithItems> {
        if (cart.items.length === 0) {
            return {
                ...cart,
                items: [],
                subtotal: 0
            };
        }

        // Use centralized pricing service to resolve prices (bulk operation)
        const productIds = cart.items.map((item: any) => item.productId);
        const priceMap = await this.pricingService.resolvePrices(
            productIds,
            dealerAccountId,
            new Date() // Current moment
        );

        let subtotal = 0;
        const enrichedItems = cart.items.map((item: any) => {
            const priceResolution = priceMap.get(item.productId);
            const price = priceResolution?.price || 0;
            const lineTotal = price * item.qty;

            if (price > 0) {
                subtotal += lineTotal;
            }

            return {
                id: item.id,
                productId: item.productId,
                qty: item.qty,
                product: item.product,
                yourPrice: price > 0 ? price : null,
                priceSource: priceResolution?.priceSource || null,
                tierCode: priceResolution?.tierCode || null,
                lineTotal: price > 0 ? lineTotal : null
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

    /**
     * Snapshot prices for checkout
     * Returns cart items with snapshotted prices (for order creation)
     */
    async snapshotCartForCheckout(dealerUserId: string, dealerAccountId: string): Promise<{
        items: Array<{
            productId: string;
            qty: number;
            unitPriceSnapshot: number;
            lineTotal: number;
        }>;
        subtotal: number;
    }> {
        const cart = await this.getOrCreateCart(dealerUserId, dealerAccountId);

        if (cart.items.length === 0) {
            return { items: [], subtotal: 0 };
        }

        // Snapshot prices at this exact moment for checkout
        const productIds = cart.items.map(item => item.productId);
        const priceMap = await this.pricingService.resolvePrices(
            productIds,
            dealerAccountId,
            new Date() // Snapshot current moment
        );

        let subtotal = 0;
        const items = cart.items.map(item => {
            const priceResolution = priceMap.get(item.productId);
            const unitPriceSnapshot = priceResolution?.price || 0;
            const lineTotal = unitPriceSnapshot * item.qty;

            subtotal += lineTotal;

            return {
                productId: item.productId,
                qty: item.qty,
                unitPriceSnapshot, // CRITICAL: This price will be stored on OrderLine and never changes
                lineTotal
            };
        });

        return { items, subtotal };
    }
}
