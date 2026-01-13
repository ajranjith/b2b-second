import { FastifyPluginAsync } from 'fastify';
import { ROUTES } from '../config/routes';

const adminRoutes: FastifyPluginAsync = async (fastify, options) => {
    fastify.get('/users', async (request, reply) => {
        return { message: 'Admin users proxy' };
    });

    fastify.get('/dashboard', async (request, reply) => {
        return { message: 'Admin dashboard proxy' };
    });
};

export default adminRoutes;
