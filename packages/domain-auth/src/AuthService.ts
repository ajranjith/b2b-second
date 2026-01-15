import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken, JWTPayload } from './jwt';

export interface LoginResult {
    token: string;
    user: {
        id: string;
        email: string;
        role: UserRole;
        dealerAccountId?: string;
        companyName?: string;
    };
}

export class AuthService {
    constructor(private prisma: PrismaClient) { }

    async login(email: string, password: string): Promise<LoginResult> {
        const user = await this.prisma.appUser.findUnique({
            where: { email },
            include: {
                dealerUser: {
                    include: {
                        dealerAccount: true
                    }
                }
            }
        });

        if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        if (user.role === UserRole.DEALER && user.dealerUser) {
            payload.dealerAccountId = user.dealerUser.dealerAccountId;
        }

        const token = generateToken(payload);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role as UserRole,
                dealerAccountId: payload.dealerAccountId,
                companyName: user.dealerUser?.dealerAccount?.companyName
            }
        };
    }
}
