import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

const loggerPlugin: FastifyPluginAsync = async (fastify, options) => {
    // Fastify has a built-in logger, but we can add hooks here
    fastify.addHook('onRequest', async (request) => {
        // Custom logging logic if needed
        // fastify.log.info({ extra: 'info' }, 'Custom log hook');
    });
};

export default fp(loggerPlugin);
