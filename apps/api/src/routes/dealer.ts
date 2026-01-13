import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma, PartType, Entitlement, DealerStatus } from 'db';
import { EntitlementRules, EntitlementError } from 'rules';
import { CheckoutSchema, CartItemSchema } from 'shared';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { ruleEngine } from '../lib/ruleEngine';

const dealerRoutes: FastifyPluginAsync = async (server) => {
    // GET /dealer/search - Search products with dealer pricing & entitlement filtering
    server.get('/search', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        // 1. Validate query parameters
        const querySchema = z.object({
            q: z.string().min(1).optional(),
            limit: z.coerce.number().int().min(1).max(100).optional().default(20),
            partType: z.nativeEnum(PartType).optional(),
            inStockOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
            sortBy: z.enum(['price', 'code', 'stock']).optional()
        });

        const validation = querySchema.safeParse(request.query);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid query parameters',
                details: validation.error.issues
            });
        }

        const { q, limit, partType, inStockOnly, sortBy } = validation.data;

        // 2. Ensure user is authenticated and is a dealer
        if (!request.user || request.user.role !== 'DEALER' || !request.user.dealerAccountId) {
            return reply.status(request.user?.role !== 'DEALER' ? 403 : 401).send({
                error: request.user?.role !== 'DEALER' ? 'Forbidden' : 'Unauthorized',
                message: 'Dealer access required'
            });
        }

        const dealerAccountId = request.user.dealerAccountId;

        try {
            // 3. Look up DealerAccount for Status & Entitlement
            const dealerAccount = await prisma.dealerAccount.findUnique({
                where: { id: dealerAccountId },
                select: { status: true, entitlement: true, companyName: true }
            });

            if (!dealerAccount) {
                return reply.status(404).send({ error: 'Not Found', message: 'Dealer account not found' });
            }

            // CHECK STATUS
            if (dealerAccount.status === DealerStatus.INACTIVE) {
                return reply.status(403).send({ error: 'Forbidden', message: 'Account inactive' });
            }

            // 4. Build PRISMA Where Conditions
            let where: any = {
                isActive: true
            };

            // Apply Search Query
            if (q) {
                where.OR = [
                    { productCode: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { aliases: { some: { aliasValue: { contains: q, mode: 'insensitive' } } } }
                ];
            }

            // Apply ENTITLEMENT FILTER using Rule Engine
            const entitlementFilter = EntitlementRules.getEntitlementFilter(dealerAccount.entitlement as any);
            where = { ...where, ...entitlementFilter };

            // Apply Optional partType filter (narrowing down)
            if (partType) {
                where.partType = partType;
            }

            // Apply inStockOnly filter
            if (inStockOnly) {
                where.stock = { freeStock: { gt: 0 } };
            }

            // 5. Handle Sorting
            let orderBy: any = { productCode: 'asc' }; // Default
            if (sortBy === 'code') orderBy = { productCode: 'asc' };
            if (sortBy === 'stock') orderBy = { stock: { freeStock: 'desc' } };

            // 6. Search Products
            const products = await prisma.product.findMany({
                where,
                include: {
                    stock: true,
                    aliases: true
                },
                take: limit,
                orderBy
            });

            // 7. Calculate pricing for all products using rule engine
            const priceMap = await ruleEngine.pricing.calculatePrices(
                dealerAccountId,
                products.map(p => p.id)
            );

            // Format response
            const results = products.map(product => {
                const pricing = priceMap.get(product.id);

                return {
                    id: product.id,
                    productCode: product.productCode,
                    description: product.description,
                    partType: product.partType,
                    freeStock: product.stock?.freeStock ?? 0,
                    yourPrice: pricing?.available ? pricing.price : null,
                    bandCode: pricing?.bandCode ?? null,
                    available: pricing?.available ?? false,
                    minPriceApplied: pricing?.minimumPriceApplied ?? false,
                    reason: pricing?.reason,
                    currency: 'GBP'
                };
            });

            // In-memory sort by price if requested (only for current page)
            if (sortBy === 'price') {
                results.sort((a, b) => (Number(a.yourPrice) || 0) - (Number(b.yourPrice) || 0));
            }

            return reply.status(200).send({
                results,
                count: results.length,
                query: q || null,
                entitlement: dealerAccount.entitlement,
                status: dealerAccount.status
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while searching products'
            });
        }
    });

    // GET /dealer/product/:productCode - Get single product with pricing
    server.get('/product/:productCode', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({
            productCode: z.string().min(1)
        });

        const validation = paramsSchema.safeParse(request.params);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid product code'
            });
        }

        const { productCode } = validation.data;

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            const product = await prisma.product.findUnique({
                where: { productCode },
                include: {
                    stock: true,
                    refPrice: true,
                    aliases: true
                }
            });

            if (!product) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Product not found'
                });
            }

            // Get dealer pricing using batch method for single item
            const priceMap = await ruleEngine.pricing.calculatePrices(
                request.user.dealerAccountId,
                [product.id]
            );
            const pricing = priceMap.get(product.id);

            if (!pricing) {
                return reply.status(500).send({ error: 'Pricing fail', message: 'Could not calculate price' });
            }

            return reply.status(200).send({
                id: product.id,
                productCode: product.productCode,
                description: product.description,
                partType: product.partType,
                supplier: product.supplier,
                discountCode: product.discountCode,
                freeStock: product.stock?.freeStock || 0,
                yourPrice: pricing.price,
                bandCode: pricing.bandCode,
                minPriceApplied: pricing.minimumPriceApplied,
                currency: 'GBP',
                aliases: product.aliases.map(a => a.aliasValue),
                reason: pricing.reason,
                available: pricing.available
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching product details'
            });
        }
    });

    // ========== CART ENDPOINTS ==========

    // GET /dealer/cart - Get or create cart with items and pricing
    server.get('/cart', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        if (!request.user?.userId || !request.user?.dealerAccountId) {
            return reply.status(401).send({ error: 'Unauthorized', message: 'Auth info missing' });
        }

        try {
            const dealerUser = await prisma.dealerUser.findUnique({
                where: { userId: request.user.userId }
            });

            if (!dealerUser) {
                return reply.status(404).send({ error: 'Not Found', message: 'Dealer user not found' });
            }

            let cart = await prisma.cart.findFirst({
                where: { dealerUserId: dealerUser.id },
                include: { items: { include: { product: { include: { stock: true } } } } }
            });

            if (!cart) {
                cart = await prisma.cart.create({
                    data: { dealerUserId: dealerUser.id, dealerAccountId: dealerUser.dealerAccountId },
                    include: { items: { include: { product: { include: { stock: true } } } } }
                });
            }

            // Batch Calculate pricing
            const productIds = cart.items.map(i => i.product.id);
            const priceMap = await ruleEngine.pricing.calculatePrices(
                request.user.dealerAccountId,
                productIds
            );

            const itemsWithPricing = cart.items.map((item) => {
                const pricing = priceMap.get(item.product.id);
                const unitPrice = pricing?.available ? Number(pricing.price) : 0;
                const lineTotal = unitPrice * item.qty;

                return {
                    id: item.id,
                    productCode: item.product.productCode,
                    description: item.product.description,
                    partType: item.product.partType,
                    qty: item.qty,
                    unitPrice: unitPrice,
                    lineTotal: lineTotal,
                    bandCode: pricing?.bandCode,
                    minPriceApplied: pricing?.minimumPriceApplied,
                    freeStock: item.product.stock?.freeStock || 0,
                    available: pricing?.available,
                    reason: pricing?.reason
                };
            });

            const cartTotal = itemsWithPricing.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

            return reply.status(200).send({
                cartId: cart.id,
                items: itemsWithPricing,
                itemCount: cart.items.length,
                total: cartTotal,
                currency: 'GBP'
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error', message: 'Cart fetch failed' });
        }
    });

    // POST /dealer/cart/items - Add or update cart item
    server.post('/cart/items', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const validation = CartItemSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({ error: 'Validation Error', details: validation.error.issues });
        }

        const { productId, qty } = validation.data;
        if (!request.user?.userId) return reply.status(401).send({ error: 'Unauthorized' });

        try {
            const dealerUser = await prisma.dealerUser.findUnique({ where: { userId: request.user.userId } });
            if (!dealerUser) return reply.status(404).send({ error: 'Not Found', message: 'Dealer user not found' });

            let cart = await prisma.cart.findFirst({ where: { dealerUserId: dealerUser.id } });
            if (!cart) {
                cart = await prisma.cart.create({
                    data: { dealerUserId: dealerUser.id, dealerAccountId: dealerUser.dealerAccountId }
                });
            }

            const existingItem = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
            if (existingItem) {
                await prisma.cartItem.update({ where: { id: existingItem.id }, data: { qty: existingItem.qty + qty } });
            } else {
                await prisma.cartItem.create({ data: { cartId: cart.id, productId, qty } });
            }

            return reply.status(200).send({ success: true, message: 'Item added' });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error', message: 'Add item failed' });
        }
    });

    // PATCH /dealer/cart/items/:id 
    server.patch('/cart/items/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({ id: z.string().uuid() });
        const bodySchema = CartItemSchema.pick({ qty: true });

        const paramsValidation = paramsSchema.safeParse(request.params);
        const bodyValidation = bodySchema.safeParse(request.body);

        if (!paramsValidation.success || !bodyValidation.success) return reply.status(400).send({ error: 'Validation Error' });

        const { id } = paramsValidation.data;
        const { qty } = bodyValidation.data;

        try {
            const cartItem = await prisma.cartItem.findUnique({
                where: { id },
                include: { cart: { include: { dealerUser: true } } }
            });

            if (!cartItem) return reply.status(404).send({ error: 'Not Found' });
            if (cartItem.cart.dealerUser.userId !== request.user!.userId) return reply.status(403).send({ error: 'Forbidden' });

            if (qty === 0) {
                await prisma.cartItem.delete({ where: { id } });
            } else {
                await prisma.cartItem.update({ where: { id }, data: { qty } });
            }

            return reply.status(200).send({ success: true, message: 'Cart updated' });
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // DELETE /dealer/cart/items/:id
    server.delete('/cart/items/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({ id: z.string().uuid() });
        const validation = paramsSchema.safeParse(request.params);

        if (!validation.success) return reply.status(400).send({ error: 'Validation Error' });
        const { id } = validation.data;

        try {
            const cartItem = await prisma.cartItem.findUnique({
                where: { id },
                include: { cart: { include: { dealerUser: true } } }
            });

            if (!cartItem) return reply.status(404).send({ error: 'Not Found' });
            if (cartItem.cart.dealerUser.userId !== request.user!.userId) return reply.status(403).send({ error: 'Forbidden' });

            await prisma.cartItem.delete({ where: { id } });

            return reply.status(200).send({ success: true, message: 'Item removed' });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // POST /dealer/checkout
    server.post('/checkout', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const validation = CheckoutSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid request body',
                details: validation.error.issues
            });
        }

        const { dispatchMethod, poRef, notes } = validation.data;

        if (!request.user?.userId || !request.user?.dealerAccountId) {
            return reply.status(400).send({ error: 'Bad Request', message: 'Dealer info missing' });
        }

        try {
            // 1. Get Dealer Info & User
            const dealerUser = await prisma.dealerUser.findUnique({
                where: { userId: request.user.userId }
            });

            if (!dealerUser) {
                return reply.status(404).send({ error: 'Not Found', message: 'Dealer user not found' });
            }

            const dealerAccount = await prisma.dealerAccount.findUnique({
                where: { id: request.user.dealerAccountId }
            });

            if (!dealerAccount) {
                return reply.status(404).send({ error: 'Not Found', message: 'Dealer account not found' });
            }

            // 2. Get cart with items
            const cart = await prisma.cart.findFirst({
                where: { dealerUserId: dealerUser.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    stock: true
                                }
                            }
                        }
                    }
                }
            });

            if (!cart || cart.items.length === 0) {
                return reply.status(400).send({ error: 'Bad Request', message: 'Cart is empty' });
            }

            // 3. VALIDATE ORDER via Rule Engine
            const orderValidation = await ruleEngine.orders.validateOrderCreation({
                dealerAccountId: dealerAccount.id,
                dealerStatus: dealerAccount.status,
                cartItems: cart.items.map(item => ({
                    productId: item.productId,
                    productCode: item.product.productCode,
                    quantity: item.qty
                })),
                dispatchMethod,
                poRef,
                notes
            });

            if (!orderValidation.canProceed) {
                return reply.status(403).send({
                    error: 'Order validation failed',
                    blockers: orderValidation.blockers,
                    details: orderValidation.errors,
                    warnings: orderValidation.warnings
                });
            }

            // 4. Fetch prices for all items in batch
            const itemProductIds = cart.items.map(i => i.product.id);
            const priceMap = await ruleEngine.pricing.calculatePrices(
                request.user!.dealerAccountId!,
                itemProductIds
            );

            // Generate unique order number
            const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            // Prepare order lines with current pricing
            const orderLinesData = cart.items.map((item) => {
                const pricing = priceMap.get(item.product.id);

                if (!pricing) {
                    throw new Error(`Pricing unavailable for product ${item.product.productCode}`);
                }

                if (!pricing.available) {
                    throw new Error(`Product ${item.product.productCode} is not available (${pricing.reason})`);
                }

                return {
                    productId: item.productId,
                    productCodeSnapshot: item.product.productCode,
                    descriptionSnapshot: item.product.description,
                    partTypeSnapshot: item.product.partType,
                    qty: item.qty,
                    unitPriceSnapshot: Number(pricing.price),
                    bandCodeSnapshot: pricing.bandCode,
                    minPriceApplied: pricing.minimumPriceApplied,
                    shippedQty: 0,
                    backorderedQty: 0
                };
            });

            // Calculate totals
            const subtotal = orderLinesData.reduce((sum, line) => {
                return sum + (line.unitPriceSnapshot * line.qty);
            }, 0);

            // Use transaction to create order, clear cart, and log action
            const order = await prisma.$transaction(async (tx) => {
                // Create Order
                const newOrder = await tx.orderHeader.create({
                    data: {
                        orderNo,
                        dealerAccountId: request.user!.dealerAccountId!,
                        dealerUserId: dealerUser.id,
                        status: 'SUSPENDED',
                        dispatchMethod,
                        poRef,
                        notes,
                        subtotal: subtotal,
                        total: subtotal,
                        currency: 'GBP',
                        lines: {
                            create: orderLinesData
                        }
                    },
                    include: {
                        lines: true
                    }
                });

                // Clear Cart
                await tx.cartItem.deleteMany({
                    where: { cartId: cart.id }
                });

                // Create Audit Log
                await tx.auditLog.create({
                    data: {
                        actorType: 'DEALER',
                        actorUserId: request.user!.userId,
                        action: 'ORDER_CREATED',
                        entityType: 'ORDER',
                        entityId: newOrder.id,
                        afterJson: JSON.parse(JSON.stringify(newOrder))
                    }
                });

                return newOrder;
            });

            return reply.status(201).send({
                message: 'Order created successfully',
                order
            });

        } catch (error: any) {
            server.log.error(error);
            // Handle specific pricing error
            if (error.message && error.message.includes('unavailable')) {
                return reply.status(400).send({
                    error: 'Pricing Error',
                    message: error.message
                });
            }
            if (error.message && error.message.includes('not available')) {
                return reply.status(400).send({
                    error: 'Availability Error',
                    message: error.message
                });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while creating order'
            });
        }
    });

    // GET /dealer/orders
    server.get('/orders', {
        preHandler: requireAuth,
    }, async (request: AuthenticatedRequest, reply) => {
        const user = request.user;
        if (!user || !user.dealerAccountId) {
            return reply.status(401).send({ error: 'Unauthorized', message: 'Not a dealer' });
        }

        try {
            const orders = await prisma.orderHeader.findMany({
                where: { dealerAccountId: user.dealerAccountId },
                include: {
                    lines: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return orders;
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch orders' });
        }
    });
};

export default dealerRoutes;
