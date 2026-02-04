import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

const metricsPlugin: FastifyPluginAsync = async (fastify, options) => {
    fastify.get('/metrics', async (request, reply) => {
        // Placeholder for Prometheus metrics
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    });
};

export default fp(metricsPlugin);
