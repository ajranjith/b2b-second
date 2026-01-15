import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hotbray-key';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Find user
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

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                adminRole: user.adminRole,
                dealerAccountId: user.dealerUser?.dealerAccountId,
                dealerUserId: user.dealerUser?.id
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                adminRole: user.adminRole,
                dealerInfo: user.dealerUser ? {
                    firstName: user.dealerUser.firstName,
                    lastName: user.dealerUser.lastName,
                    companyName: user.dealerUser.dealerAccount.companyName
                } : null
            }
        });
    } catch (error: any) {
        console.error('💥 [Auth API] Login failed:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
