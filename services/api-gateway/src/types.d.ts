import 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user?: string | object;
        startTime?: number; // For metrics
    }
}
