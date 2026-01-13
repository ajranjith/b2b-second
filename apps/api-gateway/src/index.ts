import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import redis from '@fastify/redis'
import dotenv from 'dotenv'
import loggerPlugin from './plugins/logger'
// import metricsPlugin from './plugins/metrics' // Replaced by middleware
import { metricsRequest, metricsResponse, getMetrics } from './middleware/metrics'
import dealerRoutes from './routes/dealer'
import adminRoutes from './routes/admin'

// Load environment
dotenv.config()

const fastify = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
})

// Security headers
fastify.register(helmet)

// CORS
fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
})

// Redis for caching and rate limiting
fastify.register(redis, {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
})

// Rate limiting
fastify.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    redis: fastify.redis,
    keyGenerator: (request) => {
        // Rate limit per user
        return (request.headers['authorization'] as string) || request.ip
    },
})

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.register(dealerRoutes, { prefix: '/api/dealer' })
fastify.register(adminRoutes, { prefix: '/api/admin' })

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.GATEWAY_PORT || '8080')
        await fastify.listen({ port, host: '0.0.0.0' })
        console.log(`🚀 API Gateway running on http://localhost:${port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
