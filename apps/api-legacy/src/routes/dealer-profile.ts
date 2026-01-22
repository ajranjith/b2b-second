import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../lib/auth";

const prisma = new PrismaClient();

/**
 * Dealer profile management routes
 */
const dealerProfileRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /dealer/profile
   * Get dealer profile information
   */
  fastify.get(
    "/profile",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerUserId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const dealerUser = await prisma.dealerUser.findUnique({
          where: { id: user.dealerUserId },
          include: {
            user: {
              select: {
                email: true,
                isActive: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            dealerAccount: {
              select: {
                accountNo: true,
                companyName: true,
                status: true,
                entitlement: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        });

        if (!dealerUser) {
          return reply.code(404).send({ error: "Dealer profile not found" });
        }

        return reply.send({
          id: dealerUser.id,
          firstName: dealerUser.firstName,
          lastName: dealerUser.lastName,
          email: dealerUser.user.email,
          defaultShippingMethod: dealerUser.defaultShippingMethod,
          mustChangePassword: dealerUser.user.mustChangePassword,
          isActive: dealerUser.user.isActive,
          account: {
            accountNo: dealerUser.dealerAccount.accountNo,
            companyName: dealerUser.dealerAccount.companyName,
            status: dealerUser.dealerAccount.status,
            entitlement: dealerUser.dealerAccount.entitlement,
            notes: dealerUser.dealerAccount.notes,
          },
          createdAt: dealerUser.user.createdAt,
          updatedAt: dealerUser.updatedAt,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch profile" });
      }
    },
  );

  /**
   * PUT /dealer/profile
   * Update dealer profile (name, email)
   * Enforces unique email constraint
   */
  fastify.put(
    "/profile",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const updateSchema = z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        defaultShippingMethod: z.string().max(50).optional(),
      });

      const validation = updateSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerUserId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      const { firstName, lastName, email, defaultShippingMethod } = validation.data;

      try {
        const dealerUser = await prisma.dealerUser.findUnique({
          where: { id: user.dealerUserId },
          include: { user: true },
        });

        if (!dealerUser) {
          return reply.code(404).send({ error: "Dealer profile not found" });
        }

        // Check email uniqueness if email is being updated
        if (email && email !== dealerUser.user.email) {
          const existingUser = await prisma.appUser.findUnique({
            where: { email: email.toLowerCase().trim() },
          });

          if (existingUser) {
            return reply.code(409).send({
              error: "Email already in use",
              message: "This email address is already registered",
            });
          }
        }

        // Update in transaction
        const updated = await prisma.$transaction(async (tx) => {
          // Update DealerUser
          const updatedDealerUser = await tx.dealerUser.update({
            where: { id: user.dealerUserId },
            data: {
              firstName: firstName ?? undefined,
              lastName: lastName ?? undefined,
              defaultShippingMethod: defaultShippingMethod ?? undefined,
              updatedAt: new Date(),
            },
          });

          // Update AppUser email if provided
          if (email) {
            await tx.appUser.update({
              where: { id: dealerUser.userId },
              data: {
                email: email.toLowerCase().trim(),
                updatedAt: new Date(),
              },
            });
          }

          return updatedDealerUser;
        });

        return reply.send({
          success: true,
          message: "Profile updated successfully",
          profile: {
            id: updated.id,
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: email || dealerUser.user.email,
            defaultShippingMethod: updated.defaultShippingMethod,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);

        if (error.code === "P2002") {
          return reply.code(409).send({
            error: "Unique constraint violation",
            message: "Email already in use",
          });
        }

        return reply.code(500).send({ error: "Failed to update profile" });
      }
    },
  );

  /**
   * POST /dealer/password/change
   * Change password (requires current password)
   */
  fastify.post(
    "/password/change",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const changePasswordSchema = z
        .object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(8).max(100),
          confirmPassword: z.string().min(8).max(100),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });

      const validation = changePasswordSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.id) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = validation.data;

      try {
        const appUser = await prisma.appUser.findUnique({
          where: { id: user.id },
        });

        if (!appUser) {
          return reply.code(404).send({ error: "User not found" });
        }

        // Verify current password
        const bcrypt = require("bcrypt");
        const isValid = await bcrypt.compare(currentPassword, appUser.passwordHash);

        if (!isValid) {
          return reply.code(401).send({
            error: "Invalid current password",
            message: "The current password you entered is incorrect",
          });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.appUser.update({
          where: { id: user.id },
          data: {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
            updatedAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to change password" });
      }
    },
  );
};

export default dealerProfileRoutes;
