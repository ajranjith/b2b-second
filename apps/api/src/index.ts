import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

// Create Fastify instance
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

// Register CORS
server.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    reply.status(error.statusCode || 500).send({
        error: {
            message: error.message || 'Internal Server Error',
            statusCode: error.statusCode || 500
        }
    });
});

// Health check endpoint
server.get('/health', async (request, reply) => {
    return { status: 'ok' };
});

// Register route modules
// Note: These will be created in subsequent steps
const registerRoutes = async () => {
    try {
        // Auth routes
        await server.register(import('./routes/auth'), { prefix: '/auth' });

        // Dealer routes
        await server.register(import('./routes/dealer'), { prefix: '/dealer' });

        // Admin routes
        // await server.register(import('./routes/admin'), { prefix: '/admin' });

        server.log.info('Routes registered successfully');
    } catch (error) {
        server.log.error('Error registering routes:', error);
        throw error;
    }
};

// Start server
const start = async () => {
    try {
        await registerRoutes();

        await server.listen({ port: PORT, host: HOST });

        server.log.info(`🚀 Server listening on http://localhost:${PORT}`);
        server.log.info(`📊 Health check: http://localhost:${PORT}/health`);
        server.log.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not set'}`);
        server.log.info(`💾 Database: ${process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
    server.log.info('Received shutdown signal, closing server...');
    await server.close();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
start();
