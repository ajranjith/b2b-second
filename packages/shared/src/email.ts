import nodemailer from 'nodemailer';
import { PrismaClient } from 'db';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env in the same package
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EMAIL_HOST = process.env.EMAIL_HOST || '127.0.0.1';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '1025', 10);
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hotbray.com';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/hotbray?schema=public';

export class EmailService {
    private transporter: nodemailer.Transporter;
    private prisma: PrismaClient;

    constructor(prisma?: PrismaClient) {
        if (prisma) {
            this.prisma = prisma;
        } else {
            const pool = new Pool({ connectionString: DATABASE_URL });
            const adapter = new PrismaPg(pool);
            this.prisma = new PrismaClient({ adapter } as any);
        }
        this.transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: false, // MailHog usually doesn't use SSL
            ignoreTLS: true,
            connectionTimeout: 5000
        });
    }

    private async logEmail(recipient: string, subject: string, bodyText: string, status: string, errorMessage?: string): Promise<string> {
        const log = await this.prisma.emailLog.create({
            data: {
                recipientEmail: recipient,
                subject,
                bodyText,
                status,
                errorMessage,
                sentAt: new Date()
            }
        });
        return log.id;
    }

    async sendWelcomeEmail(email: string, firstName: string, password: string): Promise<boolean> {
        const subject = 'Welcome to HotBray Portal';
        const bodyText = `Welcome to HotBray Portal, ${firstName}. Your account has been created successfully.\n\nLogin: ${email}\nPassword: ${password}\n\nPlease change your password after your first login.`;

        try {
            await this.transporter.sendMail({
                from: EMAIL_FROM,
                to: email,
                subject,
                text: bodyText
            });

            await this.logEmail(email, subject, bodyText, 'SENT');
            return true;
        } catch (error: any) {
            console.error('Failed to send welcome email:', error);
            await this.logEmail(email, subject, bodyText, 'FAILED', error.message || String(error));
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, firstName: string, newPassword: string): Promise<boolean> {
        const subject = 'Password Reset Notification';
        const bodyText = `Hello ${firstName},\n\nYour password has been reset. Your new temporary password is: ${newPassword}\n\nPlease change it as soon as you log in.`;

        try {
            await this.transporter.sendMail({
                from: EMAIL_FROM,
                to: email,
                subject,
                text: bodyText
            });

            await this.logEmail(email, subject, bodyText, 'SENT');
            return true;
        } catch (error: any) {
            console.error('Failed to send password reset email:', error);
            await this.logEmail(email, subject, bodyText, 'FAILED', error.message || String(error));
            return false;
        }
    }

    async sendAccountSuspendedNotification(email: string, firstName: string): Promise<boolean> {
        const subject = 'Account Suspended';
        const bodyText = `Hello ${firstName},\n\nYour HotBray Portal account has been suspended. Please contact customer service for more information or to resolve this issue.`;

        try {
            await this.transporter.sendMail({
                from: EMAIL_FROM,
                to: email,
                subject,
                text: bodyText
            });

            await this.logEmail(email, subject, bodyText, 'SENT');
            return true;
        } catch (error: any) {
            console.error('Failed to send account suspension notification:', error);
            await this.logEmail(email, subject, bodyText, 'FAILED', error.message || String(error));
            return false;
        }
    }
}
