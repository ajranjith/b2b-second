import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from 'db';

// Static Route Imports (Fixes the "Stuck" issue with dynamic imports)
import authRoutes from './routes/auth';
import dealerRoutes from './routes/dealer';
import adminRoutes from './routes/admin';

// Load environment variables from db package
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

const server = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    }
});

// Register CORS Middleware
server.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
});

// Register Multipart for file uploads
server.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Audit Logging Hook (From server.ts)
// Logs all state-changing operations for compliance and debugging
server.addHook('onSend', async (request, reply, payload) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && reply.statusCode < 400) {
        const actorUserId = (request as any).user?.userId || null;

        // Fire and forget audit log to prevent blocking response
        prisma.auditLog.create({
            data: {
                actorType: actorUserId ? 'DEALER' : 'SYSTEM',
                actorUserId,
                action: request.method,
                entityType: 'API_ROUTE',
                entityId: request.url,
                // Safe body capture (exclude sensitive fields in production)
                beforeJson: (request.body as any) || {},
                afterJson: { statusCode: reply.statusCode },
                ipAddress: request.ip
            }
        }).catch(err => server.log.error(`Audit Log Error: ${err.message}`));
    }
});

// Process-level error handling to catch unexpected crashes
process.on('uncaughtException', (err: Error) => {
    console.error('CRITICAL: Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    console.error('CRITICAL: Unhandled Rejection at:', reason);
});

// Global error handler
server.setErrorHandler((err: Error, request, reply) => {
    server.log.error(err);

    reply.status((err as any).statusCode || 500).send({
        error: {
            message: err.message || 'Internal Server Error',
            statusCode: (err as any).statusCode || 500
        }
    });
});

// Health check endpoint with database verification
server.get('/health', async () => {
    try {
        // Verify database connection
        const result = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
        return {
            status: 'ok',
            database: 'connected',
            dbName: result[0]?.current_database
        };
    } catch (error) {
        return {
            status: 'degraded',
            database: 'disconnected',
            error: (error as Error).message
        };
    }
});

// Register Routes (Static registration for better type safety and reliability)
const registerRoutes = async () => {
    try {
        await server.register(authRoutes, { prefix: '/auth' });
        await server.register(dealerRoutes, { prefix: '/dealer' });
        await server.register(adminRoutes, { prefix: '/admin' });
        server.log.info('✅ Routes registered successfully');
    } catch (error: any) {
        server.log.error('❌ Error registering routes: ' + (error?.message || String(error)));
        process.exit(1);
    }
};

// Start server
const start = async () => {
    try {
        // Verify database connection before starting
        const dbCheck = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
        server.log.info(`💾 Database connected: ${dbCheck[0]?.current_database}`);

        // Register all routes
        await registerRoutes();

        // Start listening
        await server.listen({ port: PORT, host: HOST });

        server.log.info(`🚀 Server listening on http://localhost:${PORT}`);
        server.log.info(`📊 Health check: http://localhost:${PORT}/health`);
        server.log.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not set'}`);
        server.log.info(`📝 Audit logging: ✓ Enabled`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

// Graceful Shutdown
const gracefulShutdown = async () => {
    server.log.info('Received shutdown signal, closing server...');
    await server.close();
    await prisma.$disconnect();
    server.log.info('Server closed gracefully');
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
start();
