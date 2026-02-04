import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PartType } from 'db';
import { CheckoutSchema, CartItemSchema } from 'shared';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { dealerService, cartService, orderService } from '../lib/services';

const dealerRoutes: FastifyPluginAsync = async (server) => {
    // GET /dealer/search - Search products with dealer pricing & entitlement filtering
    server.get('/search', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
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

        if (!request.user || request.user.role !== 'DEALER' || !request.user.dealerAccountId) {
            return reply.status(request.user?.role !== 'DEALER' ? 403 : 401).send({
                error: request.user?.role !== 'DEALER' ? 'Forbidden' : 'Unauthorized',
                message: 'Dealer access required'
            });
        }

        try {
            const result = await dealerService.searchProducts(
                request.user.dealerAccountId,
                validation.data
            );

            return reply.status(200).send({
                results: result.results,
                count: result.count,
                query: validation.data.q || null,
                entitlement: result.entitlement,
                status: result.status
            });
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Dealer account not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }
            if (error.message === 'Account inactive') {
                return reply.status(403).send({ error: 'Forbidden', message: error.message });
            }

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

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            const product = await dealerService.getProductDetail(
                request.user.dealerAccountId,
                validation.data.productCode
            );

            return reply.status(200).send(product);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Product not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching product'
            });
        }
    });

    // GET /dealer/backorders - Get backorders for dealer
    server.get('/backorders', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            const backorders = await dealerService.getBackorders(request.user.dealerAccountId);
            return reply.status(200).send({ backorders });
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Dealer account not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching backorders'
            });
        }
    });

    // GET /dealer/cart - Get current cart
    server.get('/cart', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const cart = await cartService.getOrCreateCart(
                request.user.dealerUserId,
                request.user.dealerAccountId
            );

            return reply.status(200).send(cart);
        } catch (error: any) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching cart'
            });
        }
    });

    // POST /dealer/cart/items - Add item to cart
    server.post('/cart/items', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const validation = CartItemSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid cart item data',
                details: validation.error.issues
            });
        }

        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const cart = await cartService.addItem(
                request.user.dealerUserId,
                request.user.dealerAccountId,
                validation.data
            );

            return reply.status(200).send(cart);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Product not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while adding item to cart'
            });
        }
    });

// withAudit(
    // PATCH /dealer/cart/items/:id - Update cart item quantity
    server.patch('/cart/items/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        });

        const bodySchema = z.object({
            qty: z.number().int().positive().max(9999)
        });

        const paramsValidation = paramsSchema.safeParse(request.params);
        const bodyValidation = bodySchema.safeParse(request.body);

        if (!paramsValidation.success || !bodyValidation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid request data'
            });
        }

        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const cart = await cartService.updateItem(
                paramsValidation.data.id,
                request.user.dealerUserId,
                request.user.dealerAccountId,
                bodyValidation.data.qty
            );

            return reply.status(200).send(cart);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Cart item not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while updating cart item'
            });
        }
    });

// withAudit(
    // DELETE /dealer/cart/items/:id - Remove item from cart
// withAudit(
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

        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const cart = await cartService.removeItem(
                validation.data.id,
                request.user.dealerUserId,
                request.user.dealerAccountId
            );

            return reply.status(200).send(cart);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Cart item not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while removing cart item'
            });
        }
    });

// withAudit(
    // DELETE /dealer/cart - Clear cart
// withAudit(
    server.delete('/cart', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const cart = await cartService.clearCart(
                request.user.dealerUserId,
                request.user.dealerAccountId
            );

            return reply.status(200).send(cart);
        } catch (error: any) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while clearing cart'
            });
        }
    });

    // POST /dealer/checkout - Create order from cart
    server.post('/checkout', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const validation = CheckoutSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid checkout data',
                details: validation.error.issues
            });
        }

        if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'User information not found'
            });
        }

        try {
            const order = await orderService.createOrder(
                request.user.dealerUserId,
                request.user.dealerAccountId,
                validation.data
            );

            return reply.status(201).send(order);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Cart is empty') {
                return reply.status(400).send({ error: 'Bad Request', message: error.message });
            }

            if (error.message.includes('not available') || error.message.includes('no price')) {
                return reply.status(400).send({ error: 'Bad Request', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while creating order'
            });
        }
    });

    // GET /dealer/orders - Get order history
    server.get('/orders', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const querySchema = z.object({
            limit: z.coerce.number().int().min(1).max(100).optional().default(20)
        });

        const validation = querySchema.safeParse(request.query);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid query parameters'
            });
        }

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            const orders = await orderService.getOrders(
                request.user.dealerAccountId,
                validation.data.limit
            );

            return reply.status(200).send({ orders });
        } catch (error: any) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching orders'
            });
        }
    });

    // GET /dealer/orders/:id - Get order detail
    server.get('/orders/:id', {
        preHandler: requireAuth
    }, async (request: AuthenticatedRequest, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        });

        const validation = paramsSchema.safeParse(request.params);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid order ID'
            });
        }

        if (!request.user?.dealerAccountId) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Dealer account ID not found'
            });
        }

        try {
            const order = await orderService.getOrderDetail(
                validation.data.id,
                request.user.dealerAccountId
            );

            return reply.status(200).send(order);
        } catch (error: any) {
            server.log.error(error);

            if (error.message === 'Order not found') {
                return reply.status(404).send({ error: 'Not Found', message: error.message });
            }

            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred while fetching order'
            });
        }
    });
};

export default dealerRoutes;
