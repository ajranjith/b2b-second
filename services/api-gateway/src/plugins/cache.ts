import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyRedis from '@fastify/redis';

const cachePlugin: FastifyPluginAsync = async (fastify, options) => {
    if (process.env.REDIS_URL) {
        await fastify.register(fastifyRedis, { url: process.env.REDIS_URL });
        fastify.log.info('Redis connected');
    } else {
        fastify.log.warn('REDIS_URL not set, caching disabled');
    }
};

export default fp(cachePlugin);
