import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from 'db';
import { generateToken, JWTPayload } from '../lib/auth';

const authRoutes: FastifyPluginAsync = async (server) => {
    // POST /auth/login
    server.post('/login', async (request, reply) => {
        // Validate request body
        const loginSchema = z.object({
            email: z.string().email(),
            password: z.string().min(1)
        });

        const validation = loginSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: 'Invalid email or password format',
                details: validation.error.issues
            });
        }

        const { email, password } = validation.data;

        try {
            // Find user by email
            const user = await prisma.appUser.findUnique({
                where: { email },
                include: {
                    dealerUser: {
                        include: {
                            dealerAccount: true
                        }
                    }
                }
            });

            if (!user) {
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Account is inactive'
                });
            }

            // Compare password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

            if (!isPasswordValid) {
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Build JWT payload
            const payload: JWTPayload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };

            // If user is a dealer, include dealerAccountId
            if (user.role === 'DEALER' && user.dealerUser) {
                payload.dealerAccountId = user.dealerUser.dealerAccountId;
            }

            // Generate token
            const token = generateToken(payload);

            // Return response
            return reply.status(200).send({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    dealerAccountId: payload.dealerAccountId,
                    companyName: user.dealerUser?.dealerAccount?.companyName
                }
            });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred during login'
            });
        }
    });

    // GET /auth/me - Get current user info (requires authentication)
    server.get('/me', async (request, reply) => {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }

        try {
            const { verifyToken } = await import('../lib/auth');
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            return reply.status(200).send({
                user: decoded
            });
        } catch (error) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }
    });
};

export default authRoutes;
