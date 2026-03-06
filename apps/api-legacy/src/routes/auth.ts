import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "db";
import { generateToken, JWTPayload } from "../lib/auth";

const authRoutes: FastifyPluginAsync = async (server) => {
  // POST /auth/login
  server.post("/login", async (request, reply) => {
    // Validate request body
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const validation = loginSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid email or password format",
        details: validation.error.issues,
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
              dealerAccount: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid email or password",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Account is inactive",
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid email or password",
        });
      }

      // Build JWT payload
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      // If user is a dealer, include dealerAccountId
      if (user.role === "DEALER" && user.dealerUser) {
        payload.dealerAccountId = user.dealerUser.dealerAccountId;
        payload.dealerUserId = user.dealerUser.id;
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
          mustChangePassword: user.mustChangePassword,
          dealerAccountId: payload.dealerAccountId,
          dealerUserId: payload.dealerUserId,
          companyName: user.dealerUser?.dealerAccount?.companyName,
        },
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "An error occurred during login",
      });
    }
  });

  // POST /auth/change-password - Change password (requires authentication)
  server.post("/change-password", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    try {
      const { verifyToken } = await import("../lib/auth");
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      });

      const validation = changePasswordSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "New password must be at least 8 characters",
        });
      }

      const { currentPassword, newPassword } = validation.data;

      // Get user from database
      const user = await prisma.appUser.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return reply.status(404).send({
          error: "Not Found",
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(400).send({
          error: "Invalid Password",
          message: "Current password is incorrect",
        });
      }

      // Ensure new password is different
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        return reply.status(400).send({
          error: "Invalid Password",
          message: "New password must be different from current password",
        });
      }

      // Hash and update password
      const SALT_ROUNDS = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await prisma.appUser.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      return reply.status(200).send({
        message: "Password changed successfully",
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  });

  // GET /auth/me - Get current user info (requires authentication)
  server.get("/me", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    try {
      const { verifyToken } = await import("../lib/auth");
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      return reply.status(200).send({
        user: decoded,
      });
    } catch (error) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  });
};

export default authRoutes;
