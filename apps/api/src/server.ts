import Fastify from 'fastify';
import { prisma } from 'db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Import Routes
import dealerRoutes from './routes/dealer';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });

const server = Fastify({ logger: true });

// --- Middleware / Hooks ---

// Simple Audit Hook (can be refined to specific routes)
server.addHook('onSend', async (request, reply, payload) => {
    // Only audit State-changing methods for now or specific paths
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        // In a real app, extracting User ID from Auth header/session
        const actorUserId = (request.headers['x-user-id'] as string) || null;

        await prisma.auditLog.create({
            data: {
                actorType: actorUserId ? 'DEALER' : 'SYSTEM',
                actorUserId,
                action: request.method,
                entityType: 'API_ROUTE',
                entityId: request.url,
                beforeJson: (request.body as any) || {},
                afterJson: { statusCode: reply.statusCode },
                ipAddress: request.ip
            }
        }).catch(err => server.log.error(err));
    }
});

// --- Register Routes ---
server.register(authRoutes, { prefix: '/auth' });
server.register(dealerRoutes, { prefix: '/dealer' });
server.register(adminRoutes, { prefix: '/admin' });


// Start
const start = async () => {
    try {
        // Verify database connection
        const result = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
        console.log("API connected to DB:", result[0]?.current_database);

        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3001');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
