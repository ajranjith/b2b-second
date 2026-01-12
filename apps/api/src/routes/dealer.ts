import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma, PartType, Entitlement, DealerStatus } from 'db';
import { PricingService, EntitlementError } from 'rules';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

// Initialize PricingService
// Note: We use the global prisma client here. For transactions, we'll need to handle context carefully,
// but for calculating prices (READ ONLY), the global instance is sufficient.
const pricingService = new PricingService(prisma);

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
            // SUSPENDED or ACTIVE can proceed, but UI should show notice for SUSPENDED

            // 4. Build PRISMA Where Conditions
            const where: any = {
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

            // Apply ENTITLEMENT FILTER
            if (dealerAccount.entitlement === Entitlement.GENUINE_ONLY) {
                where.partType = PartType.GENUINE;
            } else if (dealerAccount.entitlement === Entitlement.AFTERMARKET_ONLY) {
                // Anything EXCEPT Genuine
                where.partType = { not: PartType.GENUINE };
            }
            // SHOW_ALL has no additional filter

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
            // Note: global sortBy price is omitted due to architecture (per-dealer bands), but sorted in memory below for the page.

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

            // 7. Get pricing for each product
            const results = await Promise.all(
                products.map(async (product) => {
                    try {
                        const pricing = await pricingService.calculatePrice(
                            dealerAccountId,
                            product.productCode,
                            1
                        );

                        return {
                            id: product.id,
                            productCode: product.productCode,
                            description: product.description,
                            partType: product.partType,
                            freeStock: product.stock?.freeStock || 0,
                            yourPrice: pricing.unitPrice,
                            bandCode: pricing.bandCode,
                            available: pricing.available,
                            currency: pricing.currency
                        };
                    } catch (error) {
                        if (error instanceof EntitlementError) return null; // Filter out if calculatePrice catches an edge case

                        server.log.warn(`Pricing error for product ${product.productCode}:`, error);
                        return {
                            id: product.id,
                            productCode: product.productCode,
                            description: product.description,
                            partType: product.partType,
                            freeStock: product.stock?.freeStock || 0,
                            yourPrice: null,
                            bandCode: null,
                            available: false,
                            priceError: 'Price unavailable'
                        };
                    }
                })
            );

            // Filter out any nulls (from EntitlementError) and mask sensitive info
            let filteredResults = results.filter(r => r !== null) as any[];

            // In-memory sort by price if requested (only for current page)
            if (sortBy === 'price') {
                filteredResults.sort((a, b) => (a.yourPrice || 0) - (b.yourPrice || 0));
            }

            return reply.status(200).send({
                results: filteredResults,
                count: filteredResults.length,
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

            // Get dealer pricing
            const pricing = await pricingService.calculatePrice(
                request.user.dealerAccountId,
                productCode,
                1
            );

            return reply.status(200).send({
                id: product.id,
                productCode: product.productCode,
                description: product.description,
                partType: product.partType,
                supplier: product.supplier,
                discountCode: product.discountCode,
                freeStock: product.stock?.freeStock || 0,
                yourPrice: pricing.unitPrice,
                bandCode: pricing.bandCode,
                minPriceApplied: pricing.minPriceApplied,
                currency: pricing.currency,
                aliases: product.aliases.map(a => a.aliasValue)
            });

        } catch (error) {
            server.log.error(error);

            if (error instanceof Error && error.message.includes('not found')) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: error.message
                });
            }

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
        if (!request.user?.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'User ID not found'
            });
        }

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            // Find dealer user
            const dealerUser = await prisma.dealerUser.findUnique({
                where: { userId: request.user.userId }
            });

            if (!dealerUser) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Dealer user not found'
                });
            }

            // Get or create cart
            let cart = await prisma.cart.findFirst({
                where: {
                    dealerUserId: dealerUser.id
                },
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

            if (!cart) {
                // Create new cart
                cart = await prisma.cart.create({
                    data: {
                        dealerUserId: dealerUser.id,
                        dealerAccountId: dealerUser.dealerAccountId
                    },
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
            }

            // Calculate pricing for each item
            const itemsWithPricing = await Promise.all(
                cart.items.map(async (item) => {
                    try {
                        const pricing = await pricingService.calculatePrice(
                            request.user!.dealerAccountId!,
                            item.product.productCode,
                            item.qty
                        );

                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            partType: item.product.partType,
                            qty: item.qty,
                            unitPrice: pricing.unitPrice,
                            lineTotal: pricing.totalPrice,
                            bandCode: pricing.bandCode,
                            minPriceApplied: pricing.minPriceApplied,
                            freeStock: item.product.stock?.freeStock || 0
                        };
                    } catch (error) {
                        server.log.warn(`Pricing error for cart item ${item.id}:`, error);
                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            partType: item.product.partType,
                            qty: item.qty,
                            unitPrice: null,
                            lineTotal: null,
                            bandCode: null,
                            minPriceApplied: false,
                            freeStock: item.product.stock?.freeStock || 0,
                            priceError: 'Price unavailable'
                        };
                    }
                })
            );

            const cartTotal = itemsWithPricing.reduce((sum, item) => {
                return sum + (item.lineTotal || 0);
            }, 0);

            return reply.status(200).send({
                cartId: cart.id,
                items: itemsWithPricing,
                itemCount: cart.items.length,
                total: cartTotal,
                currency: 'GBP'
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching cart'
            });
        }
    });

    // POST /dealer/cart/items - Add or update cart item
    server.post('/cart/items', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const bodySchema = z.object({
            productId: z.string().uuid(),
            qty: z.number().int().min(1)
        });

        const validation = bodySchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid request body',
                details: validation.error.issues
            });
        }

        const { productId, qty } = validation.data;

        if (!request.user?.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'User ID not found'
            });
        }

        try {
            // Validate product exists
            const product = await prisma.product.findUnique({
                where: { id: productId }
            });

            if (!product) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Product not found'
                });
            }

            // Find dealer user
            const dealerUser = await prisma.dealerUser.findUnique({
                where: { userId: request.user.userId }
            });

            if (!dealerUser) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Dealer user not found'
                });
            }

            // Get or create cart
            let cart = await prisma.cart.findFirst({
                where: {
                    dealerUserId: dealerUser.id
                }
            });

            if (!cart) {
                cart = await prisma.cart.create({
                    data: {
                        dealerUserId: dealerUser.id,
                        dealerAccountId: dealerUser.dealerAccountId
                    }
                });
            }

            // Check if item already exists in cart
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId
                }
            });

            if (existingItem) {
                // Update quantity
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { qty: existingItem.qty + qty }
                });
            } else {
                // Add new item
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId,
                        qty
                    }
                });
            }

            // Return updated cart (reuse GET cart logic)
            const updatedCart = await prisma.cart.findUnique({
                where: { id: cart.id },
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

            if (!updatedCart) {
                throw new Error('Cart not found after update');
            }

            const itemsWithPricing = await Promise.all(
                updatedCart.items.map(async (item) => {
                    try {
                        const pricing = await pricingService.calculatePrice(
                            request.user!.dealerAccountId!,
                            item.product.productCode,
                            item.qty
                        );

                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: pricing.unitPrice,
                            lineTotal: pricing.totalPrice,
                            bandCode: pricing.bandCode
                        };
                    } catch (error) {
                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: null,
                            lineTotal: null,
                            bandCode: null,
                            priceError: 'Price unavailable'
                        };
                    }
                })
            );

            const cartTotal = itemsWithPricing.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

            return reply.status(200).send({
                cartId: updatedCart.id,
                items: itemsWithPricing,
                itemCount: updatedCart.items.length,
                total: cartTotal,
                currency: 'GBP'
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while adding item to cart'
            });
        }
    });

    // PATCH /dealer/cart/items/:id - Update cart item quantity
    server.patch('/cart/items/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        });

        const bodySchema = z.object({
            qty: z.number().int().min(0)
        });

        const paramsValidation = paramsSchema.safeParse(request.params);
        const bodyValidation = bodySchema.safeParse(request.body);

        if (!paramsValidation.success || !bodyValidation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid request'
            });
        }

        const { id } = paramsValidation.data;
        const { qty } = bodyValidation.data;

        if (!request.user?.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'User ID not found'
            });
        }

        try {
            const cartItem = await prisma.cartItem.findUnique({
                where: { id },
                include: {
                    cart: {
                        include: {
                            dealerUser: true
                        }
                    }
                }
            });

            if (!cartItem) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Cart item not found'
                });
            }

            // Verify ownership
            if (cartItem.cart.dealerUser.userId !== request.user.userId) {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Not authorized to modify this cart item'
                });
            }

            // If qty is 0, delete the item
            if (qty === 0) {
                await prisma.cartItem.delete({
                    where: { id }
                });
            } else {
                // Update quantity
                await prisma.cartItem.update({
                    where: { id },
                    data: { qty }
                });
            }

            // Return updated cart
            const updatedCart = await prisma.cart.findUnique({
                where: { id: cartItem.cartId },
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

            if (!updatedCart) {
                throw new Error('Cart not found');
            }

            const itemsWithPricing = await Promise.all(
                updatedCart.items.map(async (item) => {
                    try {
                        const pricing = await pricingService.calculatePrice(
                            request.user!.dealerAccountId!,
                            item.product.productCode,
                            item.qty
                        );

                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: pricing.unitPrice,
                            lineTotal: pricing.totalPrice,
                            bandCode: pricing.bandCode
                        };
                    } catch (error) {
                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: null,
                            lineTotal: null,
                            bandCode: null,
                            priceError: 'Price unavailable'
                        };
                    }
                })
            );

            const cartTotal = itemsWithPricing.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

            return reply.status(200).send({
                cartId: updatedCart.id,
                items: itemsWithPricing,
                itemCount: updatedCart.items.length,
                total: cartTotal,
                currency: 'GBP'
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while updating cart item'
            });
        }
    });

    // DELETE /dealer/cart/items/:id - Remove cart item
    server.delete('/cart/items/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        });

        const validation = paramsSchema.safeParse(request.params);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid cart item ID'
            });
        }

        const { id } = validation.data;

        if (!request.user?.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'User ID not found'
            });
        }

        try {
            const cartItem = await prisma.cartItem.findUnique({
                where: { id },
                include: {
                    cart: {
                        include: {
                            dealerUser: true
                        }
                    }
                }
            });

            if (!cartItem) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Cart item not found'
                });
            }

            // Verify ownership
            if (cartItem.cart.dealerUser.userId !== request.user.userId) {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Not authorized to delete this cart item'
                });
            }

            // Delete the item
            await prisma.cartItem.delete({
                where: { id }
            });

            // Return updated cart
            const updatedCart = await prisma.cart.findUnique({
                where: { id: cartItem.cartId },
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

            if (!updatedCart) {
                throw new Error('Cart not found');
            }

            const itemsWithPricing = await Promise.all(
                updatedCart.items.map(async (item) => {
                    try {
                        const pricing = await pricingService.calculatePrice(
                            request.user!.dealerAccountId!,
                            item.product.productCode,
                            item.qty
                        );

                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: pricing.unitPrice,
                            lineTotal: pricing.totalPrice,
                            bandCode: pricing.bandCode
                        };
                    } catch (error) {
                        return {
                            id: item.id,
                            productCode: item.product.productCode,
                            description: item.product.description,
                            qty: item.qty,
                            unitPrice: null,
                            lineTotal: null,
                            bandCode: null,
                            priceError: 'Price unavailable'
                        };
                    }
                })
            );

            const cartTotal = itemsWithPricing.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

            return reply.status(200).send({
                cartId: updatedCart.id,
                items: itemsWithPricing,
                itemCount: updatedCart.items.length,
                total: cartTotal,
                currency: 'GBP'
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while deleting cart item'
            });
        }
    });

    // POST /dealer/checkout - Submit cart as order
    server.post('/checkout', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const bodySchema = z.object({
            dispatchMethod: z.string().optional(),
            poRef: z.string().optional(),
            notes: z.string().optional()
        });

        const validation = bodySchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid request body',
                details: validation.error.issues
            });
        }

        const { dispatchMethod, poRef, notes } = validation.data;

        if (!request.user?.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'User ID not found'
            });
        }

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            // 0. CHECK DEALER STATUS
            const dealerAccount = await prisma.dealerAccount.findUnique({
                where: { id: request.user.dealerAccountId },
                select: { status: true }
            });

            if (!dealerAccount) {
                return reply.status(404).send({ error: 'Not Found', message: 'Dealer account not found' });
            }

            if (dealerAccount.status === DealerStatus.SUSPENDED) {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Account suspended. Cannot place order. Please contact customer service team.'
                });
            }

            if (dealerAccount.status === DealerStatus.INACTIVE) {
                return reply.status(403).send({ error: 'Forbidden', message: 'Account inactive' });
            }

            // Find dealer user
            const dealerUser = await prisma.dealerUser.findUnique({
                where: { userId: request.user.userId }
            });

            if (!dealerUser) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Dealer user not found'
                });
            }

            // Get cart with items
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
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Cart is empty'
                });
            }

            // Generate unique order number: ORD-timestamp-random
            const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            // Prepare order lines with current pricing
            const orderLinesData = await Promise.all(
                cart.items.map(async (item) => {
                    // Recalculate price to ensure it's current
                    let pricing;
                    try {
                        pricing = await pricingService.calculatePrice(
                            request.user!.dealerAccountId!,
                            item.product.productCode,
                            item.qty
                        );
                    } catch (error) {
                        server.log.error(`Pricing failed for ${item.product.productCode}`, error);
                        throw new Error(`Pricing unavailable for product ${item.product.productCode}`);
                    }

                    return {
                        productId: item.productId,
                        productCodeSnapshot: item.product.productCode,
                        descriptionSnapshot: item.product.description,
                        partTypeSnapshot: item.product.partType,
                        qty: item.qty,
                        unitPriceSnapshot: pricing.unitPrice,
                        bandCodeSnapshot: pricing.bandCode,
                        minPriceApplied: pricing.minPriceApplied,
                        // Initialize optional status fields
                        shippedQty: 0,
                        backorderedQty: 0
                    };
                })
            );

            // Calculate totals
            const subtotal = orderLinesData.reduce((sum, line) => {
                return sum + (line.unitPriceSnapshot * line.qty);
            }, 0);

            // Use transaction to create order, clear cart, and log action
            const order = await prisma.$transaction(async (tx) => {
                // 1. Create Order
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
                        total: subtotal, // Assuming no tax/shipping logic for now
                        currency: 'GBP',
                        lines: {
                            create: orderLinesData
                        }
                    },
                    include: {
                        lines: true
                    }
                });

                // 2. Clear Cart
                await tx.cartItem.deleteMany({
                    where: { cartId: cart.id }
                });

                // 3. Create Audit Log
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
            if (error.message && error.message.includes('Pricing unavailable')) {
                return reply.status(400).send({
                    error: 'Pricing Error',
                    message: error.message
                });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while creating order'
            });
        }
    });

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
