
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { prisma, ImportType, ImportStatus, UserRole } from 'db';
import { PricingService, CartRules, CheckoutRules } from 'rules';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });

const server = Fastify({ logger: true });

// Services
const pricingService = new PricingService(prisma);
const cartRules = new CartRules(pricingService);
const checkoutRules = new CheckoutRules(pricingService);

// --- Middleware / Hooks ---

// Simple Audit Hook (can be refined to specific routes)
server.addHook('onSend', async (request, reply, payload) => {
    // Only audit State-changing methods for now or specific paths
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        // In a real app, extracting User ID from Auth header/session
        const actorUserId = (request.headers['x-user-id'] as string) || null;

        await prisma.auditLog.create({
            data: {
                actorType: actorUserId ? 'DEALER' : 'SYSTEM',
                actorUserId,
                action: request.method,
                entityType: 'API_ROUTE',
                entityId: request.url,
                beforeJson: (request.body as any) || {},
                afterJson: { statusCode: reply.statusCode },
                ipAddress: request.ip
            }
        }).catch(err => server.log.error(err));
    }
});

// --- Routes ---

// 1. Dealer Routes

// Search Products (with pricing)
server.get('/dealer/search', async (req, reply) => {
    const querySchema = z.object({
        q: z.string().optional(),
        dealerAccountId: z.string() // Mocking auth by passing ID
    });

    const { q, dealerAccountId } = querySchema.parse(req.query);

    // Naive search
    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            OR: [
                { productCode: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
            ]
        },
        take: 20
    });

    // Calculate Price for each
    const results = await Promise.all(products.map(async (p) => {
        try {
            return await pricingService.calculatePrice(dealerAccountId, p.productCode, 1);
        } catch (e) {
            return { productCode: p.productCode, error: 'Price unavailble' };
        }
    }));

    return results;
});

// Get Cart
server.get('/dealer/cart', async (req, reply) => {
    const { dealerUserId } = req.query as { dealerUserId: string }; // Mock Auth
    if (!dealerUserId) return reply.code(400).send("Missing dealerUserId");

    // Naive implementation: fetch cart or create
    let cart = await prisma.cart.findUnique({
        where: { dealerUserId },
        include: { items: true }
    });

    if (!cart) {
        // Find account from user
        const dealerUser = await prisma.dealerUser.findUnique({ where: { id: dealerUserId } });
        if (!dealerUser) return reply.code(404).send("User not found");

        cart = await prisma.cart.create({
            data: {
                dealerUserId,
                dealerAccountId: dealerUser.dealerAccountId
            },
            include: { items: true }
        });
    }

    // Calculate Totals using Rules Engine
    const cartItems = cart.items.map(i => ({ productCode: i.productId, qty: i.qty }));
    // Wait... CartItem stores productId, PricingService needs ProductCode. 
    // Should fix data model or fetch params.
    // Fetching product codes:
    const itemsWithCodes = await Promise.all(cart.items.map(async (item) => {
        const p = await prisma.product.findUnique({ where: { id: item.productId } });
        return { productCode: p!.productCode, qty: item.qty };
    }));

    const totals = await cartRules.calculateCartTotals(cart.dealerAccountId, itemsWithCodes);
    return { cart, totals };
});


// Add to Cart
server.post('/dealer/cart/items', async (req, reply) => {
    const bodySchema = z.object({
        dealerUserId: z.string(),
        productCode: z.string(),
        qty: z.number().min(1)
    });
    const { dealerUserId, productCode, qty } = bodySchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { productCode } });
    if (!product) return reply.code(404).send("Product not found");

    // Find Cart
    let cart = await prisma.cart.findUnique({ where: { dealerUserId } });
    if (!cart) {
        const dealerUser = await prisma.dealerUser.findUnique({ where: { id: dealerUserId } });
        if (!dealerUser) return reply.code(404).send("User not found");
        cart = await prisma.cart.create({
            data: { dealerUserId, dealerAccountId: dealerUser.dealerAccountId }
        });
    }

    // Upsert Item
    const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } }
    });

    if (existing) {
        await prisma.cartItem.update({
            where: { id: existing.id },
            data: { qty: existing.qty + qty }
        });
    } else {
        await prisma.cartItem.create({
            data: { cartId: cart.id, productId: product.id, qty }
        });
    }

    return { success: true };
});

// Checkout
server.post('/dealer/checkout', async (req, reply) => {
    const bodySchema = z.object({
        dealerUserId: z.string()
    });
    const { dealerUserId } = bodySchema.parse(req.body);

    const cart = await prisma.cart.findUnique({ where: { dealerUserId }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) return reply.code(400).send("Empty cart");

    // Prepare items for Rules
    const lineItems = cart.items.map(i => ({ productCode: i.product.productCode, qty: i.qty }));

    // Use CheckoutRules to generate snapshot
    const orderData = await checkoutRules.createOrderSnapshot(cart.dealerAccountId, dealerUserId, lineItems);

    // Save Order Transactionally
    const order = await prisma.$transaction(async (tx) => {
        // Create Header
        const header = await tx.orderHeader.create({
            data: {
                dealerAccountId: orderData.dealerAccountId,
                dealerUserId: orderData.dealerUserId,
                orderNo: `ORD-${Date.now()}`, // Simple generator
                status: 'SUSPENDED',
                subtotal: orderData.subtotal,
                total: orderData.total,
                currency: orderData.currency
            }
        });

        // Create Lines
        for (const line of orderData.lines) {
            const prod = await tx.product.findUnique({ where: { productCode: line.productCode } });
            await tx.orderLine.create({
                data: {
                    orderId: header.id,
                    productId: prod!.id,
                    productCodeSnapshot: line.productCode,
                    descriptionSnapshot: line.description || '',
                    partTypeSnapshot: prod!.partType,
                    qty: line.qty,
                    unitPriceSnapshot: line.unitPrice,
                    bandCodeSnapshot: line.bandCode || 'N/A',
                    minPriceApplied: line.minPriceApplied
                }
            });
        }

        // Clear Cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return header;
    });

    return order;
});

// Backorders
server.get('/dealer/backorders', async (req, reply) => {
    // Return lines from the active dataset
    const activeDataset = await prisma.backorderDataset.findFirst({
        where: { isActive: true },
        include: { lines: true }
    });

    if (!activeDataset) return { message: "No active backorder report available" };

    // In a real app we would filter by dealer Account No
    // req.query.accountNo
    const { accountNo } = req.query as { accountNo?: string };
    if (accountNo) {
        return activeDataset.lines.filter(l => l.accountNo === accountNo);
    }

    return activeDataset.lines;
});


// 2. Admin Routes

server.get('/admin/imports', async () => {
    return await prisma.importBatch.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50
    });
});

server.post('/admin/dealers', async (req, reply) => {
    // Create dealer logic
    const data = req.body as any; // Zod header needed
    const dealer = await prisma.dealerAccount.create({ data });
    return dealer;
});

// Start
const start = async () => {
    try {
        // Verify database connection
        const result = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
        console.log("API connected to DB:", result[0]?.current_database);

        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3001');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
