import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Password reset routes
 */
const authPasswordRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/forgot-password
   * Request password reset link
   */
  fastify.post('/forgot-password', async (request, reply) => {
    const forgotPasswordSchema = z.object({
      email: z.string().email()
    });

    const validation = forgotPasswordSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Find user by email
      const user = await prisma.appUser.findUnique({
        where: { email: normalizedEmail }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        fastify.log.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
        return reply.send({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        fastify.log.warn(`Password reset requested for inactive user: ${normalizedEmail}`);
        return reply.send({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await prisma.appUser.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpiry,
          updatedAt: new Date()
        }
      });

      // Generate reset URL
      const resetUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // TODO: Send email with reset link
      // For dev/testing, log the reset link
      fastify.log.info(`Password reset link for ${normalizedEmail}: ${resetUrl}`);

      // In production, send email:
      // await emailService.sendPasswordResetEmail(normalizedEmail, resetUrl);

      return reply.send({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
        // DEV ONLY: Return token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to process password reset request' });
    }
  });

  /**
   * POST /auth/reset-password
   * Reset password using token
   */
  fastify.post('/reset-password', async (request, reply) => {
    const resetPasswordSchema = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8).max(100),
      confirmPassword: z.string().min(8).max(100)
    }).refine(data => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    });

    const validation = resetPasswordSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const { token, newPassword } = validation.data;

    try {
      // Hash token to match stored value
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await prisma.appUser.findFirst({
        where: {
          resetToken: resetTokenHash,
          resetTokenExpiry: { gte: new Date() }
        }
      });

      if (!user) {
        return reply.code(400).send({
          error: 'Invalid or expired reset token',
          message: 'The password reset link is invalid or has expired. Please request a new one.'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await prisma.appUser.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
          updatedAt: new Date()
        }
      });

      fastify.log.info(`Password reset successful for user: ${user.email}`);

      return reply.send({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to reset password' });
    }
  });

  /**
   * POST /auth/verify-reset-token
   * Verify if reset token is valid (optional endpoint for UX)
   */
  fastify.post('/verify-reset-token', async (request, reply) => {
    const verifyTokenSchema = z.object({
      token: z.string().min(1)
    });

    const validation = verifyTokenSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const { token } = validation.data;

    try {
      // Hash token to match stored value
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await prisma.appUser.findFirst({
        where: {
          resetToken: resetTokenHash,
          resetTokenExpiry: { gte: new Date() }
        },
        select: {
          email: true,
          resetTokenExpiry: true
        }
      });

      if (!user) {
        return reply.code(400).send({
          valid: false,
          error: 'Invalid or expired reset token'
        });
      }

      return reply.send({
        valid: true,
        email: user.email,
        expiresAt: user.resetTokenExpiry
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to verify token' });
    }
  });
};

export default authPasswordRoutes;
