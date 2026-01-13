import { FastifyInstance } from 'fastify'
import { RequestAggregator } from '../services/aggregator'
import { CacheService } from '../services/cache'
import { verifyToken } from '../middleware/auth'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

export default async function dealerRoutes(fastify: FastifyInstance) {
    const aggregator = new RequestAggregator(BACKEND_URL)
    const cache = new CacheService(fastify.redis)

    // Verify JWT on all routes
    fastify.addHook('preHandler', verifyToken)

    /**
     * CONSOLIDATED ENDPOINT: Get dealer dashboard data
     * Single call that fetches: cart, recent orders, backorders
     */
    fastify.get('/dashboard', async (request, reply) => {
        const { userId, dealerAccountId } = request.user as any
        const authToken = request.headers.authorization?.split(' ')[1]

        // Check cache first
        const cacheKey = cache.generateKey(userId, 'GET', '/dealer/dashboard')
        const cached = await cache.get(cacheKey)
        if (cached) {
            return reply.send({ ...cached, cached: true })
        }

        // Aggregate multiple calls
        const results = await aggregator.aggregate(
            [
                {
                    key: 'cart',
                    method: 'GET',
                    url: '/dealer/cart',
                },
                {
                    key: 'recentOrders',
                    method: 'GET',
                    url: '/dealer/orders?limit=5',
                },
                {
                    key: 'backorders',
                    method: 'GET',
                    url: '/dealer/backorders',
                },
                {
                    key: 'account',
                    method: 'GET',
                    url: `/dealer/account/${dealerAccountId}`,
                },
            ],
            authToken
        )

        // Consolidate response
        const response = {
            cart: results.cart.success ? results.cart.data : null,
            recentOrders: results.recentOrders.success ? results.recentOrders.data : [],
            backorders: results.backorders.success ? results.backorders.data : [],
            account: results.account.success ? results.account.data : null,
            errors: Object.entries(results)
                .filter(([_, v]) => !v.success)
                .map(([k, v]) => ({ endpoint: k, error: v.error })),
        }

        // Cache for 5 minutes
        await cache.set(cacheKey, response, 300)

        return response
    })

    /**
     * CONSOLIDATED ENDPOINT: Search with pricing and availability
     * Single call that includes product search + pricing + stock
     */
    fastify.get('/search', async (request, reply) => {
        const { q, partType, inStockOnly } = request.query as any
        const { userId } = request.user as any
        const authToken = request.headers.authorization?.split(' ')[1]

        // Check cache
        const cacheKey = cache.generateKey(userId, 'GET', '/dealer/search', { q, partType, inStockOnly })
        const cached = await cache.get(cacheKey)
        if (cached) {
            return reply.send({ ...cached, cached: true })
        }

        // Forward to backend (already consolidated there)
        const aggregator = new RequestAggregator(BACKEND_URL)
        const results = await aggregator.aggregate(
            [
                {
                    key: 'search',
                    method: 'GET',
                    url: `/dealer/search?q=${q}&partType=${partType || ''}&inStockOnly=${inStockOnly || ''}`,
                },
            ],
            authToken
        )

        if (results.search.success) {
            // Cache search results for 2 minutes
            await cache.set(cacheKey, results.search.data, 120)
            return results.search.data
        }

        return reply.code(results.search.status).send({
            error: results.search.error,
        })
    })

    /**
     * CONSOLIDATED ENDPOINT: Add to cart + get updated cart + pricing
     */
    fastify.post('/cart/add', async (request, reply) => {
        const { productId, qty } = request.body as any
        const { userId } = request.user as any
        const authToken = request.headers.authorization?.split(' ')[1]

        // Invalidate cart cache
        await cache.invalidate(`cache:${userId}:*cart*`)

        // Add to cart and fetch updated cart in one go
        const results = await aggregator.aggregateWithDependencies(
            [
                {
                    key: 'addToCart',
                    method: 'POST',
                    url: '/dealer/cart/items',
                    data: { productId, qty },
                },
                {
                    key: 'updatedCart',
                    method: 'GET',
                    url: '/dealer/cart',
                    dependsOn: 'addToCart', // Only fetch if add succeeded
                },
            ],
            authToken
        )

        if (results.addToCart.success) {
            return {
                success: true,
                message: 'Item added to cart',
                cart: results.updatedCart.data,
            }
        }

        return reply.code(results.addToCart.status).send({
            success: false,
            error: results.addToCart.error,
        })
    })

    /**
     * CONSOLIDATED ENDPOINT: Checkout with validation + order creation
     */
    fastify.post('/checkout', async (request, reply) => {
        const checkoutData = request.body
        const { userId } = request.user as any
        const authToken = request.headers.authorization?.split(' ')[1]

        // Invalidate all caches for this user
        await cache.invalidate(`cache:${userId}:*`)

        // Execute checkout
        const results = await aggregator.aggregateWithDependencies(
            [
                {
                    key: 'checkout',
                    method: 'POST',
                    url: '/dealer/checkout',
                    data: checkoutData,
                },
                {
                    key: 'newOrder',
                    method: 'GET',
                    url: '/dealer/orders?limit=1',
                    dependsOn: 'checkout',
                },
            ],
            authToken
        )

        if (results.checkout.success) {
            return {
                success: true,
                message: 'Order placed successfully',
                order: results.checkout.data,
            }
        }

        return reply.code(results.checkout.status).send({
            success: false,
            error: results.checkout.error,
            details: results.checkout.data,
        })
    })
}
