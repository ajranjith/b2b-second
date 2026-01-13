import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/rateLimit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify, options) => {
    await fastify.register(rateLimit, {
        global: true,
        ...RATE_LIMIT_CONFIG.global
    });
};

export default fp(rateLimitPlugin);
