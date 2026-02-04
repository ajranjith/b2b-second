import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import * as jwt from '@fastify/jwt';

// Declare decoration types
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
    }
}

const authPlugin: FastifyPluginAsync = async (fastify, options) => {
    // Register JWT plugin
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        sign: { expiresIn: '24h' }
    });

    fastify.decorate('authenticate', async function (request: any, reply: any) {
        try {
            // Verify JWT token from Authorization header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify and decode the token
            const decoded = fastify.jwt.verify(token);
            (request as any).user = decoded;
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized', message: (err as Error).message });
        }
    });
};

export default fp(authPlugin);
