import { Redis } from 'ioredis'

export class CacheService {
    private redis: Redis

    constructor(redisClient: Redis) {
        this.redis = redisClient
    }

    /**
     * Get cached response
     */
    async get(key: string): Promise<any | null> {
        const cached = await this.redis.get(key)
        return cached ? JSON.parse(cached) : null
    }

    /**
     * Set cached response with TTL
     */
    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidate(pattern: string): Promise<void> {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
            await this.redis.del(...keys)
        }
    }

    /**
     * Generate cache key from request
     */
    generateKey(
        userId: string,
        method: string,
        url: string,
        queryParams?: any
    ): string {
        const params = queryParams ? JSON.stringify(queryParams) : ''
        return `cache:${userId}:${method}:${url}:${params}`
    }
}
