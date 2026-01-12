import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    dealerAccountId?: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
    user?: JWTPayload;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h'
    });
}

/**
 * Fastify hook to require authentication
 * Checks Authorization header for Bearer token
 */
export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyToken(token);

        // Attach user to request
        request.user = decoded;
    } catch (error) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid token'
        });
    }
}

/**
 * Fastify hook to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
    return async (request: AuthenticatedRequest, reply: FastifyReply) => {
        // First ensure user is authenticated
        await requireAuth(request, reply);

        if (!request.user) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }
    };
}
